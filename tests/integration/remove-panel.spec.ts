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

test.describe("removePanel", () => {
	test("should remove panel from 2-panel layout", async ({ page }) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "split-panel",
				orientation: "horizontal",
				children: [
					{
						type: "child-panel",
						child: ["AAA"],
					},
					{
						type: "child-panel",
						child: ["BBB"],
					},
				],
				sizes: [0.5, 0.5],
			});
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("BBB");
		});

		const afterRemove = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(afterRemove).toStrictEqual({
			type: "child-panel",
			child: ["AAA"],
		});

		const slots = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			const slotElements = layout?.shadowRoot?.querySelectorAll("slot[name]");
			return Array.from(slotElements || []).map((slot) =>
				slot.getAttribute("name"),
			);
		});

		expect(slots).not.toContain("BBB");
		expect(slots).toContain("AAA");
	});

	test("should remove panel from 3-panel layout", async ({ page }) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "split-panel",
				orientation: "horizontal",
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
						child: ["CCC"],
					},
				],
				sizes: [0.2, 0.3, 0.5],
			});
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("BBB");
		});

		const afterRemove = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(afterRemove).toStrictEqual({
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
			],
			sizes: [0.28571428571428575, 0.7142857142857143],
		});
	});

	test("should remove panel from nested layout", async ({ page }) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
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
						],
						sizes: [0.3, 0.7],
					},
					{
						type: "child-panel",
						child: ["CCC"],
					},
				],
				sizes: [0.6, 0.4],
			});
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("AAA");
		});

		const afterRemove = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(afterRemove).toStrictEqual({
			type: "split-panel",
			orientation: "horizontal",
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
			sizes: [0.6, 0.4],
		});
	});

	test("should remove panel from deeply nested layout", async ({ page }) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
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
								],
								sizes: [0.4, 0.6],
							},
							{
								type: "child-panel",
								child: ["CCC"],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						child: ["DDD"],
					},
				],
				sizes: [0.7, 0.3],
			});
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("BBB");
		});

		const afterRemove = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(afterRemove).toStrictEqual({
			type: "split-panel",
			orientation: "vertical",
			children: [
				{
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
					],
					sizes: [0.5, 0.5],
				},
				{
					type: "child-panel",
					child: ["DDD"],
				},
			],
			sizes: [0.7, 0.3],
		});
	});

	test("should preserve state with save/restore after removePanel", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "split-panel",
				orientation: "horizontal",
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
						child: ["CCC"],
					},
				],
				sizes: [0.3, 0.4, 0.3],
			});
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("BBB");
		});

		const stateAfterRemove = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, stateAfterRemove);

		const restoredState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(restoredState).toStrictEqual(stateAfterRemove);
	});
});

test.describe("tabs", () => {
	test("should remove a tab from the center of a 3-panel layout", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");
		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "split-panel",
				orientation: "horizontal",
				children: [
					{
						type: "child-panel",
						child: ["AAA"],
					},
					{
						type: "child-panel",
						child: ["BBB", "DDD", "EEE"],
					},
					{
						type: "child-panel",
						child: ["CCC"],
					},
				],
				sizes: [0.2, 0.3, 0.5],
			});
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("BBB");
		});

		const afterRemove = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(afterRemove).toStrictEqual({
			type: "split-panel",
			orientation: "horizontal",
			children: [
				{
					type: "child-panel",
					child: ["AAA"],
				},
				{
					type: "child-panel",
					child: ["DDD", "EEE"],
				},
				{
					type: "child-panel",
					child: ["CCC"],
				},
			],
			sizes: [0.2, 0.3, 0.5],
		});
	});
});
