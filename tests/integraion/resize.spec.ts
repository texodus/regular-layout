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
import type { Layout } from "../../dist/index.js";

test.describe("Panel Resizing Integration", () => {
	test("should resize panels by dragging dividers and preserve state with save/restore", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");

		await page.waitForSelector("regular-layout");

		const initialState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(initialState).toHaveProperty("type", "split-panel");
		expect(initialState).toHaveProperty("children");
		expect(initialState).toHaveProperty("sizes");

		const layoutBox = await page.locator("regular-layout").boundingBox();
		expect(layoutBox).not.toBeNull();

		const dividerX = layoutBox!.x + layoutBox!.width * 0.5;

		const dividerY = layoutBox!.y + layoutBox!.height * 0.5;

		const dragDistance = -100;
		await page.mouse.move(dividerX, dividerY);
		await page.mouse.down();
		await page.mouse.move(dividerX + dragDistance, dividerY);
		await page.mouse.up();

		const resizedState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(resizedState).not.toEqual(initialState);

		expect(resizedState).toHaveProperty("type", "split-panel");
		expect(resizedState).toHaveProperty("sizes");

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, initialState);

		const restoredState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(restoredState).toEqual(initialState);

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, resizedState);

		const finalState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(finalState).toEqual(resizedState);
	});

	test("should resize nested panels by dragging horizontal divider", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		const initialState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		const layoutBox = await page.locator("regular-layout").boundingBox();
		expect(layoutBox).not.toBeNull();

		const nestedDividerX = layoutBox!.x + layoutBox!.width * 0.5;

		const nestedDividerY = layoutBox!.y + layoutBox!.height * 0.25;

		const dragDistance = 50;
		await page.mouse.move(nestedDividerX, nestedDividerY);
		await page.mouse.down();
		await page.mouse.move(nestedDividerX + dragDistance, nestedDividerY);
		await page.mouse.up();

		const resizedState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(resizedState).not.toEqual(initialState);

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, initialState);

		const restoredState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(restoredState).toEqual(initialState);
	});

	test("should handle multiple resize operations and save/restore cycles", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		const layoutBox = await page.locator("regular-layout").boundingBox();
		expect(layoutBox).not.toBeNull();

		const divider1X = layoutBox!.x + layoutBox!.width * 0.5;

		const divider1Y = layoutBox!.y + layoutBox!.height * 0.5;
		await page.mouse.move(divider1X, divider1Y);
		await page.mouse.down();
		await page.mouse.move(divider1X - 80, divider1Y);
		await page.mouse.up();

		const state1 = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		const divider2X = layoutBox!.x + layoutBox!.width * 0.25;

		const divider2Y = layoutBox!.y + layoutBox!.height * 0.25;
		await page.mouse.move(divider2X, divider2Y);
		await page.mouse.down();
		await page.mouse.move(divider2X, divider2Y + 60);
		await page.mouse.up();

		const state2 = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		await page.mouse.move(divider1X - 80, divider1Y);
		await page.mouse.down();
		await page.mouse.move(divider1X + 40, divider1Y);
		await page.mouse.up();

		const state3 = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(state1).not.toEqual(state2);
		expect(state2).not.toEqual(state3);
		expect(state1).not.toEqual(state3);

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, state1);

		let currentState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});
		expect(currentState).toEqual(state1);

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, state2);

		currentState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});
		expect(currentState).toEqual(state2);

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, state3);

		currentState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});
		expect(currentState).toEqual(state3);
	});
});
