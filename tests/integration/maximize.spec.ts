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
import { setupLayout, saveLayout } from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

const panelDisplay = (page: import("@playwright/test").Page, name: string) =>
	page.evaluate((name) => {
		const panel = document.querySelector(`[name="${name}"]`);
		return panel ? getComputedStyle(panel).display : undefined;
	}, name);

test("should maximize a panel, hiding the others", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(() => {
		document.querySelector("regular-layout")?.maximize("AAA");
	});

	// The maximized panel fills the layout; the other is hidden.
	expect(await panelDisplay(page, "AAA")).toBe("flex");
	expect(await panelDisplay(page, "BBB")).toBe("none");
});

test("should minimize back to the normal multi-panel view", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		layout?.maximize("AAA");
		layout?.minimize();
	});

	expect(await panelDisplay(page, "AAA")).toBe("flex");
	expect(await panelDisplay(page, "BBB")).toBe("flex");
});

test("should not persist maximize state in `save`", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const before = await saveLayout(page);

	await page.evaluate(() => {
		document.querySelector("regular-layout")?.maximize("AAA");
	});

	// `save` ignores transient maximize state - the tree is unchanged.
	expect(await saveLayout(page)).toEqual(before);
});

test("should reset to minimized on `restore`", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(async (layout) => {
		const element = document.querySelector("regular-layout");
		element?.maximize("AAA");
		// Restoring (even the identical layout) always returns to minimized.
		await element?.restore(layout as never);
	}, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	expect(await panelDisplay(page, "AAA")).toBe("flex");
	expect(await panelDisplay(page, "BBB")).toBe("flex");
});

test("should ignore `maximize` for an absent panel", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(() => {
		document.querySelector("regular-layout")?.maximize("ZZZ");
	});

	// Both panels remain visible; the no-op did not hide anything.
	expect(await panelDisplay(page, "AAA")).toBe("flex");
	expect(await panelDisplay(page, "BBB")).toBe("flex");
});
