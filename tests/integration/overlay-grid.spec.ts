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
import { setupLayout, getLayoutBounds } from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should update CSS with grid preview in grid mode", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const bounds = await getLayoutBounds(page);

	const x = bounds.x + bounds.width * 0.75;
	const y = bounds.y + bounds.height * 0.5;

	await page.evaluate(
		({ x, y }) => {
			const layout = document.querySelector("regular-layout");
			const layoutPath = layout?.calculateIntersect(x, y);
			if (layoutPath) {
				layout?.setOverlayState(x, y, layoutPath, "overlay", "grid");
			}
		},
		{ x, y },
	);

	const cssRules = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		const stylesheet = layout?.shadowRoot?.adoptedStyleSheets[0];
		return stylesheet?.cssRules.length || 0;
	});

	expect(cssRules).toBeGreaterThan(0);
});

test("should dispatch regular-layout-update event in grid mode", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const bounds = await getLayoutBounds(page);

	const x = bounds.x + bounds.width * 0.25;
	const y = bounds.y + bounds.height * 0.5;

	const eventReceived = await page.evaluate(
		({ x, y }) => {
			return new Promise<boolean>((resolve) => {
				const layout = document.querySelector("regular-layout");
				layout?.addEventListener(
					"regular-layout-before-update",
					() => {
						resolve(true);
					},
					{ once: true },
				);

				const layoutPath = layout?.calculateIntersect(x, y);
				if (layoutPath) {
					layout?.setOverlayState(x, y, layoutPath, "overlay", "grid");
				} else {
					resolve(false);
				}
			});
		},
		{ x, y },
	);

	expect(eventReceived).toBe(true);
});
