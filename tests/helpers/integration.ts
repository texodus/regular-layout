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
import type { Layout } from "../../src/layout/types.ts";
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
	await page.evaluate(async (s) => {
		const layout = document.querySelector("regular-layout");
		await layout?.restore(s as Layout);
	}, state);
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
	path: LayoutPathTraversal,
): Promise<void> {
	await page.evaluate(
		async ({ name, p }) => {
			const layout = document.querySelector("regular-layout");
			await layout?.insertPanel(name, p);
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
	await page.evaluate(async (p) => {
		const layout = document.querySelector("regular-layout");
		await layout?.removePanel(p as string);
	}, pathOrName);
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
