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
import { setupLayout } from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("realCoordinates matches getBoundingClientRect for 3 horizontal children", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.THREE_HORIZONTAL);

	const result = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		if (!layout) return null;
		const panels = ["AAA", "BBB", "CCC"];
		const results: Record<
			string,
			{
				real: { x: number; y: number; width: number; height: number };
				actual: { x: number; y: number; width: number; height: number };
			}
		> = {};

		for (const name of panels) {
			const panel = document.querySelector(`[name="${name}"]`) as HTMLElement;

			if (!panel) continue;
			const panelRect = panel.getBoundingClientRect();
			const centerX = panelRect.x + panelRect.width / 2;
			const centerY = panelRect.y + panelRect.height / 2;
			const hit = layout.calculateIntersect({
				clientX: centerX,
				clientY: centerY,
			});

			if (!hit || hit.slot !== name) continue;
			const rect = layout.realCoordinates(hit.view_window);
			results[name] = {
				real: {
					x: rect.x + 3,
					y: rect.y + 27,
					width: rect.width - 6,
					height: rect.height - 30,
				},
				actual: {
					x: panelRect.x,
					y: panelRect.y,
					width: panelRect.width,
					height: panelRect.height,
				},
			};
		}

		return results;
	});

	expect(result).not.toBeNull();

	// biome-ignore lint/style/noNonNullAssertion: playwright expectation
	const panels = Object.entries(result!);
	expect(panels.length).toBe(3);
	for (const [name, { real, actual }] of panels) {
		expect(real.x, `${name} x`).toBeCloseTo(actual.x, 0);
		expect(real.y, `${name} y`).toBeCloseTo(actual.y, 0);
		expect(real.width, `${name} width`).toBeCloseTo(actual.width, 0);
		expect(real.height, `${name} height`).toBeCloseTo(actual.height, 0);
	}
});
