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

test.describe("save and restore", () => {
	test("should save and restore a simple single-panel layout", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "child-panel",
				child: ["AAA"],
			});
		});

		const saved = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(saved).toStrictEqual({
			type: "child-panel",
			child: ["AAA"],
		});
	});

	test("should save and restore a simple single-panel layout, modify, and revert", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "child-panel",
				child: ["AAA"],
			});
		});

		const saved = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "child-panel",
				child: ["BBB"],
			});
		});

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, saved);

		const restored = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(restored).toStrictEqual(saved);
	});

	test("should save and restore a 2-panel horizontal split layout", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		const initialLayout: Layout = {
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
			sizes: [0.3, 0.7],
		};

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, initialLayout);

		const saved = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(saved).toStrictEqual(initialLayout);
	});

	test("should save and restore a nested layout", async ({ page }) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		const initialLayout: Layout = {
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
		};

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, initialLayout);

		const saved = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(saved).toStrictEqual(initialLayout);
	});

	test("should save and restore a nested layout, modify to single cell, revert", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		const initialLayout: Layout = {
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
		};

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, initialLayout);

		const saved = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(saved).toStrictEqual(initialLayout);

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "child-panel",
				child: ["DDD"],
			});
		});

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, saved);

		const restored = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(restored).toStrictEqual(initialLayout);
	});

	test("should save and restore a deeply nested layout", async ({ page }) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");
		const initialLayout: Layout = {
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
		};

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, initialLayout);

		const saved = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(saved).toStrictEqual(initialLayout);
	});

	test("should save returns a deep clone, not a reference", async ({
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
				],
				sizes: [0.5, 0.5],
			});
		});

		const saved = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.insertPanel("CCC", []);
		});

		const afterModification = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(afterModification).not.toStrictEqual(saved);
		expect(saved).toStrictEqual({
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

	test("should restore updates shadow DOM slots correctly", async ({
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
				],
				sizes: [0.5, 0.5],
			});
		});

		const initialSlots = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			const slotElements = layout?.shadowRoot?.querySelectorAll("slot[name]");
			return Array.from(slotElements || []).map((slot) =>
				slot.getAttribute("name"),
			);
		});

		expect(initialSlots).toContain("AAA");
		expect(initialSlots).toContain("BBB");
		expect(initialSlots).toHaveLength(2);

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
						type: "child-panel",
						child: ["CCC"],
					},
					{
						type: "child-panel",
						child: ["DDD"],
					},
					{
						type: "child-panel",
						child: ["EEE"],
					},
				],
				sizes: [0.3, 0.3, 0.4],
			});
		});

		const updatedSlots = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			const slotElements = layout?.shadowRoot?.querySelectorAll("slot[name]");
			return Array.from(slotElements || []).map((slot) =>
				slot.getAttribute("name"),
			);
		});

		expect(updatedSlots).not.toContain("AAA");
		expect(updatedSlots).not.toContain("BBB");
		expect(updatedSlots).toContain("CCC");
		expect(updatedSlots).toContain("DDD");
		expect(updatedSlots).toContain("EEE");
		expect(updatedSlots).toHaveLength(3);
	});

	test("should save and restore preserve exact size ratios", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		const customSizes: Layout = {
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
			sizes: [0.123456789, 0.456789123, 0.419754088],
		};

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, customSizes);

		const saved = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(saved).toStrictEqual(customSizes);

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, saved);

		const restored = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(restored).toStrictEqual(customSizes);
	});

	test("should save and restore handle empty then populated layout", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "child-panel",
				child: ["AAA"],
			});
		});

		const saved1 = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.insertPanel("BBB", []);
			layout?.insertPanel("CCC", []);
		});

		const saved2 = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, saved1);

		const restored1 = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(restored1).toStrictEqual(saved1);

		await page.evaluate((state) => {
			const layout = document.querySelector("regular-layout");
			layout?.restore(state as Layout);
		}, saved2);

		const restored2 = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(restored2).toStrictEqual(saved2);
	});
});
