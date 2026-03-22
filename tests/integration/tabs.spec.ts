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
			const activeTab = frame?.shadowRoot?.querySelector(
				'[part~="active-tab"]',
			);
			return activeTab?.textContent;
		}, slot);
	};

	const selectedBefore = await getSelectedTab("AAA");
	expect(selectedBefore).toBe("AAA");
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
	expect(selectedAfter).toBe("BBB");
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
