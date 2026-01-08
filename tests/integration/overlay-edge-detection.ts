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
	getLayoutBounds,
	hasClass,
	setupLayout,
} from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should handle overlay near top edge of panel", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_VERTICAL);
	const bounds = await getLayoutBounds(page);

	// Near top edge of AAA panel
	const x = bounds.x + bounds.width * 0.5;
	const y = bounds.y + bounds.height * 0.1;

	await page.evaluate(
		({ x, y }) => {
			const layout = document.querySelector("regular-layout");
			const layoutPath = layout?.calculateIntersect(x, y);
			if (layoutPath) {
				layout?.setOverlayState(x, y, layoutPath, "overlay", "absolute");
			}
		},
		{ x, y },
	);

	const hasOverlayClass = await hasClass(page, "AAA", "overlay");
	expect(hasOverlayClass).toBe(true);
});

test("should handle overlay near bottom edge of panel", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_VERTICAL);
	const bounds = await getLayoutBounds(page);

	// Near bottom edge of BBB panel
	const x = bounds.x + bounds.width * 0.5;
	const y = bounds.y + bounds.height * 0.9;

	await page.evaluate(
		({ x, y }) => {
			const layout = document.querySelector("regular-layout");
			const layoutPath = layout?.calculateIntersect(x, y);
			if (layoutPath) {
				layout?.setOverlayState(x, y, layoutPath, "overlay", "absolute");
			}
		},
		{ x, y },
	);

	const hasOverlayClass = await hasClass(page, "BBB", "overlay");
	expect(hasOverlayClass).toBe(true);
});
