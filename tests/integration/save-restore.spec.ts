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

import { expect, test } from "@playwright/test";
import {
	setupLayout,
	saveLayout,
	restoreLayout,
	getSlots,
	expectSlots,
	insertPanel,
} from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should save and restore various layout types", async ({ page }) => {
	// Test single panel
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const currentState = await saveLayout(page);
	expect(currentState).toStrictEqual({
		type: "child-panel",
		child: ["AAA"],
		selected: 0,
	});

	// Test 2-panel horizontal
	await restoreLayout(page, LAYOUTS.TWO_HORIZONTAL);
	const currentState2 = await saveLayout(page);
	expect(currentState2).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				child: ["AAA"],
				selected: 0,
			},
			{
				type: "child-panel",
				child: ["BBB"],
				selected: 0,
			},
		],
		sizes: [0.3, 0.7],
	});

	// Test nested layout
	await restoreLayout(page, LAYOUTS.NESTED_BASIC);
	const currentState3 = await saveLayout(page);
	expect(currentState3).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
						type: "child-panel",
						child: ["AAA"],
						selected: 0,
					},
					{
						type: "child-panel",
						child: ["BBB"],
						selected: 0,
					},
				],
				sizes: [0.3, 0.7],
			},
			{
				type: "child-panel",
				child: ["CCC"],
				selected: 0,
			},
		],
		sizes: [0.6, 0.4],
	});
});

test("should save, modify, and revert to saved state", async ({ page }) => {
	// Simple case: single panel
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const saved1 = await saveLayout(page);
	await restoreLayout(page, LAYOUTS.SINGLE_BBB);
	await restoreLayout(page, saved1);
	const restored1 = await saveLayout(page);
	expect(restored1).toStrictEqual(saved1);

	// Complex case: nested layout
	await restoreLayout(page, LAYOUTS.NESTED_BASIC);
	const saved2 = await saveLayout(page);
	await restoreLayout(page, LAYOUTS.SINGLE_DDD);
	await restoreLayout(page, saved2);
	const restored2 = await saveLayout(page);
	expect(restored2).toStrictEqual(saved2);
});

test("should save returns a deep clone, not a reference", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const saved = await saveLayout(page);
	await insertPanel(page, "CCC", []);
	const afterModification = await saveLayout(page);
	expect(afterModification).not.toStrictEqual(saved);
	expect(saved).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				child: ["AAA"],
				selected: 0,
			},
			{
				type: "child-panel",
				child: ["BBB"],
				selected: 0,
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("should restore updates shadow DOM slots correctly", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const initialSlots = await getSlots(page);
	expect(initialSlots).toContain("AAA");
	expect(initialSlots).toContain("BBB");
	expect(initialSlots).toHaveLength(2);
	await restoreLayout(page, LAYOUTS.THREE_VERTICAL_CDE);
	await expectSlots(page, {
		notContains: ["AAA", "BBB"],
		contains: ["CCC", "DDD", "EEE"],
	});

	const updatedSlots = await getSlots(page);
	expect(updatedSlots).toHaveLength(3);
});

test("should save and restore preserve exact size ratios", async ({ page }) => {
	await setupLayout(page, LAYOUTS.THREE_HORIZONTAL_PRECISE);
	const saved = await saveLayout(page);
	expect(saved).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				child: ["AAA"],
				selected: 0,
			},
			{
				type: "child-panel",
				child: ["BBB"],
				selected: 0,
			},
			{
				type: "child-panel",
				child: ["CCC"],
				selected: 0,
			},
		],
		sizes: [0.123456789, 0.456789123, 0.419754088],
	});
	await restoreLayout(page, saved);
	const restored = await saveLayout(page);
	expect(restored).toStrictEqual(saved);
});

test("should save and restore handle empty then populated layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const saved1 = await saveLayout(page);
	await insertPanel(page, "BBB", []);
	await insertPanel(page, "CCC", []);
	const saved2 = await saveLayout(page);
	await restoreLayout(page, saved1);
	const restored1 = await saveLayout(page);
	expect(restored1).toStrictEqual(saved1);
	await restoreLayout(page, saved2);
	const restored2 = await saveLayout(page);
	expect(restored2).toStrictEqual(saved2);
});
