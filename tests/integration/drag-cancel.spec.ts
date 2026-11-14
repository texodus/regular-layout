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
import {
	getLayoutBounds,
	saveLayout,
	setupLayout,
} from "../helpers/integration.ts";

const AFTER_DROP_AT_RIGHT_EDGE = {
	type: "split-layout",
	orientation: "horizontal",
	children: [
		{ type: "tab-layout", tabs: ["BBB"] },
		{ type: "tab-layout", tabs: ["CCC"] },
		{ type: "tab-layout", tabs: ["AAA"] },
	],
};

async function setup(page: Page, layout: Layout): Promise<Layout> {
	await setupLayout(page, layout);
	await page.evaluate(() => {
		const root = document.querySelector("regular-layout");
		if (root) root.className = "";
	});

	return await saveLayout(page);
}

async function tabCenter(page: Page, name: string) {
	const point = await page.evaluate((name) => {
		const slot = document
			.querySelector(`regular-layout-frame[name="${name}"]`)
			?.shadowRoot?.querySelector('slot[name="tab"]') as HTMLElement | null;

		if (!slot) return null;
		const r = slot.getBoundingClientRect();
		return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
	}, name);

	expect(point).not.toBeNull();
	return point as { x: number; y: number };
}

async function rightEdge(page: Page) {
	const bounds = await getLayoutBounds(page);
	return { x: bounds.x + bounds.width - 50, y: bounds.y + bounds.height / 2 };
}

async function frameRect(page: Page, name: string) {
	return await page.evaluate((name) => {
		const r = document
			.querySelector(`regular-layout-frame[name="${name}"]`)
			?.getBoundingClientRect();
		return r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
	}, name);
}

/**
 * Records the pointer events `name`'s frame receives, and how many drag
 * previews the layout renders, onto `window.__drag_log`.
 */
async function recordPointerEvents(page: Page, name: string) {
	await page.evaluate((name) => {
		const log: string[] = [];
		(window as unknown as { __drag_log: string[] }).__drag_log = log;
		const frame = document.querySelector(
			`regular-layout-frame[name="${name}"]`,
		);
		for (const type of [
			"pointerdown",
			"pointerup",
			"pointercancel",
			"lostpointercapture",
		]) {
			frame?.addEventListener(type, (e) => {
				log.push(`${type}:${(e as PointerEvent).pointerId}`);
			});
		}

		document
			.querySelector("regular-layout")
			?.addEventListener("regular-layout-before-update", () => {
				log.push("preview");
			});
	}, name);
}

async function pointerLog(page: Page): Promise<string[]> {
	return await page.evaluate(
		() => (window as unknown as { __drag_log: string[] }).__drag_log,
	);
}

/** Starts a mouse drag of `name`'s tab and waits for the overlay preview. */
async function startMouseDrag(page: Page, name: string) {
	const from = await tabCenter(page, name);
	const to = await rightEdge(page);
	await page.mouse.move(from.x, from.y);
	await page.mouse.down();
	await page.mouse.move(to.x, to.y, { steps: 5 });
	await expect(
		page.locator(`regular-layout-frame[name="${name}"]`),
	).toHaveClass(/\boverlay\b/);

	return to;
}

/** Drags a real (CDP-dispatched) touch point in small increments. */
async function touchDrag(
	page: Page,
	from: { x: number; y: number },
	to: { x: number; y: number },
	steps = 40,
) {
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
	}

	await cdp.send("Input.dispatchTouchEvent", {
		type: "touchEnd",
		touchPoints: [],
	});

	await cdp.detach();
}

test("clearOverlayState(null) restores the pre-drag layout", async ({
	page,
}) => {
	const before = await setup(page, LAYOUTS.THREE_HORIZONTAL);
	const rect_before = await frameRect(page, "AAA");
	const to = await rightEdge(page);
	const from = await page.evaluate(() => {
		const r = document
			.querySelector('regular-layout-frame[name="AAA"]')
			?.getBoundingClientRect();
		return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
	});

	expect(from).not.toBeNull();
	await page.evaluate(
		async ({ from, to }) => {
			const layout = document.querySelector("regular-layout");
			const path = layout?.calculateIntersect({
				clientX: from.x,
				clientY: from.y,
			});

			if (layout && path) {
				await layout.setOverlayState({ clientX: to.x, clientY: to.y }, path);
				await layout.clearOverlayState(null, path);
			}
		},
		{ from: from as { x: number; y: number }, to },
	);

	expect(await saveLayout(page)).toEqual(before);
	await expect(
		page.locator('regular-layout-frame[name="AAA"]'),
	).not.toHaveClass(/\boverlay\b/);
	expect(await frameRect(page, "AAA")).toEqual(rect_before);
});

test("pointercancel during a tab drag restores the pre-drag layout", async ({
	page,
}) => {
	const before = await setup(page, LAYOUTS.THREE_HORIZONTAL);
	const rect_before = await frameRect(page, "AAA");
	await startMouseDrag(page, "AAA");
	await page.evaluate(() => {
		document
			.querySelector('regular-layout-frame[name="AAA"]')
			?.dispatchEvent(
				new PointerEvent("pointercancel", { pointerId: 1, bubbles: true }),
			);
	});

	await expect(
		page.locator('regular-layout-frame[name="AAA"]'),
	).not.toHaveClass(/\boverlay\b/);
	expect(await saveLayout(page)).toEqual(before);
	expect(await frameRect(page, "AAA")).toEqual(rect_before);

	// The cancelled drag must not be committed by the eventual release.
	await page.mouse.up();
	expect(await saveLayout(page)).toEqual(before);
});

test("losing pointer capture during a tab drag restores the pre-drag layout", async ({
	page,
}) => {
	const before = await setup(page, LAYOUTS.THREE_HORIZONTAL);
	const rect_before = await frameRect(page, "AAA");
	await recordPointerEvents(page, "AAA");
	const to = await startMouseDrag(page, "AAA");
	const down = (await pointerLog(page)).find((e) =>
		e.startsWith("pointerdown:"),
	);

	const pointer_id = Number(down?.split(":")[1]);
	await page.evaluate((pointer_id) => {
		document
			.querySelector('regular-layout-frame[name="AAA"]')
			?.releasePointerCapture(pointer_id);
	}, pointer_id);

	// `lostpointercapture` is dispatched before the next pointer event.
	await page.mouse.move(to.x - 10, to.y);
	await expect(
		page.locator('regular-layout-frame[name="AAA"]'),
	).not.toHaveClass(/\boverlay\b/);
	expect(await saveLayout(page)).toEqual(before);
	expect(await frameRect(page, "AAA")).toEqual(rect_before);

	await page.mouse.up();
	expect(await saveLayout(page)).toEqual(before);
});

test("a completed mouse drag is not reverted by the trailing lostpointercapture", async ({
	page,
}) => {
	await setup(page, LAYOUTS.THREE_HORIZONTAL);
	await recordPointerEvents(page, "AAA");
	await startMouseDrag(page, "AAA");
	await page.mouse.up();
	await expect
		.poll(async () => await pointerLog(page))
		.toContainEqual(expect.stringMatching(/^lostpointercapture:/));

	expect(await saveLayout(page)).toMatchObject(AFTER_DROP_AT_RIGHT_EDGE);
	await expect(
		page.locator('regular-layout-frame[name="AAA"]'),
	).not.toHaveClass(/\boverlay\b/);
});

test.describe("touch", () => {
	test.use({ hasTouch: true });

	test("a touch drag on a tab moves the panel", async ({ page }) => {
		await setup(page, LAYOUTS.THREE_HORIZONTAL);
		await recordPointerEvents(page, "AAA");
		await touchDrag(page, await tabCenter(page, "AAA"), await rightEdge(page));

		await expect
			.poll(async () => await saveLayout(page))
			.toMatchObject(AFTER_DROP_AT_RIGHT_EDGE);

		const log = await pointerLog(page);
		expect(log.some((e) => e.startsWith("pointercancel:"))).toBe(false);
		expect(log.some((e) => e.startsWith("pointerup:"))).toBe(true);
		await expect(
			page.locator('regular-layout-frame[name="AAA"]'),
		).not.toHaveClass(/\boverlay\b/);
	});

	test("a touch drag the browser cancels restores the pre-drag layout", async ({
		page,
	}) => {
		const before = await setup(page, LAYOUTS.THREE_HORIZONTAL);
		const rect_before = await frameRect(page, "AAA");

		// Re-enable browser panning on the titlebar, so the browser claims the
		// gesture and cancels the pointer mid-drag.
		await page.addStyleTag({
			content: "regular-layout-frame::part(titlebar){touch-action:auto}",
		});

		await recordPointerEvents(page, "AAA");
		await touchDrag(page, await tabCenter(page, "AAA"), await rightEdge(page));

		await expect
			.poll(async () => await pointerLog(page))
			.toContainEqual(expect.stringMatching(/^pointercancel:/));

		// The drag must have started (rendered a preview) before the cancel,
		// or this would not exercise the revert.
		expect(await pointerLog(page)).toContain("preview");
		await expect(
			page.locator('regular-layout-frame[name="AAA"]'),
		).not.toHaveClass(/\boverlay\b/);
		expect(await saveLayout(page)).toEqual(before);
		expect(await frameRect(page, "AAA")).toEqual(rect_before);
	});
});
