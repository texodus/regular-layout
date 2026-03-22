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
import {
	setupLayout,
	saveLayout,
	removePanel,
} from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test.describe("removePanel", () => {
	test("should remove panel from 2-panel layout", async ({ page }) => {
		await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
		await removePanel(page, "BBB");

		const currentState = await saveLayout(page);
		expect(currentState).toStrictEqual({
			type: "tab-layout",
			tabs: ["AAA"],
			selected: 0,
		});
	});

	test("should remove panel from 3-panel layout", async ({ page }) => {
		await setupLayout(page, LAYOUTS.THREE_HORIZONTAL_CUSTOM);
		await removePanel(page, "BBB");
		const currentState = await saveLayout(page);
		expect(currentState).toStrictEqual({
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
			],
			sizes: [0.28571428571428575, 0.7142857142857143],
		});
	});

	test("should remove panel from nested layout", async ({ page }) => {
		await setupLayout(page, LAYOUTS.NESTED_BASIC);
		await removePanel(page, "AAA");
		const currentState = await saveLayout(page);
		expect(currentState).toStrictEqual({
			type: "split-layout",
			orientation: "horizontal",
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
			sizes: [0.6, 0.4],
		});
	});

	test("should remove panel from deeply nested layout", async ({ page }) => {
		await setupLayout(page, LAYOUTS.DEEPLY_NESTED_ALT);
		await removePanel(page, "BBB");
		const currentState = await saveLayout(page);
		expect(currentState).toStrictEqual({
			type: "split-layout",
			orientation: "vertical",
			children: [
				{
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
					],
					sizes: [0.5, 0.5],
				},
				{
					type: "tab-layout",
					tabs: ["DDD"],
					selected: 0,
				},
			],
			sizes: [0.7, 0.3],
		});
	});

	test("should preserve state with save/restore after removePanel", async ({
		page,
	}) => {
		await setupLayout(page, LAYOUTS.THREE_HORIZONTAL_304030);
		await removePanel(page, "BBB");
		const stateAfterRemove = await saveLayout(page);
		const currentState = await saveLayout(page);
		expect(currentState).toStrictEqual(stateAfterRemove);
	});
});

test.describe("tabs", () => {
	test("should remove a tab from the center of a 3-panel layout", async ({
		page,
	}) => {
		await setupLayout(page, LAYOUTS.THREE_HORIZONTAL_WITH_TABS);
		await removePanel(page, "BBB");
		const currentState = await saveLayout(page);
		expect(currentState).toStrictEqual({
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
					tabs: ["DDD", "EEE"],
					selected: 0,
				},
				{
					type: "tab-layout",
					tabs: ["CCC"],
					selected: 0,
				},
			],
			sizes: [0.2, 0.3, 0.5],
		});
	});
});
