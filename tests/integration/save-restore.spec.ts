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
	expectLayoutState,
	getSlots,
	expectSlots,
	restoreAndVerify,
	insertPanel,
} from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should save and restore various layout types", async ({ page }) => {
	// Test single panel
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	await expectLayoutState(page, LAYOUTS.SINGLE_AAA);

	// Test 2-panel horizontal
	await restoreLayout(page, LAYOUTS.TWO_HORIZONTAL);
	await expectLayoutState(page, LAYOUTS.TWO_HORIZONTAL);

	// Test nested layout
	await restoreLayout(page, LAYOUTS.NESTED_BASIC);
	await expectLayoutState(page, LAYOUTS.NESTED_BASIC);
});

test("should save, modify, and revert to saved state", async ({ page }) => {
	// Simple case: single panel
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const saved1 = await saveLayout(page);
	await restoreLayout(page, LAYOUTS.SINGLE_BBB);
	await restoreAndVerify(page, saved1);

	// Complex case: nested layout
	await restoreLayout(page, LAYOUTS.NESTED_BASIC);
	const saved2 = await saveLayout(page);
	await restoreLayout(page, LAYOUTS.SINGLE_DDD);
	await restoreAndVerify(page, saved2);
});

test("should save and restore a deeply nested layout", async ({ page }) => {
	await setupLayout(page, LAYOUTS.DEEPLY_NESTED_ALT);
	await expectLayoutState(page, LAYOUTS.DEEPLY_NESTED_ALT);
});

test("should save returns a deep clone, not a reference", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const saved = await saveLayout(page);
	await insertPanel(page, "CCC", []);
	const afterModification = await saveLayout(page);
	expect(afterModification).not.toStrictEqual(saved);
	expect(saved).toStrictEqual(LAYOUTS.TWO_HORIZONTAL_EQUAL);
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
	expect(saved).toStrictEqual(LAYOUTS.THREE_HORIZONTAL_PRECISE);
	await restoreAndVerify(page, saved);
});

test("should save and restore handle empty then populated layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const saved1 = await saveLayout(page);
	await insertPanel(page, "BBB", []);
	await insertPanel(page, "CCC", []);
	const saved2 = await saveLayout(page);
	await restoreAndVerify(page, saved1);
	await restoreAndVerify(page, saved2);
});
