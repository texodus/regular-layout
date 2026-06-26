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
import type { Layout } from "../../dist/index.js";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should switch between tabs by clicking", async ({ page }) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");
	await page.evaluate(async (layout) => {
		const layoutElement = document.querySelector("regular-layout");
		await layoutElement?.restore(layout as Layout);
	}, LAYOUTS.SINGLE_TABS_WITH_SELECTED);

	const getSelectedTab = async (slot: string) => {
		return await page.evaluate((slot) => {
			const frame = document.querySelector(
				`regular-layout-frame[name=${slot}]`,
			);
			const title = frame?.shadowRoot?.querySelector(
				'[part~="active-tab"] [part~="title"]',
			);
			// The label renders via the title's `::before` `content`.
			return title ? getComputedStyle(title, "::before").content : undefined;
		}, slot);
	};

	const selectedBefore = await getSelectedTab("AAA");
	expect(selectedBefore).toBe('"AAA"');
	const frameBounds = await page.evaluate(() => {
		const frame = document.querySelector('regular-layout-frame[name="AAA"]');
		const tabs = frame?.shadowRoot?.querySelectorAll('[part~="tab"]');
		if (!tabs || tabs.length < 2) return null;
		const secondTab = tabs[1] as HTMLElement;
		const rect = secondTab.getBoundingClientRect();
		return {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2,
		};
	});

	expect(frameBounds).not.toBeNull();
	if (frameBounds) {
		await page.mouse.click(frameBounds.x, frameBounds.y);
	}

	// Since tab selection has happened, the visible titlebar is now "BBB"'s
	const selectedAfter = await getSelectedTab("BBB");
	expect(selectedAfter).toBe('"BBB"');
	const layoutState = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(layoutState).toMatchObject({
		type: "tab-layout",
		tabs: ["AAA", "BBB", "CCC"],
		selected: 1,
	});
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

	const dragCoords = await page.evaluate(() => {
		const frame = document.querySelector('regular-layout-frame[name="AAA"]');
		const tabs = frame?.shadowRoot?.querySelectorAll('[part~="tab"]');
		if (!tabs || tabs.length < 2) return null;
		const inactiveTab = Array.from(tabs).find(
			(tab) => !tab.getAttribute("part")?.includes("active-tab"),
		) as HTMLElement;

		if (!inactiveTab) return null;
		const tabRect = inactiveTab.getBoundingClientRect();
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
		// to its slot name. Labels render via the title's `::before` `content`.
		const layoutElement = document.createElement("regular-layout");
		layoutElement.style.setProperty("--regular-layout-AAA--title", '"Alpha"');
		const aaa = document.createElement("regular-layout-frame");
		aaa.setAttribute("name", "AAA");
		const bbb = document.createElement("regular-layout-frame");
		bbb.setAttribute("name", "BBB");
		layoutElement.append(aaa, bbb);
		document.body.append(layoutElement);

		await layoutElement.restore(layout as Layout);

		const tabs = Array.from(
			aaa.shadowRoot?.querySelectorAll('[part~="title"]') ?? [],
		);

		return tabs.map((tab) => getComputedStyle(tab, "::before").content);
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
		const selected: string[] = [];
		(window as unknown as { selected: string[] }).selected = selected;
		layoutElement?.addEventListener("regular-layout-select", (event) => {
			selected.push(event.detail.name);
		});

		await layoutElement?.restore(layout as Layout);
	}, LAYOUTS.SINGLE_TABS_WITH_SELECTED);

	// Locate a tab within a specific frame's titlebar. Only the selected
	// panel's frame is visible (others are `display:none`), so the re-click
	// must target whichever frame is currently front-most.
	const tabCenter = (frameName: string, index: number) =>
		page.evaluate(
			({ frameName, index }) => {
				const frame = document.querySelector(
					`regular-layout-frame[name="${frameName}"]`,
				);

				const tab = frame?.shadowRoot?.querySelectorAll('[part~="tab"]')[
					index
				] as HTMLElement | undefined;

				if (!tab) return null;
				const rect = tab.getBoundingClientRect();
				return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
			},
			{ frameName, index },
		);

	// Click background tab BBB (index 1) in the visible AAA frame - selection
	// changes and the event fires.
	const bbb = await tabCenter("AAA", 1);
	expect(bbb).not.toBeNull();
	if (bbb) await page.mouse.click(bbb.x, bbb.y);
	await page.waitForFunction(
		() => (window as unknown as { selected: string[] }).selected.length >= 1,
	);

	// Re-click the now-active BBB tab in the now-visible BBB frame -
	// re-selection still fires.
	const bbbAgain = await tabCenter("BBB", 1);
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
