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
import { setupLayout, getLayoutBounds } from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should apply overlay class to dragged panel in absolute mode", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const bounds = await getLayoutBounds(page);

	// Calculate center of AAA panel (left half)
	const x = bounds.x + bounds.width * 0.25;
	const y = bounds.y + bounds.height * 0.5;
	await page.evaluate(
		({ x, y }) => {
			const layout = document.querySelector("regular-layout");
			const layoutPath = layout?.calculateIntersect({ clientX: x, clientY: y });
			if (layoutPath) {
				layout?.setOverlayState(
					{ clientX: x, clientY: y },
					layoutPath,
					"overlay",
					"absolute",
				);
			}
		},
		{ x, y },
	);

	// Verify AAA panel has overlay class
	const panel = await page.locator("regular-layout-frame[name=AAA]");
	expect(panel).toHaveClass("overlay");
});

test("should dispatch regular-layout-update event in absolute mode", async ({
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

				const layoutPath = layout?.calculateIntersect({
					clientX: x,
					clientY: y,
				});

				if (layoutPath) {
					layout?.setOverlayState(
						{ clientX: x, clientY: y },
						layoutPath,
						"overlay",
						"absolute",
					);
				} else {
					resolve(false);
				}
			});
		},
		{ x, y },
	);

	expect(eventReceived).toBe(true);
});

test("should handle custom className in absolute mode", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const bounds = await getLayoutBounds(page);

	const x = bounds.x + bounds.width * 0.25;
	const y = bounds.y + bounds.height * 0.5;

	await page.evaluate(
		({ x, y }) => {
			const layout = document.querySelector("regular-layout");
			const layoutPath = layout?.calculateIntersect({ clientX: x, clientY: y });
			if (layoutPath) {
				layout?.setOverlayState(
					{ clientX: x, clientY: y },
					layoutPath,
					"custom-drag-class",
					"absolute",
				);
			}
		},
		{ x, y },
	);

	const panel = await page.locator("regular-layout-frame[name=AAA]");
	expect(panel).toHaveClass("custom-drag-class");

	const panel2 = await page.locator("regular-layout-frame[name=AAA]");
	expect(panel2).not.toHaveClass("overlay");
});
