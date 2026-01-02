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

test.describe("insertPanel and removePanel interaction", () => {
	test("should insert and remove panels sequentially", async ({ page }) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "child-panel",
				child: "AAA",
			});
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.insertPanel("BBB", []);
		});

		let currentState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(currentState).toMatchObject({
			type: "split-panel",
			children: expect.arrayContaining([
				expect.objectContaining({ child: "AAA" }),
				expect.objectContaining({ child: "BBB" }),
			]),
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.insertPanel("CCC", []);
		});

		currentState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(currentState).toMatchObject({
			type: "split-panel",
			children: expect.arrayContaining([
				expect.objectContaining({ child: "AAA" }),
				expect.objectContaining({ child: "BBB" }),
				expect.objectContaining({ child: "CCC" }),
			]),
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("BBB");
		});

		currentState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(currentState).toMatchObject({
			type: "split-panel",
			children: expect.arrayContaining([
				expect.objectContaining({ child: "AAA" }),
				expect.objectContaining({ child: "CCC" }),
			]),
		});
		expect(currentState).toMatchObject({
			type: "split-panel",
			children: expect.not.arrayContaining([
				expect.objectContaining({ child: "BBB" }),
			]),
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("CCC");
		});

		currentState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(currentState).toStrictEqual({
			type: "child-panel",
			child: "AAA",
		});
	});

	test("should handle complex insertion and removal sequence", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "child-panel",
				child: "AAA",
			});
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.insertPanel("BBB", []);
			layout?.insertPanel("CCC", [0, 1]);
			layout?.insertPanel("DDD", [1]);
		});

		let currentState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(currentState).toMatchObject({
			type: "split-panel",
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("CCC");
			layout?.removePanel("DDD");
		});

		currentState = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			return layout?.save();
		});

		expect(currentState).toMatchObject({
			type: "split-panel",
			children: expect.arrayContaining([
				expect.objectContaining({ child: "AAA" }),
				expect.objectContaining({ child: "BBB" }),
			]),
		});
	});

	test("should maintain correct slot assignments after insert/remove operations", async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.restore({
				type: "child-panel",
				child: "AAA",
			});
		});

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.insertPanel("BBB", []);
		});

		let slots = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			const slotElements = layout?.shadowRoot?.querySelectorAll("slot[name]");
			return Array.from(slotElements || [])
				.map((slot) => slot.getAttribute("name"))
				.sort();
		});

		expect(slots).toEqual(["AAA", "BBB"]);

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.insertPanel("CCC", []);
		});

		slots = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			const slotElements = layout?.shadowRoot?.querySelectorAll("slot[name]");
			return Array.from(slotElements || [])
				.map((slot) => slot.getAttribute("name"))
				.sort();
		});

		expect(slots).toEqual(["AAA", "BBB", "CCC"]);

		await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			layout?.removePanel("BBB");
		});

		slots = await page.evaluate(() => {
			const layout = document.querySelector("regular-layout");
			const slotElements = layout?.shadowRoot?.querySelectorAll("slot[name]");
			return Array.from(slotElements || [])
				.map((slot) => slot.getAttribute("name"))
				.sort();
		});

		expect(slots).toEqual(["AAA", "CCC"]);
	});
});
