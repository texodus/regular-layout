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
import {
	setupLayout,
	saveLayout,
	expectLayoutState,
	expectSlots,
	insertPanel,
} from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should insert a single panel into an empty layout", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	await expectLayoutState(page, LAYOUTS.SINGLE_AAA);
	await insertPanel(page, "BBB", []);
	await expectLayoutState(page, {
		type: "child-panel",
		child: ["BBB", "AAA"],
	});

	await expectSlots(page, { contains: ["BBB"] });
});

test("should insert panel at specific path in split panel", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	await insertPanel(page, "CCC", [1]);
	const afterInsert = await saveLayout(page);
	expect(afterInsert).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				child: ["AAA"],
			},
			{
				type: "child-panel",
				child: ["CCC"],
			},
			{
				type: "child-panel",
				child: ["BBB"],
			},
		],
		sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
	});
});

test("should insert panel into nested split panel", async ({ page }) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");
	await page.evaluate((layoutConfig) => {
		const layout = document.querySelector("regular-layout");
		layout?.restore(layoutConfig as Layout);
	}, LAYOUTS.NESTED_BASIC);

	await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		layout?.insertPanel("DDD", [0, 2]);
	});

	const afterInsert = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(afterInsert).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
						type: "child-panel",
						child: ["AAA"],
					},
					{
						type: "child-panel",
						child: ["BBB"],
					},
					{
						type: "child-panel",
						child: ["DDD"],
					},
				],
				sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
			},
			{
				type: "child-panel",
				child: ["CCC"],
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

	await page.evaluate((layoutConfig) => {
		const layout = document.querySelector("regular-layout");
		layout?.restore(layoutConfig as Layout);
	}, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		layout?.insertPanel("CCC", [1, 1]);
	});

	const afterInsert = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(afterInsert).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				child: ["AAA"],
			},
			{
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
						type: "child-panel",
						child: ["BBB"],
					},
					{
						type: "child-panel",
						child: ["CCC"],
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
	await page.evaluate((layoutConfig) => {
		const layout = document.querySelector("regular-layout");
		layout?.restore(layoutConfig as Layout);
	}, LAYOUTS.SINGLE_AAA);

	await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		layout?.insertPanel("BBB", []);
	});

	const stateAfterInsert = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	await page.evaluate((state) => {
		const layout = document.querySelector("regular-layout");
		layout?.restore(state as Layout);
	}, stateAfterInsert);

	const restoredState = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.save();
	});

	expect(restoredState).toStrictEqual(stateAfterInsert);
});
