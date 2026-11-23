// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ░░░░░░░░▄▀░█▀▄░█▀▀░█▀▀░█░█░█░░░█▀█░█▀▄░░░░░█░░░█▀█░█░█░█▀█░█░█░▀█▀░▀▄░░░░░░░░
// ░░░░░░░▀▄░░█▀▄░█▀▀░█░█░█░█░█░░░█▀█░█▀▄░▀▀▀░█░░░█▀█░░█░░█░█░█░█░░█░░░▄▀░░░░░░░
// ░░░░░░░░░▀░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀░▀░░░░░▀▀▀░▀░▀░░▀░░▀▀▀░▀▀▀░░▀░░▀░░░░░░░░░
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  *  Copyright (c) 2026, the Regular Layout Authors. This file is part  *  ┃
// ┃  *  of the Regular Layout library, distributed under the terms of the  *  ┃
// ┃  *  [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). *  ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { expect, test } from "../helpers/coverage.ts";
import type { Page } from "@playwright/test";
import type { Layout } from "../../dist/index.js";
import { LAYOUTS } from "../helpers/fixtures.ts";
import { saveLayout, setupLayout } from "../helpers/integration.ts";

type Entry = { source: string; layout: Layout } | { event: string };

/**
 * Records `regular-layout-change` (and, interleaved, `-before-resize` and
 * `-update`) onto `window.__changes`.
 */
async function record(page: Page) {
	await page.evaluate(() => {
		const log: unknown[] = [];
		(window as unknown as { __changes: unknown[] }).__changes = log;
		const root = document.querySelector("regular-layout");
		root?.addEventListener("regular-layout-change", (e) => {
			log.push({
				source: e.detail.source,
				layout: structuredClone(e.detail.layout),
			});
		});

		root?.addEventListener("regular-layout-before-resize", () => {
			log.push({ event: "before-resize" });
		});

		root?.addEventListener("regular-layout-update", () => {
			log.push({ event: "update" });
		});
	});
}

const entries = (page: Page) =>
	page.evaluate(
		() => (window as unknown as { __changes: Entry[] }).__changes,
	) as Promise<Entry[]>;

const changes = async (page: Page) =>
	(await entries(page)).filter(
		(e): e is { source: string; layout: Layout } => "source" in e,
	);

async function setup(page: Page, layout: Layout) {
	await setupLayout(page, layout);
	await record(page);
}

async function dividerAfter(page: Page, name: string) {
	const point = await page.evaluate((name) => {
		const r = document
			.querySelector(`regular-layout-frame[name="${name}"]`)
			?.getBoundingClientRect();
		return r ? { x: r.right, y: r.y + r.height / 2 } : null;
	}, name);

	expect(point).not.toBeNull();
	return point as { x: number; y: number };
}

test("api calls fire a synchronous api change before before-resize", async ({
	page,
}) => {
	await setup(page, LAYOUTS.SINGLE_AAA);
	const sync = await page.evaluate(() => {
		const root = document.querySelector("regular-layout");
		const log = (window as unknown as { __changes: unknown[] }).__changes;
		void root?.insertPanel("BBB", [1]);
		return log.length;
	});

	// The change was observed before `insertPanel` returned.
	expect(sync).toBeGreaterThan(0);
	const log = await entries(page);
	expect(log[0]).toMatchObject({ source: "api" });
	expect(log[1]).toEqual({ event: "before-resize" });
	expect((await changes(page))[0].layout).toEqual(await saveLayout(page));
});

test("a parked change reports the newest tree when requested, not when applied", async ({
	page,
}) => {
	await setup(page, LAYOUTS.SINGLE_AAA);
	const result = await page.evaluate(async () => {
		const root = document.querySelector("regular-layout");
		const log = (window as unknown as { __changes: unknown[] }).__changes;
		let gate = true;
		root?.addEventListener("regular-layout-before-resize", (e) => {
			if (gate) {
				gate = false;
				e.preventDefault();
			}
		});

		const done = Promise.all([
			root?.insertPanel("BBB", [1]),
			root?.insertPanel("CCC", [2]),
		]);

		// Both changes are reported while the first is still parked.
		const before_resume = log.filter(
			(e) => (e as { source?: string }).source,
		).length;

		root?.resumeResize();
		await done;
		return before_resume;
	});

	expect(result).toBe(2);
	const all = await changes(page);
	expect(all.map((c) => c.source)).toEqual(["api", "api"]);
	expect(all[1].layout).toEqual(await saveLayout(page));
});

test("restoreSync from a change listener supersedes the pending change", async ({
	page,
}) => {
	await setup(page, LAYOUTS.SINGLE_AAA);
	const layout = await page.evaluate(async (replacement) => {
		const root = document.querySelector("regular-layout");
		root?.addEventListener(
			"regular-layout-change",
			() => root.restoreSync(replacement as Layout),
			{ once: true } as unknown as { signal: AbortSignal },
		);

		await root?.insertPanel("BBB", [1]);
		return root?.save();
	}, LAYOUTS.SINGLE_DDD);

	expect(layout).toMatchObject(LAYOUTS.SINGLE_DDD);
});

test("a divider drag fires one user change on commit, none for previews", async ({
	page,
}) => {
	await setup(page, LAYOUTS.THREE_HORIZONTAL);
	const from = await dividerAfter(page, "AAA");
	await page.mouse.move(from.x, from.y);
	await page.mouse.down();
	await page.mouse.move(from.x + 100, from.y, { steps: 5 });
	expect(await changes(page)).toEqual([]);

	await page.mouse.up();
	await expect.poll(async () => (await changes(page)).length).toBe(1);
	const [change] = await changes(page);
	expect(change.source).toBe("user");
	expect(change.layout).toEqual(await saveLayout(page));
});

test("a cancelled divider drag fires no change", async ({ page }) => {
	await setup(page, LAYOUTS.THREE_HORIZONTAL);
	const from = await dividerAfter(page, "AAA");
	await page.mouse.move(from.x, from.y);
	await page.mouse.down();
	await page.mouse.move(from.x + 100, from.y, { steps: 5 });
	await page.evaluate(() => {
		const root = document.querySelector("regular-layout");
		for (const id of [1, 2, 3]) {
			root?.dispatchEvent(
				new PointerEvent("pointercancel", { pointerId: id, bubbles: true }),
			);
		}
	});

	await page.mouse.up();
	await page.waitForTimeout(50);
	expect(await changes(page)).toEqual([]);
});

test("a divider double-click fires a user change", async ({ page }) => {
	await setup(page, LAYOUTS.TWO_HORIZONTAL);
	const at = await dividerAfter(page, "AAA");
	await page.mouse.dblclick(at.x, at.y);
	await expect.poll(async () => (await changes(page)).length).toBe(1);
	expect((await changes(page))[0].source).toBe("user");
});

test("a tab drag-and-drop fires a user change, a cancelled one none", async ({
	page,
}) => {
	await setup(page, LAYOUTS.THREE_HORIZONTAL);
	const path = await page.evaluate(() => {
		const root = document.querySelector("regular-layout");
		const r = document
			.querySelector('regular-layout-frame[name="AAA"]')
			?.getBoundingClientRect();
		return r
			? root?.calculateIntersect({ clientX: r.x + 5, clientY: r.y + 50 })
			: null;
	});

	expect(path).toBeTruthy();
	const box = await page.locator("regular-layout").boundingBox();
	expect(box).not.toBeNull();
	if (!box || !path) return;
	const drop = { clientX: box.x + box.width - 20, clientY: box.y + 100 };

	await page.evaluate(
		async ({ path, drop }) => {
			const root = document.querySelector("regular-layout");
			await root?.setOverlayState(drop, path);
			await root?.clearOverlayState(null, path);
		},
		{ path, drop },
	);

	expect(await changes(page)).toEqual([]);

	await page.evaluate(
		async ({ path, drop }) => {
			const root = document.querySelector("regular-layout");
			await root?.setOverlayState(drop, path);
			await root?.clearOverlayState(drop, path);
		},
		{ path, drop },
	);

	const all = await changes(page);
	expect(all.map((c) => c.source)).toEqual(["user"]);
	expect(all[0].layout).toEqual(await saveLayout(page));
});

test("tab select and close fire user changes", async ({ page }) => {
	await setup(page, LAYOUTS.TWO_HORIZONTAL_WITH_TABS);
	const press = (name: string, close: boolean) =>
		page.evaluate(
			({ name, close }) => {
				const tab = document
					.querySelector(`regular-layout-frame[name="${name}"]`)
					?.shadowRoot?.querySelector("regular-layout-tab");
				const target = close ? tab?.children[1] : tab;
				target?.dispatchEvent(new PointerEvent("pointerdown", { button: 0 }));
			},
			{ name, close },
		);

	await press("BBB", false);
	await expect.poll(async () => (await changes(page)).length).toBe(1);
	const select = (await changes(page))[0];
	expect(select.source).toBe("user");
	expect(select.layout).toMatchObject({
		children: [{ tabs: ["AAA", "BBB"], selected: 1 }, { tabs: ["CCC"] }],
	});

	await press("BBB", true);
	await expect.poll(async () => (await changes(page)).length).toBe(2);
	const close = (await changes(page))[1];
	expect(close.source).toBe("user");
	expect(JSON.stringify(close.layout)).not.toContain('"BBB"');
});

test("maximize and minimize fire no change", async ({ page }) => {
	await setup(page, LAYOUTS.TWO_HORIZONTAL);
	await page.evaluate(async () => {
		const root = document.querySelector("regular-layout");
		await root?.maximize("AAA");
		await root?.minimize();
	});

	expect(await changes(page)).toEqual([]);
});
