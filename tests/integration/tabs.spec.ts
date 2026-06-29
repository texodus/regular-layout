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

// Each frame renders only its *own* tab, and the frames in a stack overlap; the
// tabs tile because every frame derives the same titlebar grid. The bundled
// example themes target `regular-layout.lorax` and assume the old flex/multi-tab
// titlebar, so these tests drop the theme class to exercise the default chrome.
const center = (page: Page, name: string) =>
	page.evaluate((name) => {
		const slot = document
			.querySelector(`regular-layout-frame[name="${name}"]`)
			?.shadowRoot?.querySelector('slot[name="tab"]') as HTMLElement | null;

		if (!slot) return null;
		const r = slot.getBoundingClientRect();
		return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
	}, name);

const activeLabel = (page: Page, name: string) =>
	page.evaluate((name) => {
		const title = document
			.querySelector(`regular-layout-frame[name="${name}"]`)
			?.shadowRoot?.querySelector('[part~="active-tab"] [part~="title"]');
		return title ? getComputedStyle(title, "::before").content : undefined;
	}, name);

test("should switch between tabs by clicking", async ({ page }) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");
	await page.evaluate(async (layout) => {
		const root = document.querySelector("regular-layout");
		if (root) root.className = "";
		await root?.restore(layout as Layout);
	}, LAYOUTS.SINGLE_TABS_WITH_SELECTED);

	// AAA is selected, so its own tab is the active one.
	expect(await activeLabel(page, "AAA")).toBe('"AAA"');

	// Click BBB's own tab (it tiles into column 2, clickable through the
	// overlapping frames).
	const bbb = await center(page, "BBB");
	expect(bbb).not.toBeNull();
	if (bbb) await page.mouse.click(bbb.x, bbb.y);
	await page.waitForFunction(() => {
		const l = document.querySelector("regular-layout");
		return (l?.save() as { selected?: number } | undefined)?.selected === 1;
	});

	expect(await activeLabel(page, "BBB")).toBe('"BBB"');
	expect(
		await page.evaluate(() => document.querySelector("regular-layout")?.save()),
	).toMatchObject({ type: "tab-layout", tabs: ["AAA", "BBB", "CCC"], selected: 1 });
});

test("should move a panel by dragging a selected tab", async ({ page }) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");
	await page.evaluate(async (layout) => {
		const layoutElement = document.querySelector("regular-layout");
		await layoutElement?.restore(layout as Layout);
	}, LAYOUTS.TWO_HORIZONTAL_WITH_TABS);

	const dragCoords = await page.evaluate(() => {
		const frame = document.querySelector('regular-layout-frame[name="AAA"]');
		const activeTab = frame?.shadowRoot?.querySelector(
			'[part~="active-tab"]',
		) as HTMLElement;

		if (!activeTab) return null;
		const tabRect = activeTab.getBoundingClientRect();
		const layout = document.querySelector("regular-layout");
		const layoutRect = layout?.getBoundingClientRect();
		if (!layoutRect) return null;
		return {
			fromX: tabRect.left + tabRect.width / 2,
			fromY: tabRect.top + tabRect.height / 2,
			toX: layoutRect.right - 50,
			toY: layoutRect.top + layoutRect.height / 2,
		};
	});

	expect(dragCoords).not.toBeNull();
	if (dragCoords) {
		await page.mouse.move(dragCoords.fromX, dragCoords.fromY);
		await page.mouse.down();
		await page.mouse.move(dragCoords.toX, dragCoords.toY);
		await page.mouse.up();
	}

	const layoutAfter = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(layoutAfter).toMatchObject({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "tab-layout",
				tabs: ["BBB"],
				selected: 0,
			},
			{
				type: "tab-layout",
				tabs: ["CCC"],
			},
			{
				type: "tab-layout",
				tabs: ["AAA"],
			},
		],
	});
});

test("should move a panel by dragging a deselected tab", async ({ page }) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");
	await page.evaluate(async (layout) => {
		const layoutElement = document.querySelector("regular-layout");
		if (layoutElement) layoutElement.className = "";
		await layoutElement?.restore(layout as Layout);
	}, LAYOUTS.TWO_HORIZONTAL_WITH_TABS);

	const layoutBefore = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(layoutBefore).toMatchObject({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "tab-layout",
				tabs: ["AAA", "BBB"],
				selected: 0,
			},
			{
				type: "tab-layout",
				tabs: ["CCC"],
			},
		],
	});

	// BBB is the deselected tab; in the own-tab model it lives in BBB's own
	// (overlapping) frame. Dragging it must move BBB, not the front-most AAA.
	const from = await center(page, "BBB");
	const to = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		const r = layout?.getBoundingClientRect();
		return r ? { x: r.right - 50, y: r.top + r.height / 2 } : { x: 0, y: 0 };
	});

	expect(from).not.toBeNull();
	if (from) {
		await page.mouse.move(from.x, from.y);
		await page.mouse.down();
		await page.mouse.move(to.x, to.y);
		await page.mouse.up();
	}

	const layoutAfter = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(layoutAfter).toMatchObject({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "tab-layout",
				tabs: ["AAA"],
				selected: 0,
			},
			{
				type: "tab-layout",
				tabs: ["CCC"],
			},
			{
				type: "tab-layout",
				tabs: ["BBB"],
			},
		],
	});
});

test("should label tabs from the `--<name>--title` CSS variable, falling back to `name`", async ({
	page,
}) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");

	const labels = await page.evaluate(async (layout) => {
		// AAA's label is overridden via CSS; BBB has no override and falls back
		// to its slot name. Each frame renders only its own tab, so AAA's label
		// lives in AAA's frame and BBB's in BBB's frame.
		const layoutElement = document.createElement("regular-layout");
		layoutElement.style.setProperty("--regular-layout-AAA--title", '"Alpha"');
		const aaa = document.createElement("regular-layout-frame");
		aaa.setAttribute("name", "AAA");
		const bbb = document.createElement("regular-layout-frame");
		bbb.setAttribute("name", "BBB");
		layoutElement.append(aaa, bbb);
		document.body.append(layoutElement);

		await layoutElement.restore(layout as Layout);

		const label = (frame: Element) => {
			const title = frame.shadowRoot?.querySelector('[part~="title"]');
			return title ? getComputedStyle(title, "::before").content : undefined;
		};

		return [label(aaa), label(bbb)];
	}, LAYOUTS.SINGLE_TABS as Layout);

	// `content` resolves to the (quoted) CSS string.
	expect(labels[0]).toBe('"Alpha"');
	expect(labels[1]).toBe('"BBB"');
});

test("should fire `regular-layout-select` when a tab is selected", async ({
	page,
}) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");

	await page.evaluate(async (layout) => {
		const layoutElement = document.querySelector("regular-layout");
		if (layoutElement) layoutElement.className = "";
		const selected: string[] = [];
		(window as unknown as { selected: string[] }).selected = selected;
		layoutElement?.addEventListener("regular-layout-select", (event) => {
			selected.push(event.detail.name);
		});

		await layoutElement?.restore(layout as Layout);
	}, LAYOUTS.SINGLE_TABS_WITH_SELECTED);

	// Click BBB's own tab (it tiles into its column, clickable through the
	// overlapping frames) - selection changes and the event fires.
	const bbb = await center(page, "BBB");
	expect(bbb).not.toBeNull();
	if (bbb) await page.mouse.click(bbb.x, bbb.y);
	await page.waitForFunction(
		() => (window as unknown as { selected: string[] }).selected.length >= 1,
	);

	// Re-click BBB's now-active tab - re-selection still fires.
	const bbbAgain = await center(page, "BBB");
	expect(bbbAgain).not.toBeNull();
	if (bbbAgain) await page.mouse.click(bbbAgain.x, bbbAgain.y);
	await page.waitForFunction(
		() => (window as unknown as { selected: string[] }).selected.length >= 2,
	);

	const selected = await page.evaluate(
		() => (window as unknown as { selected: string[] }).selected,
	);

	expect(selected).toEqual(["BBB", "BBB"]);
});
