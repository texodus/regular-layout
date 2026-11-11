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

const TAGS = ["regular-layout", "regular-layout-frame", "regular-layout-tab"];

// A page with no copy of the library loaded, so registration is observable.
const BLANK = "/tests/fixtures/blank.html";

test("the components entry point does not register on import", async ({
	page,
}) => {
	await page.goto(BLANK);
	const defined = await page.evaluate(async (tags) => {
		await import("/.esbuild-serve/components.js" as string);
		return tags.filter((tag) => customElements.get(tag));
	}, TAGS);

	expect(defined).toStrictEqual([]);
});

test("defineCustomElements registers every element, idempotently", async ({
	page,
}) => {
	await page.goto(BLANK);
	const result = await page.evaluate(async (tags) => {
		const lib = await import("/.esbuild-serve/components.js" as string);
		lib.defineCustomElements();
		lib.defineCustomElements();
		return {
			defined: tags.filter((tag) => customElements.get(tag)),
			same: customElements.get("regular-layout") === lib.RegularLayout,
		};
	}, TAGS);

	expect(result.defined).toStrictEqual(TAGS);
	expect(result.same).toBe(true);
});

test("the default entry point registers on import, and is safe to import alongside the components entry point", async ({
	page,
}) => {
	await page.goto(BLANK);
	const result = await page.evaluate(async (tags) => {
		const auto = await import("/.esbuild-serve/regular-layout.js" as string);
		const manual = await import("/.esbuild-serve/components.js" as string);
		manual.defineCustomElements();
		return {
			defined: tags.filter((tag) => customElements.get(tag)),
			shared: auto.RegularLayout === manual.RegularLayout,
		};
	}, TAGS);

	expect(result.defined).toStrictEqual(TAGS);
	expect(result.shared).toBe(true);
});

test("the default entry point skips tag names another copy already defined", async ({
	page,
}) => {
	await page.goto(BLANK);
	const result = await page.evaluate(async (tags) => {
		// Stand-in for a second copy of the library which loaded first.
		class Other extends HTMLElement {}
		customElements.define("regular-layout", Other);
		const errors: string[] = [];
		window.addEventListener("error", (e) => errors.push(e.message));
		await import("/.esbuild-serve/regular-layout.js" as string);
		return {
			errors,
			kept: customElements.get("regular-layout") === Other,
			defined: tags.filter((tag) => customElements.get(tag)),
		};
	}, TAGS);

	expect(result.errors).toStrictEqual([]);
	expect(result.kept).toBe(true);
	expect(result.defined).toStrictEqual(TAGS);
});

test("the example page still works after defining again", async ({ page }) => {
	await page.goto("/examples/index.html");
	await page.waitForSelector("regular-layout");
	const tabs = await page.evaluate(async () => {
		const lib = await import("/.esbuild-serve/components.js" as string);
		lib.defineCustomElements();
		const layout = document.querySelector("regular-layout");
		await layout?.restore({ type: "tab-layout", tabs: ["AAA"] });
		return (layout?.save() as { tabs: string[] }).tabs;
	});

	expect(tabs).toStrictEqual(["AAA"]);
});
