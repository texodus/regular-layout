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
import { setupLayout, saveLayout, dragMouse } from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should fire regular-layout-before-resize on restore", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const fired = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		let eventFired = false;
		layout?.addEventListener("regular-layout-before-resize", () => {
			eventFired = true;
		});
		await layout?.restore({
			type: "tab-layout",
			tabs: ["BBB"],
		});
		return eventFired;
	});
	expect(fired).toBe(true);
});

test("should provide calculatePresizePaths in event detail", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const paths = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		const presizePaths: { value: Record<string, unknown> | null } = {
			value: null,
		};

		layout?.addEventListener("regular-layout-before-resize", (e) => {
			presizePaths.value = (
				e as CustomEvent
			).detail.calculatePresizePaths() as Record<string, unknown>;
		});

		// The event detail contains paths for the *incoming* layout
		await layout?.restore({
			type: "split-layout",
			orientation: "horizontal",
			children: [
				{ type: "tab-layout", tabs: ["AAA"] },
				{ type: "tab-layout", tabs: ["BBB"] },
			],
			sizes: [0.4, 0.6],
		});

		if (presizePaths.value === null) {
			throw new Error("Event listener not fired");
		}

		return presizePaths.value;
	});

	expect(paths).not.toBeNull();
	expect(paths).toHaveProperty("AAA");
	expect(paths).toHaveProperty("BBB");
	const aaa = (paths as Record<string, Record<string, unknown>>)["AAA"];
	expect(aaa.type).toBe("layout-path");
	expect(aaa.slot).toBe("AAA");
});

test("should suspend resize when preventDefault is called", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		layout?.addEventListener("regular-layout-before-resize", (e) => {
			e.preventDefault();
		});

		const beforeState = layout?.save();

		// Start restore but don't await - it will be suspended
		layout?.restore({
			type: "tab-layout",
			tabs: ["BBB"],
		});

		// Give a tick for the event to fire and be cancelled
		await new Promise((r) => setTimeout(r, 50));

		// Layout should still be the old state since resize is suspended
		const duringState = layout?.save();
		return {
			beforeTabs: (beforeState as { tabs: string[] })?.tabs,
			duringTabs: (duringState as { tabs: string[] })?.tabs,
		};
	});

	expect(result.beforeTabs).toStrictEqual(["AAA"]);
	expect(result.duringTabs).toStrictEqual(["AAA"]);
});

test("should resume suspended resize when resumeResize is called", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		layout?.addEventListener("regular-layout-before-resize", (e) => {
			e.preventDefault();
		});

		const restorePromise = layout?.restore({
			type: "tab-layout",
			tabs: ["BBB"],
		});

		await new Promise((r) => setTimeout(r, 50));
		const beforeResume = layout?.save();
		layout?.resumeResize();
		await restorePromise;
		const afterResume = layout?.save();
		return {
			beforeResumeTabs: (beforeResume as { tabs: string[] })?.tabs,
			afterResumeTabs: (afterResume as { tabs: string[] })?.tabs,
		};
	});

	expect(result.beforeResumeTabs).toStrictEqual(["AAA"]);
	expect(result.afterResumeTabs).toStrictEqual(["BBB"]);
});

test("should proceed immediately when event is not cancelled", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const tabs = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		let eventCount = 0;
		layout?.addEventListener("regular-layout-before-resize", () => {
			eventCount++;
		});
		await layout?.restore({
			type: "tab-layout",
			tabs: ["BBB"],
		});
		return {
			tabs: (layout?.save() as { tabs: string[] })?.tabs,
			eventCount,
		};
	});

	expect(tabs.tabs).toStrictEqual(["BBB"]);
	expect(tabs.eventCount).toBe(1);
});

test("should fire resize-before on drag resize", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		(window as unknown as Record<string, number>).__resizeBeforeCount = 0;
		layout?.addEventListener("regular-layout-before-resize", () => {
			(window as unknown as Record<string, number>).__resizeBeforeCount++;
		});
	});

	const layoutBox = await page.locator("regular-layout").boundingBox();
	expect(layoutBox).not.toBeNull();
	// biome-ignore lint/style/noNonNullAssertion: playwright expectation
	const dividerX = layoutBox!.x + layoutBox!.width * 0.5;
	// biome-ignore lint/style/noNonNullAssertion: playwright expectation
	const dividerY = layoutBox!.y + layoutBox!.height * 0.5;
	await dragMouse(page, dividerX, dividerY, dividerX - 50, dividerY);

	const count = await page.evaluate(
		() => (window as unknown as Record<string, number>).__resizeBeforeCount,
	);
	expect(count).toBeGreaterThan(0);
});

test("should queue concurrent resizes and process sequentially", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		const events: string[] = [];
		let callCount = 0;
		let cancelFirst = true;

		layout?.addEventListener("regular-layout-before-resize", (e) => {
			callCount++;
			events.push(`before-${callCount}`);
			if (cancelFirst) {
				cancelFirst = false;
				e.preventDefault();
			}
		});

		// First restore - will be suspended
		const promise1 = layout?.restore({
			type: "tab-layout",
			tabs: ["BBB"],
		});

		await new Promise((r) => setTimeout(r, 50));

		// Second restore - should be queued
		const promise2 = layout?.restore({
			type: "tab-layout",
			tabs: ["CCC"],
		});

		await new Promise((r) => setTimeout(r, 50));

		// Resume first resize, which should then process the queued one
		layout?.resumeResize();
		await Promise.all([promise1, promise2]);

		return {
			events,
			finalTabs: (layout?.save() as { tabs: string[] })?.tabs,
		};
	});

	expect(result.events).toStrictEqual(["before-1", "before-2"]);
	expect(result.finalTabs).toStrictEqual(["CCC"]);
});

test("should provide pre-resize panel paths for nested layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	// Restore to a nested layout so calculatePresizePaths has multiple panels
	const paths = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		let presizePaths: Record<string, Record<string, unknown>> | null = null;
		layout?.addEventListener("regular-layout-before-resize", (e) => {
			presizePaths = (e as CustomEvent).detail.calculatePresizePaths();
		});

		await layout?.restore({
			type: "split-layout",
			orientation: "horizontal",
			children: [
				{
					type: "split-layout",
					orientation: "vertical",
					children: [
						{ type: "tab-layout", tabs: ["AAA"] },
						{ type: "tab-layout", tabs: ["BBB"] },
					],
					sizes: [0.3, 0.7],
				},
				{
					type: "split-layout",
					orientation: "vertical",
					children: [
						{ type: "tab-layout", tabs: ["CCC"] },
						{ type: "tab-layout", tabs: ["DDD"] },
					],
					sizes: [0.5, 0.5],
				},
			],
			sizes: [0.6, 0.4],
		});
		return presizePaths;
	});

	expect(paths).not.toBeNull();
	expect(paths).toHaveProperty("AAA");
	expect(paths).toHaveProperty("BBB");
	expect(paths).toHaveProperty("CCC");
	expect(paths).toHaveProperty("DDD");
	for (const name of ["AAA", "BBB", "CCC", "DDD"]) {
		// biome-ignore lint/style/noNonNullAssertion: test assertion
		const path = paths![name] as Record<string, unknown>;
		expect(path.type).toBe("layout-path");
		expect(path.view_window).toBeDefined();
		const vw = path.view_window as Record<string, number>;
		expect(vw.col_start).toBeGreaterThanOrEqual(0);
		expect(vw.col_end).toBeLessThanOrEqual(1);
		expect(vw.row_start).toBeGreaterThanOrEqual(0);
		expect(vw.row_end).toBeLessThanOrEqual(1);
	}
});

test("should fire resize-before on double-click equalize", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL);

	await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		(window as unknown as Record<string, boolean>).__resizeBeforeFired = false;
		layout?.addEventListener("regular-layout-before-resize", () => {
			(window as unknown as Record<string, boolean>).__resizeBeforeFired = true;
		});
	});

	const layoutBox = await page.locator("regular-layout").boundingBox();
	expect(layoutBox).not.toBeNull();
	// Double-click on divider area (30% split = divider at 30%)
	// biome-ignore lint/style/noNonNullAssertion: playwright expectation
	const dividerX = layoutBox!.x + layoutBox!.width * 0.3;
	// biome-ignore lint/style/noNonNullAssertion: playwright expectation
	const dividerY = layoutBox!.y + layoutBox!.height * 0.5;
	await page.mouse.dblclick(dividerX, dividerY);

	await page.waitForTimeout(100);

	const result = await page.evaluate(
		() => (window as unknown as Record<string, boolean>).__resizeBeforeFired,
	);
	expect(result).toBe(true);
});

test("should not fire resize-before on restoreSync", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const fired = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		let eventFired = false;
		layout?.addEventListener("regular-layout-before-resize", () => {
			eventFired = true;
		});
		layout?.restoreSync({
			type: "tab-layout",
			tabs: ["BBB"],
		});
		return eventFired;
	});
	expect(fired).toBe(false);

	// But the layout should still have been updated
	const state = await saveLayout(page);
	expect(state).toStrictEqual({
		type: "tab-layout",
		tabs: ["BBB"],
		selected: 0,
	});
});

test("should expose the dragged panel's preview box in detail.overlay", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		if (!layout) return null;
		const center = (name: string) => {
			const panel = document.querySelector(`[name="${name}"]`) as HTMLElement;
			const rect = panel.getBoundingClientRect();
			return {
				clientX: rect.x + rect.width / 2,
				clientY: rect.y + rect.height / 2,
			};
		};

		const path = layout.calculateIntersect(center("AAA"));
		if (!path) return null;
		let captured: {
			overlay: unknown;
			paths: string[];
		} | null = null;

		layout.addEventListener(
			"regular-layout-before-resize",
			(e) => {
				const detail = (e as CustomEvent).detail;
				captured = {
					overlay: detail.overlay,
					paths: Object.keys(detail.calculatePresizePaths()),
				};
			},
			{ once: true },
		);

		// Drag AAA over BBB - AAA is removed from the transition's layout tree,
		// so its preview box arrives via `detail.overlay` instead of the paths.
		await layout.setOverlayState(center("BBB"), path);
		return captured;
	});

	expect(result).not.toBeNull();
	// biome-ignore lint/style/noNonNullAssertion: playwright expectation
	expect(result!.paths).toStrictEqual(["BBB"]);
	// biome-ignore lint/style/noNonNullAssertion: playwright expectation
	const overlay = result!.overlay as {
		slot: string;
		path: { view_window: Record<string, number> };
	};

	expect(overlay.slot).toBe("AAA");
	expect(overlay.path.view_window).toBeDefined();
	for (const key of ["col_start", "col_end", "row_start", "row_end"]) {
		expect(typeof overlay.path.view_window[key]).toBe("number");
	}
});

test("should not define detail.overlay for non-drag transitions", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const overlay = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		let captured: { value: unknown } | null = null;
		layout?.addEventListener(
			"regular-layout-before-resize",
			(e) => {
				captured = { value: (e as CustomEvent).detail.overlay };
			},
			{ once: true },
		);

		await layout?.restore({ type: "tab-layout", tabs: ["BBB"] });
		return {
			fired: captured !== null,
			isUndefined: captured
				? (captured as { value: unknown }).value === undefined
				: false,
		};
	});

	expect(overlay.fired).toBe(true);
	expect(overlay.isUndefined).toBe(true);
});

test("should resumeResize be a no-op when no resize is pending", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	// This should not throw or cause issues
	const result = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		layout?.resumeResize();
		return (layout?.save() as { tabs: string[] })?.tabs;
	});
	expect(result).toStrictEqual(["AAA"]);
});
