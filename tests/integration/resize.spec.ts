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
	setupLayout,
	saveLayout,
	restoreAndVerify,
	dragMouse,
} from "../helpers/integration.ts";

test("should resize panels by dragging dividers and preserve state with save/restore", async ({
	page,
}) => {
	await setupLayout(page);
	const initialState = await saveLayout(page);
	expect(initialState).toHaveProperty("type", "split-panel");
	expect(initialState).toHaveProperty("children");
	expect(initialState).toHaveProperty("sizes");
	const layoutBox = await page.locator("regular-layout").boundingBox();
	expect(layoutBox).not.toBeNull();
	const dividerX = layoutBox!.x + layoutBox!.width * 0.5;
	const dividerY = layoutBox!.y + layoutBox!.height * 0.5;
	const dragDistance = -100;
	await dragMouse(page, dividerX, dividerY, dividerX + dragDistance, dividerY);
	const resizedState = await saveLayout(page);
	expect(resizedState).not.toEqual(initialState);
	expect(resizedState).toHaveProperty("type", "split-panel");
	expect(resizedState).toHaveProperty("sizes");
	await restoreAndVerify(page, initialState);
	await restoreAndVerify(page, resizedState);
});

test("should resize nested panels by dragging horizontal divider", async ({
	page,
}) => {
	await setupLayout(page);
	const initialState = await saveLayout(page);
	const layoutBox = await page.locator("regular-layout").boundingBox();
	expect(layoutBox).not.toBeNull();
	const nestedDividerX = layoutBox!.x + layoutBox!.width * 0.5;
	const nestedDividerY = layoutBox!.y + layoutBox!.height * 0.25;
	const dragDistance = 50;
	await dragMouse(
		page,
		nestedDividerX,
		nestedDividerY,
		nestedDividerX + dragDistance,
		nestedDividerY,
	);

	const resizedState = await saveLayout(page);
	expect(resizedState).not.toEqual(initialState);
	await restoreAndVerify(page, initialState);
});

test("should handle multiple resize operations and save/restore cycles", async ({
	page,
}) => {
	await setupLayout(page);
	const layoutBox = await page.locator("regular-layout").boundingBox();
	expect(layoutBox).not.toBeNull();
	const divider1X = layoutBox!.x + layoutBox!.width * 0.5;
	const divider1Y = layoutBox!.y + layoutBox!.height * 0.5;
	await dragMouse(page, divider1X, divider1Y, divider1X - 80, divider1Y);
	const state1 = await saveLayout(page);
	const divider2X = layoutBox!.x + layoutBox!.width * 0.25;
	const divider2Y = layoutBox!.y + layoutBox!.height * 0.25;
	await dragMouse(page, divider2X, divider2Y, divider2X, divider2Y + 60);
	const state2 = await saveLayout(page);
	await dragMouse(page, divider1X - 80, divider1Y, divider1X + 40, divider1Y);
	const state3 = await saveLayout(page);
	expect(state1).not.toEqual(state2);
	expect(state2).not.toEqual(state3);
	expect(state1).not.toEqual(state3);
	await restoreAndVerify(page, state1);
	await restoreAndVerify(page, state2);
	await restoreAndVerify(page, state3);
});
