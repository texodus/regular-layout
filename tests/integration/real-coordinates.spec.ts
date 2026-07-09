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
				// The frame now fills its grid cell (theme chrome lives on
				// `::part(container)`), so `realCoordinates` matches its box
				// directly with no margin compensation.
				real: {
					x: rect.x,
					y: rect.y,
					width: rect.width,
					height: rect.height,
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

test("realCoordinates refreshes stale bounds on before-resize after the host moves", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	const result = await page.evaluate(async (fixture) => {
		const layout = document.querySelector("regular-layout");
		if (!layout) return null;
		const full = { col_start: 0, col_end: 1, row_start: 0, row_end: 1 };
		// Prime the bounds cache at the original position.
		const before = layout.realCoordinates(full);

		// A position-only move: `transform` changes the client rect without
		// resizing the element, so only the before-resize refresh (not the
		// ResizeObserver) can catch it.
		layout.style.transform = "translateY(100px)";

		let during: DOMRect | null = null;
		layout.addEventListener(
			"regular-layout-before-resize",
			() => {
				during = layout.realCoordinates(full);
			},
			{ once: true },
		);

		await layout.restore(fixture as never);
		return { beforeTop: before.top, duringTop: during?.top };
	}, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	expect(result).not.toBeNull();
	// The handler reads coordinates in the element's *current* (moved) frame.
	// biome-ignore lint/style/noNonNullAssertion: playwright expectation
	expect(result!.duringTop).toBeCloseTo(result!.beforeTop + 100, 0);
});

test("realCoordinates refreshes stale bounds after the host resizes", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		if (!layout) return null;
		const full = { col_start: 0, col_end: 1, row_start: 0, row_end: 1 };
		// Prime the bounds cache at the original size.
		const before = layout.realCoordinates(full);

		// Shrink the host; the `ResizeObserver` invalidates the cache with no
		// layout transition involved.
		layout.style.bottom = "150px";
		await new Promise((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(resolve)),
		);

		const after = layout.realCoordinates(full);
		return { beforeHeight: before.height, afterHeight: after.height };
	});

	expect(result).not.toBeNull();
	// biome-ignore lint/style/noNonNullAssertion: playwright expectation
	expect(result!.beforeHeight - result!.afterHeight).toBeCloseTo(150, 0);
});
