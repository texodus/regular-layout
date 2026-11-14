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

type Point = { x: number; y: number };

async function setup(page: Page): Promise<Point> {
	await setupLayout(page, LAYOUTS.THREE_HORIZONTAL);
	const divider = await page.evaluate(() => {
		const log: string[] = [];
		(window as unknown as { __log: string[] }).__log = log;
		const root = document.querySelector("regular-layout");
		for (const type of [
			"pointerdown",
			"pointerup",
			"pointercancel",
			"lostpointercapture",
		]) {
			root?.addEventListener(type, (e) => {
				log.push(`${type}:${(e as PointerEvent).pointerId}`);
			});
		}

		const r = document
			.querySelector('regular-layout-frame[name="AAA"]')
			?.getBoundingClientRect();

		if (!r) return null;
		const point = { x: r.right, y: r.y + r.height / 2 };
		const hit = document.elementFromPoint(point.x, point.y);
		return { ...point, hit: hit?.tagName.toLowerCase() };
	});

	expect(divider?.hit).toBe("regular-layout");
	return divider as Point;
}

const log = (page: Page) =>
	page.evaluate(() => (window as unknown as { __log: string[] }).__log);

async function pointerId(page: Page): Promise<number> {
	const down = (await log(page)).find((e) => e.startsWith("pointerdown:"));
	expect(down).toBeDefined();
	return Number(down?.split(":")[1]);
}

const width = (page: Page) =>
	page.evaluate(() =>
		Math.round(
			document
				.querySelector('regular-layout-frame[name="AAA"]')
				?.getBoundingClientRect().width ?? 0,
		),
	);

const sizes = async (page: Page) =>
	((await saveLayout(page)) as Layout & { sizes: number[] }).sizes;

async function startMouseDrag(page: Page, from: Point, dx: number) {
	const before = await width(page);
	await page.mouse.move(from.x, from.y);
	await page.mouse.down();
	await page.mouse.move(from.x + dx, from.y, { steps: 5 });
	await expect.poll(() => width(page)).toBeGreaterThan(before + dx / 2);
	return before;
}

async function touchDrag(page: Page, from: Point, to: Point, steps = 30) {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Input.dispatchTouchEvent", {
		type: "touchStart",
		touchPoints: [from],
	});

	for (let i = 1; i <= steps; i++) {
		await cdp.send("Input.dispatchTouchEvent", {
			type: "touchMove",
			touchPoints: [
				{
					x: from.x + ((to.x - from.x) * i) / steps,
					y: from.y + ((to.y - from.y) * i) / steps,
				},
			],
		});

		await page.waitForTimeout(16);
	}

	await cdp.send("Input.dispatchTouchEvent", {
		type: "touchEnd",
		touchPoints: [],
	});

	await cdp.detach();
}

test("pointercancel during a divider drag discards its preview", async ({
	page,
}) => {
	const divider = await setup(page);
	const sizes_before = await sizes(page);
	const before = await startMouseDrag(page, divider, 150);
	const id = await pointerId(page);
	await page.evaluate((id) => {
		document
			.querySelector("regular-layout")
			?.dispatchEvent(
				new PointerEvent("pointercancel", { pointerId: id, bubbles: true }),
			);
	}, id);

	await expect.poll(() => width(page)).toBe(before);
	expect(await sizes(page)).toEqual(sizes_before);

	// The cancelled drag must not be committed by the eventual release.
	await page.mouse.up();
	expect(await sizes(page)).toEqual(sizes_before);
	expect(await width(page)).toBe(before);
});

test("losing pointer capture during a divider drag discards its preview", async ({
	page,
}) => {
	const divider = await setup(page);
	const sizes_before = await sizes(page);
	const before = await startMouseDrag(page, divider, 150);
	const id = await pointerId(page);
	await page.evaluate((id) => {
		document.querySelector("regular-layout")?.releasePointerCapture(id);
	}, id);

	// `lostpointercapture` is dispatched before the next pointer event.
	await page.mouse.move(divider.x + 140, divider.y);
	await expect.poll(() => width(page)).toBe(before);
	expect(await sizes(page)).toEqual(sizes_before);

	await page.mouse.up();
	expect(await sizes(page)).toEqual(sizes_before);
});

test("a pointercancel for another pointer does not abort a divider drag", async ({
	page,
}) => {
	const divider = await setup(page);
	const sizes_before = await sizes(page);
	await startMouseDrag(page, divider, 150);
	const id = await pointerId(page);

	// e.g. a second finger's gesture, bubbling up from a frame.
	await page.evaluate((id) => {
		document.querySelector('regular-layout-frame[name="CCC"]')?.dispatchEvent(
			new PointerEvent("pointercancel", {
				pointerId: id + 1,
				bubbles: true,
			}),
		);
	}, id);

	await page.mouse.up();
	const [aaa] = await sizes(page);
	expect(aaa).toBeGreaterThan(sizes_before[0]);
});

test.describe("touch", () => {
	test.use({ hasTouch: true });

	test("a touch drag on a divider resizes it", async ({ page }) => {
		const divider = await setup(page);
		const sizes_before = await sizes(page);
		await touchDrag(page, divider, { x: divider.x + 150, y: divider.y });

		await expect
			.poll(async () => (await sizes(page))[0])
			.toBeGreaterThan(sizes_before[0]);

		const events = await log(page);
		expect(events.some((e) => e.startsWith("pointercancel:"))).toBe(false);
		expect(events.some((e) => e.startsWith("pointerup:"))).toBe(true);
	});

	test("touch swipes away from dividers still scroll panels and the page", async ({
		page,
	}) => {
		await setup(page);
		const { scroller, panel } = await page.evaluate(() => {
			document.body.style.height = "3000px";
			const aaa = document.querySelector('regular-layout-frame[name="AAA"]');
			if (aaa) {
				aaa.innerHTML = `<div id="scroller" style="height:300px;overflow:auto"><div style="height:3000px"></div></div>`;
			}

			const s = document.getElementById("scroller")?.getBoundingClientRect();
			const b = document
				.querySelector('regular-layout-frame[name="BBB"]')
				?.getBoundingClientRect();

			return {
				scroller: s ? { x: s.x + s.width / 2, y: s.y + 250 } : null,
				panel: b ? { x: b.x + b.width / 2, y: b.y + b.height * 0.8 } : null,
			};
		});

		expect(scroller).not.toBeNull();
		expect(panel).not.toBeNull();
		if (!scroller || !panel) return;

		// Inside a panel's own scroll container.
		await touchDrag(page, scroller, { x: scroller.x, y: scroller.y - 200 });
		await expect
			.poll(() =>
				page.evaluate(
					() => document.getElementById("scroller")?.scrollTop ?? 0,
				),
			)
			.toBeGreaterThan(100);

		// On a panel with no scroll container, which pans the page.
		await touchDrag(page, panel, { x: panel.x, y: panel.y - 300 });
		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(100);
	});

	test("a browser-cancelled touch divider drag is discarded, not committed by a later tap", async ({
		page,
	}) => {
		const divider = await setup(page);
		await page.evaluate(() => {
			document
				.querySelector("regular-layout")
				?.restorePhysics({ GRID_DIVIDER_TOUCH_RESIZE: false });
		});

		const sizes_before = await sizes(page);
		const before = await width(page);
		await touchDrag(page, divider, { x: divider.x + 150, y: divider.y });
		await expect
			.poll(() => log(page))
			.toContainEqual(expect.stringMatching(/^pointercancel:/));

		await expect.poll(() => width(page)).toBe(before);
		expect(await sizes(page)).toEqual(sizes_before);

		const ccc = await page.evaluate(() => {
			const r = document
				.querySelector('regular-layout-frame[name="CCC"]')
				?.getBoundingClientRect();
			return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
		});

		expect(ccc).not.toBeNull();
		if (!ccc) return;
		await page.touchscreen.tap(ccc.x, ccc.y);
		await page.waitForTimeout(100);
		expect(await sizes(page)).toEqual(sizes_before);
		expect(await width(page)).toBe(before);
	});

	test("GRID_DIVIDER_TOUCH_RESIZE can be turned back on", async ({ page }) => {
		const divider = await setup(page);
		await page.evaluate(() => {
			const root = document.querySelector("regular-layout");
			root?.restorePhysics({ GRID_DIVIDER_TOUCH_RESIZE: false });
			root?.restorePhysics({ GRID_DIVIDER_TOUCH_RESIZE: true });
		});

		const sizes_before = await sizes(page);
		await touchDrag(page, divider, { x: divider.x + 150, y: divider.y });
		await expect
			.poll(async () => (await sizes(page))[0])
			.toBeGreaterThan(sizes_before[0]);
	});
});
