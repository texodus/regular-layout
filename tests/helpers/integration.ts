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

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { Layout } from "../../src/common/layout_config.ts";
import type {} from "../../src/extensions.ts";

/**
 * Sets up a page for layout testing by navigating and waiting for the component.
 * Optionally restores an initial layout state.
 */
export async function setupLayout(
	page: Page,
	initialLayout?: Layout,
): Promise<void> {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");
	if (initialLayout) {
		await restoreLayout(page, initialLayout);
	}
}

/**
 * Saves and returns the current layout state.
 */
export async function saveLayout(page: Page): Promise<Layout> {
	return await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save() as Layout;
	});
}

/**
 * Restores a layout to the given state.
 */
export async function restoreLayout(page: Page, state: Layout): Promise<void> {
	await page.evaluate((s) => {
		const layout = document.querySelector("regular-layout");
		layout?.restore(s as Layout);
	}, state);
}

/**
 * Returns an array of slot names from the layout's shadow DOM.
 */
export async function getSlots(page: Page): Promise<string[]> {
	return await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		const slotElements = layout?.shadowRoot?.querySelectorAll("slot[name]");
		return Array.from(slotElements || []).map(
			(slot) => slot.getAttribute("name") || "",
		);
	});
}

/**
 * Verifies that specific slots exist or don't exist.
 */
export async function expectSlots(
	page: Page,
	options: {
		contains?: string[];
		notContains?: string[];
	},
): Promise<void> {
	const slots = await getSlots(page);
	if (options.contains) {
		for (const slot of options.contains) {
			expect(slots).toContain(slot);
		}
	}

	if (options.notContains) {
		for (const slot of options.notContains) {
			expect(slots).not.toContain(slot);
		}
	}
}

/**
 * Performs a mouse drag operation from one point to another.
 */
export async function dragMouse(
	page: Page,
	fromX: number,
	fromY: number,
	toX: number,
	toY: number,
): Promise<void> {
	await page.mouse.move(fromX, fromY);
	await page.mouse.down();
	await page.mouse.move(toX, toY);
	await page.mouse.up();
}

/**
 * Inserts a panel at the specified path.
 */
export async function insertPanel(
	page: Page,
	panelName: string,
	path: number[],
): Promise<void> {
	await page.evaluate(
		({ name, p }) => {
			const layout = document.querySelector("regular-layout");
			layout?.insertPanel(name, p);
		},
		{ name: panelName, p: path },
	);
}

/**
 * Removes a panel by name or at the specified path.
 */
export async function removePanel(
	page: Page,
	pathOrName: number[] | string,
): Promise<void> {
	await page.evaluate((p) => {
		const layout = document.querySelector("regular-layout");
		layout?.removePanel(p as string);
	}, pathOrName);
}

/**
 * Calls setOverlayState with the given coordinates and options.
 */
export async function setOverlayState(
	page: Page,
	x: number,
	y: number,
	slot: string,
	className?: string,
	mode?: "grid" | "absolute",
): Promise<void> {
	await page.evaluate(
		({ x, y, slot, className, mode }) => {
			const layout = document.querySelector("regular-layout");
			const layoutPath = layout?.calculateIntersect(x, y);
			if (layoutPath) {
				layout?.setOverlayState(x, y, { ...layoutPath, slot }, className, mode);
			}
		},
		{ x, y, slot, className, mode },
	);
}

/**
 * Calls clearOverlayState with the given coordinates and options.
 */
export async function clearOverlayState(
	page: Page,
	x: number,
	y: number,
	slot: string,
	className?: string,
	mode?: "grid" | "absolute",
): Promise<void> {
	await page.evaluate(
		({ x, y, slot, className, mode }) => {
			const layout = document.querySelector("regular-layout");
			const layoutPath = layout?.calculateIntersect(x, y);
			if (layoutPath) {
				layout?.clearOverlayState(
					x,
					y,
					{ ...layoutPath, slot },
					className,
					mode,
				);
			}
		},
		{ x, y, slot, className, mode },
	);
}

/**
 * Gets the computed CSS for a slot element.
 */
export async function getSlotCSS(
	page: Page,
	slotName: string,
): Promise<{
	gridArea?: string;
	display?: string;
}> {
	return await page.evaluate((name) => {
		const layout = document.querySelector("regular-layout");
		const slot = layout?.shadowRoot?.querySelector(`slot[name="${name}"]`);
		if (!slot) return {};

		const computedStyle = window.getComputedStyle(slot);
		return {
			gridArea: computedStyle.gridArea,
			display: computedStyle.display,
		};
	}, slotName);
}

/**
 * Checks if an element has a specific CSS class.
 */
export async function hasClass(
	page: Page,
	slotName: string,
	className: string,
): Promise<boolean> {
	return await page.evaluate(
		({ name, className }) => {
			const layout = document.querySelector("regular-layout");
			const slot = layout?.shadowRoot?.querySelector(
				`slot[name="${name}"]`,
			) as HTMLSlotElement | null;
			const element = slot?.assignedElements()[0];
			return element?.classList.contains(className) || false;
		},
		{ name: slotName, className },
	);
}

/**
 * Gets the layout bounds for testing overlay coordinates.
 */
export async function getLayoutBounds(page: Page): Promise<{
	x: number;
	y: number;
	width: number;
	height: number;
}> {
	return await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		const rect = layout?.getBoundingClientRect();
		return {
			x: rect?.left || 0,
			y: rect?.top || 0,
			width: rect?.width || 0,
			height: rect?.height || 0,
		};
	});
}
