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
import type { Layout } from "../../dist/index.js";
import {
	setupLayout,
	saveLayout,
	insertPanel,
} from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should insert a single panel into a single panel layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const currentState = await saveLayout(page);
	expect(currentState).toStrictEqual({
		type: "tab-layout",
		tabs: ["AAA"],
		selected: 0,
	});

	await insertPanel(page, "BBB", []);
	const currentState2 = await saveLayout(page);
	expect(currentState2).toStrictEqual({
		type: "tab-layout",
		tabs: ["BBB", "AAA"],
		selected: 0,
	});
});

test("should insert panel at specific path in split panel", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	await insertPanel(page, "CCC", [1]);
	const afterInsert = await saveLayout(page);
	expect(afterInsert).toStrictEqual({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "tab-layout",
				tabs: ["AAA"],
				selected: 0,
			},
			{
				type: "tab-layout",
				tabs: ["CCC"],
				selected: 0,
			},
			{
				type: "tab-layout",
				tabs: ["BBB"],
				selected: 0,
			},
		],
		sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
	});
});

test("should insert panel into nested split panel", async ({ page }) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");
	await page.evaluate(async (layoutConfig) => {
		const layout = document.querySelector("regular-layout");
		await layout?.restore(layoutConfig as Layout);
	}, LAYOUTS.NESTED_BASIC);

	await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		await layout?.insertPanel("DDD", [0, 2]);
	});

	const afterInsert = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(afterInsert).toStrictEqual({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "split-layout",
				orientation: "vertical",
				children: [
					{
						type: "tab-layout",
						tabs: ["AAA"],
						selected: 0,
					},
					{
						type: "tab-layout",
						tabs: ["BBB"],
						selected: 0,
					},
					{
						type: "tab-layout",
						tabs: ["DDD"],
						selected: 0,
					},
				],
				sizes: [0.19999999999999998, 0.4666666666666666, 0.3333333333333333],
			},
			{
				type: "tab-layout",
				tabs: ["CCC"],
				selected: 0,
			},
		],
		sizes: [0.6, 0.4],
	});
});

test("should split existing panel when inserting at deeper path", async ({
	page,
}) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");

	await page.evaluate(async (layoutConfig) => {
		const layout = document.querySelector("regular-layout");
		await layout?.restore(layoutConfig as Layout);
	}, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		await layout?.insertPanel("CCC", [1, 1], "vertical");
	});

	const afterInsert = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(afterInsert).toStrictEqual({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "tab-layout",
				tabs: ["AAA"],
				selected: 0,
			},
			{
				type: "split-layout",
				orientation: "vertical",
				children: [
					{
						type: "tab-layout",
						tabs: ["BBB"],
						selected: 0,
					},
					{
						type: "tab-layout",
						tabs: ["CCC"],
						selected: 0,
					},
				],
				sizes: [0.5, 0.5],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("should preserve state with save/restore after insertPanel", async ({
	page,
}) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");
	await page.evaluate(async (layoutConfig) => {
		const layout = document.querySelector("regular-layout");
		await layout?.restore(layoutConfig as Layout);
	}, LAYOUTS.SINGLE_AAA);

	await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		await layout?.insertPanel("BBB", []);
	});

	const stateAfterInsert = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	await page.evaluate(async (state) => {
		const layout = document.querySelector("regular-layout");
		await layout?.restore(state as Layout);
	}, stateAfterInsert);

	const restoredState = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(restoredState).toStrictEqual(stateAfterInsert);
});
