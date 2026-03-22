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
	insertPanel,
	removePanel,
} from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("should return empty path for single panel", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const path = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.calculatePath("AAA");
	});
	expect(path).toStrictEqual([]);
});

test("should return null for panel not in layout", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const path = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.calculatePath("ZZZ");
	});
	expect(path).toBeNull();
});

test("should find panels in horizontal split", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const paths = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
		};
	});
	expect(paths.aaa).toStrictEqual([0]);
	expect(paths.bbb).toStrictEqual([1]);
});

test("should find panels in vertical split", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_VERTICAL);
	const paths = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
		};
	});
	expect(paths.aaa).toStrictEqual([0]);
	expect(paths.bbb).toStrictEqual([1]);
});

test("should find panels in nested layout", async ({ page }) => {
	await setupLayout(page, LAYOUTS.NESTED_BASIC);
	const paths = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
			ccc: layout?.calculatePath("CCC"),
		};
	});
	expect(paths.aaa).toStrictEqual([0, 0]);
	expect(paths.bbb).toStrictEqual([0, 1]);
	expect(paths.ccc).toStrictEqual([1]);
});

test("should find panels in deeply nested layout", async ({ page }) => {
	await setupLayout(page, LAYOUTS.DEEPLY_NESTED);
	const paths = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
			ccc: layout?.calculatePath("CCC"),
			ddd: layout?.calculatePath("DDD"),
		};
	});
	expect(paths.aaa).toStrictEqual([0, 0]);
	expect(paths.bbb).toStrictEqual([0, 1]);
	expect(paths.ccc).toStrictEqual([1, 0]);
	expect(paths.ddd).toStrictEqual([1, 1]);
});

test("should update paths after inserting a panel", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const before = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
			ccc: layout?.calculatePath("CCC"),
		};
	});
	expect(before.aaa).toStrictEqual([0]);
	expect(before.bbb).toStrictEqual([1]);
	expect(before.ccc).toBeNull();

	await insertPanel(page, "CCC", []);

	const after = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
			ccc: layout?.calculatePath("CCC"),
		};
	});
	expect(after.aaa).toStrictEqual([0]);
	expect(after.bbb).toStrictEqual([1]);
	// CCC is inserted as a tab alongside the root
	expect(after.ccc).not.toBeNull();
});

test("should update paths after removing a panel", async ({ page }) => {
	await setupLayout(page, LAYOUTS.THREE_HORIZONTAL);
	const before = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
			ccc: layout?.calculatePath("CCC"),
		};
	});
	expect(before.aaa).toStrictEqual([0]);
	expect(before.bbb).toStrictEqual([1]);
	expect(before.ccc).toStrictEqual([2]);

	await removePanel(page, "BBB");

	const after = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
			ccc: layout?.calculatePath("CCC"),
		};
	});
	expect(after.aaa).toStrictEqual([0]);
	expect(after.bbb).toBeNull();
	expect(after.ccc).toStrictEqual([1]);
});

test("should find non-selected tab by name", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_TABS);
	const paths = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
			ccc: layout?.calculatePath("CCC"),
		};
	});
	// All tabs share the same path since they're in the same tab-layout
	expect(paths.aaa).toStrictEqual([]);
	expect(paths.bbb).toStrictEqual([]);
	expect(paths.ccc).toStrictEqual([]);
});

test("should return null after clearing layout", async ({ page }) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const before = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.calculatePath("AAA");
	});
	expect(before).toStrictEqual([0]);

	await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		await layout?.clear();
	});

	const after = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.calculatePath("AAA");
	});
	expect(after).toBeNull();
});

test("should reflect paths after restore to different layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const path1 = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return layout?.calculatePath("AAA");
	});
	expect(path1).toStrictEqual([]);

	await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		await layout?.restore({
			type: "split-layout",
			orientation: "horizontal",
			children: [
				{ type: "tab-layout", tabs: ["BBB"] },
				{
					type: "split-layout",
					orientation: "vertical",
					children: [
						{ type: "tab-layout", tabs: ["AAA"] },
						{ type: "tab-layout", tabs: ["CCC"] },
					],
					sizes: [0.5, 0.5],
				},
			],
			sizes: [0.4, 0.6],
		});
	});

	const paths = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return {
			aaa: layout?.calculatePath("AAA"),
			bbb: layout?.calculatePath("BBB"),
			ccc: layout?.calculatePath("CCC"),
		};
	});
	expect(paths.bbb).toStrictEqual([0]);
	expect(paths.aaa).toStrictEqual([1, 0]);
	expect(paths.ccc).toStrictEqual([1, 1]);
});
