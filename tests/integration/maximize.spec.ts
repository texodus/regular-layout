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

	await page.evaluate(async () => {
		await document.querySelector("regular-layout")?.maximize("AAA");
	});

	// The maximized panel fills the layout; the other is hidden.
	expect(await panelDisplay(page, "AAA")).toBe("flex");
	expect(await panelDisplay(page, "BBB")).toBe("none");
});

test("should minimize back to the normal multi-panel view", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		await layout?.maximize("AAA");
		await layout?.minimize();
	});

	expect(await panelDisplay(page, "AAA")).toBe("flex");
	expect(await panelDisplay(page, "BBB")).toBe("flex");
});

test("should not persist maximize state in `save`", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const before = await saveLayout(page);

	await page.evaluate(async () => {
		await document.querySelector("regular-layout")?.maximize("AAA");
	});

	// `save` ignores transient maximize state - the tree is unchanged.
	expect(await saveLayout(page)).toEqual(before);
});

test("should reset to minimized on `restore`", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(async (layout) => {
		const element = document.querySelector("regular-layout");
		await element?.maximize("AAA");
		// Restoring (even the identical layout) always returns to minimized.
		await element?.restore(layout as never);
	}, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	expect(await panelDisplay(page, "AAA")).toBe("flex");
	expect(await panelDisplay(page, "BBB")).toBe("flex");
});

test("should ignore `maximize` for an absent panel", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(async () => {
		await document.querySelector("regular-layout")?.maximize("ZZZ");
	});

	// Both panels remain visible; the no-op did not hide anything.
	expect(await panelDisplay(page, "AAA")).toBe("flex");
	expect(await panelDisplay(page, "BBB")).toBe("flex");
});

test("should fire before-resize on maximize with a single full-window path", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	const paths = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		let presizePaths: Record<string, Record<string, unknown>> | null = null;
		layout?.addEventListener(
			"regular-layout-before-resize",
			(e) => {
				presizePaths = (e as CustomEvent).detail.calculatePresizePaths();
			},
			{ once: true },
		);

		await layout?.maximize("AAA");
		return presizePaths;
	});

	// The paths describe the post-maximize geometry: the maximized panel
	// alone, full-window; hidden panels are absent.
	expect(paths).not.toBeNull();
	// biome-ignore lint/style/noNonNullAssertion: test assertion
	expect(Object.keys(paths!)).toStrictEqual(["AAA"]);
	// biome-ignore lint/style/noNonNullAssertion: test assertion
	expect(paths!.AAA.view_window).toStrictEqual({
		col_start: 0,
		col_end: 1,
		row_start: 0,
		row_end: 1,
	});
});

test("should fire before-resize on minimize with the multi-panel paths", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	const paths = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		await layout?.maximize("AAA");
		let presizePaths: Record<string, Record<string, unknown>> | null = null;
		layout?.addEventListener(
			"regular-layout-before-resize",
			(e) => {
				presizePaths = (e as CustomEvent).detail.calculatePresizePaths();
			},
			{ once: true },
		);

		await layout?.minimize();
		return presizePaths;
	});

	expect(paths).not.toBeNull();
	// biome-ignore lint/style/noNonNullAssertion: test assertion
	expect(Object.keys(paths!).sort()).toStrictEqual(["AAA", "BBB"]);
});

test("should suspend maximize until resumeResize when cancelled", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		layout?.addEventListener(
			"regular-layout-before-resize",
			(e) => e.preventDefault(),
			{ once: true },
		);

		const display = () => {
			const panel = document.querySelector('[name="BBB"]') as HTMLElement;
			return getComputedStyle(panel).display;
		};

		const promise = layout?.maximize("AAA");
		await new Promise((r) => setTimeout(r, 50));
		const during = display();
		layout?.resumeResize();
		await promise;
		return { during, after: display() };
	});

	// While suspended the other panel is still visible; the maximize applies
	// only after `resumeResize`.
	expect(result.during).toBe("flex");
	expect(result.after).toBe("none");
});
