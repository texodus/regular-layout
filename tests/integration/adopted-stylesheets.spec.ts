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
import type { Page } from "@playwright/test";
import { setupLayout, restoreLayout } from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

/**
 * Helper function to get the CSS content from adoptedStyleSheets
 */
async function getAdoptedStyleSheetCSS(
	page: Page,
	index: number = 0,
): Promise<string> {
	return await page.evaluate((idx: number) => {
		const layout = document.querySelector("regular-layout");
		if (!layout) return "";
		const shadowRoot = (layout as unknown as { shadowRoot: ShadowRoot })
			.shadowRoot;
		if (!shadowRoot?.adoptedStyleSheets?.[idx]) return "";
		const rules = Array.from(shadowRoot.adoptedStyleSheets[idx].cssRules);
		return rules.map((rule: CSSRule) => rule.cssText).join("\n");
	}, index);
}

/**
 * Helper to normalize CSS by removing whitespace variations
 */
function normalizeCSS(css: string): string {
	return css
		.replace(/\s+/g, " ")
		.replace(/\s*{\s*/g, "{")
		.replace(/\s*}\s*/g, "}")
		.replace(/\s*:\s*/g, ":")
		.replace(/\s*;\s*/g, ";")
		.trim();
}

test("should generate correct CSS for SINGLE_AAA layout", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(":host::slotted(*){display:none;}"),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			":host{display:grid;grid-template-rows:100%;grid-template-columns:100%;}",
		),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="AAA"]){display:flex;grid-area:1 / 1;}'),
	);
});

test("should generate correct CSS for SINGLE_TABS layout", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_TABS);
	const css = await getAdoptedStyleSheetCSS(page);
	// Stacked tabs overlap in one cell; only the selected tab is lifted.
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			':host::slotted([name="AAA"]){display:flex;grid-area:1 / 1;z-index:1;}',
		),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="BBB"]){display:flex;grid-area:1 / 1;}'),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="CCC"]){display:flex;grid-area:1 / 1;}'),
	);
});

test("should generate correct CSS for TWO_HORIZONTAL layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			":host{display:grid;grid-template-rows:100fr;grid-template-columns:30fr 70fr;}",
		),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="AAA"]){display:flex;grid-area:1 / 1;}'),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="BBB"]){display:flex;grid-area:1 / 2;}'),
	);
});

test("should generate correct CSS for TWO_VERTICAL layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_VERTICAL);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			":host{display:grid;grid-template-rows:50fr 50fr;grid-template-columns:100fr;}",
		),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="AAA"]){display:flex;grid-area:1 / 1;}'),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="BBB"]){display:flex;grid-area:2 / 1;}'),
	);
});

test("should generate correct CSS for THREE_HORIZONTAL layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.THREE_HORIZONTAL);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			":host{display:grid;grid-template-rows:100fr;grid-template-columns:30fr 30fr 40fr;}",
		),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="AAA"]){display:flex;grid-area:1 / 1;}'),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="BBB"]){display:flex;grid-area:1 / 2;}'),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="CCC"]){display:flex;grid-area:1 / 3;}'),
	);
});

test("should generate correct CSS for NESTED_BASIC layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.NESTED_BASIC);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			":host{display:grid;grid-template-rows:30fr 70fr;grid-template-columns:60fr 40fr;}",
		),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="AAA"]){display:flex;grid-area:1 / 1;}'),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="BBB"]){display:flex;grid-area:2 / 1;}'),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			':host::slotted([name="CCC"]){display:flex;grid-area:1 / 2 / 3;}',
		),
	);
});

test("should generate correct CSS for NESTED_VERTICAL_OUTER layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.NESTED_VERTICAL_OUTER);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			":host{display:grid;grid-template-rows:60fr 40fr;grid-template-columns:30fr 70fr;}",
		),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="AAA"]){display:flex;grid-area:1 / 1;}'),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="BBB"]){display:flex;grid-area:1 / 2;}'),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			':host::slotted([name="CCC"]){display:flex;grid-area:2 / 1 / auto / 3;}',
		),
	);
});

test("should generate correct CSS for DEEPLY_NESTED layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.DEEPLY_NESTED);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain("grid-template-columns:60fr 40fr");
	expect(css).toContain("grid-template-rows");
	expect(normalizeCSS(css)).toContain('name="AAA"');
	expect(normalizeCSS(css)).toContain('name="BBB"');
	expect(normalizeCSS(css)).toContain('name="CCC"');
	expect(normalizeCSS(css)).toContain('name="DDD"');
});

test("should generate correct CSS for THREE_HORIZONTAL_CUSTOM sizes", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.THREE_HORIZONTAL_CUSTOM);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			":host{display:grid;grid-template-rows:100fr;grid-template-columns:20fr 30fr 50fr;}",
		),
	);

	expect(normalizeCSS(css)).toContain('name="AAA"');
	expect(normalizeCSS(css)).toContain('name="BBB"');
	expect(normalizeCSS(css)).toContain('name="CCC"');
});

test("should generate correct CSS for THREE_VERTICAL_CDE layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.THREE_VERTICAL_CDE);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(
			":host{display:grid;grid-template-rows:30fr 30fr 40fr;grid-template-columns:100fr;}",
		),
	);

	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="CCC"]){display:flex;grid-area:1 / 1;}'),
	);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="DDD"]){display:flex;grid-area:2 / 1;}'),
	);
	expect(normalizeCSS(css)).toContain(
		normalizeCSS(':host::slotted([name="EEE"]){display:flex;grid-area:3 / 1;}'),
	);
});

test("should generate correct CSS for COMPLEX_FOUR_CHILDREN layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.COMPLEX_FOUR_CHILDREN);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain('name="AAA"');
	expect(normalizeCSS(css)).toContain('name="BBB"');
	expect(normalizeCSS(css)).toContain('name="CCC"');
	expect(normalizeCSS(css)).toContain('name="DDD"');
	expect(normalizeCSS(css)).toContain('name="EEE"');
	expect(normalizeCSS(css)).toContain('name="FFF"');
	const panels = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF"];
	for (const panel of panels) {
		const regex = new RegExp(
			`::slotted\\(\\[name="${panel}"\\]\\)\\s*{[^}]*display:\\s*flex`,
		);
		expect(css).toMatch(regex);
	}
});

test("should update CSS when restoring different layouts", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	let css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain('name="AAA"');
	expect(normalizeCSS(css)).not.toContain('name="BBB"');

	await restoreLayout(page, LAYOUTS.TWO_HORIZONTAL);
	css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain('name="AAA"');
	expect(normalizeCSS(css)).toContain('name="BBB"');
	expect(normalizeCSS(css)).toContain("grid-template-columns:30fr 70fr");

	await restoreLayout(page, LAYOUTS.NESTED_BASIC);
	css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain('name="AAA"');
	expect(normalizeCSS(css)).toContain('name="BBB"');
	expect(normalizeCSS(css)).toContain('name="CCC"');
	expect(normalizeCSS(css)).toContain("grid-template-columns:60fr 40fr");
	expect(normalizeCSS(css)).toContain("grid-template-rows:30fr 70fr");
});

test("should generate correct CSS for TWO_HORIZONTAL_WITH_TABS", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_WITH_TABS);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain('name="AAA"');
	expect(normalizeCSS(css)).toContain('name="CCC"');
	// BBB is stacked with AAA; it is now placed (overlapped), not omitted.
	expect(normalizeCSS(css)).toContain('name="BBB"');
	expect(normalizeCSS(css)).toContain("grid-template-columns:50fr 50fr");
});

test("should generate correct CSS for NESTED_ALIGNED layout", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.NESTED_ALIGNED);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(normalizeCSS(css)).toContain('name="AAA"');
	expect(normalizeCSS(css)).toContain('name="BBB"');
	expect(normalizeCSS(css)).toContain('name="DDD"');
	expect(normalizeCSS(css)).toContain('name="FFF"');
	expect(css).toMatch(/grid-area/);
});

test("should handle empty layout", async ({ page }) => {
	await setupLayout(page);
	const css = await getAdoptedStyleSheetCSS(page);
	expect(css.length).toBeGreaterThan(0);
});
