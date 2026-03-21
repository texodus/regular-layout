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
import { calculate_path } from "../../src/layout/calculate_path.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

test("returns null for a name not in the layout", () => {
	const result = calculate_path("ZZZ", LAYOUTS.SINGLE_AAA);
	expect(result).toBeNull();
});

test("returns null for an empty layout", () => {
	const result = calculate_path("AAA", {
		type: "split-panel",
		orientation: "horizontal",
		sizes: [],
		children: [],
	});
	expect(result).toBeNull();
});

test("finds a single panel", () => {
	const result = calculate_path("AAA", LAYOUTS.SINGLE_AAA);
	expect(result).toStrictEqual([]);
});

test("finds left panel in horizontal split", () => {
	const result = calculate_path("AAA", LAYOUTS.TWO_HORIZONTAL);
	expect(result).toStrictEqual([0]);
});

test("finds right panel in horizontal split", () => {
	const result = calculate_path("BBB", LAYOUTS.TWO_HORIZONTAL);
	expect(result).toStrictEqual([1]);
});

test("finds top panel in vertical split", () => {
	const result = calculate_path("AAA", LAYOUTS.TWO_VERTICAL);
	expect(result).toStrictEqual([0]);
});

test("finds panel in nested layout", () => {
	const result = calculate_path("AAA", LAYOUTS.NESTED_BASIC);
	expect(result).toStrictEqual([0, 0]);
});

test("finds deeply nested panel", () => {
	const result = calculate_path("BBB", LAYOUTS.DEEPLY_NESTED);
	expect(result).toStrictEqual([0, 1]);
});

test("finds non-selected tab by name", () => {
	const result = calculate_path("BBB", LAYOUTS.SINGLE_TABS);
	expect(result).toStrictEqual([]);
});

test("finds leaf panel in deeply nested alt layout", () => {
	const result = calculate_path("DDD", LAYOUTS.DEEPLY_NESTED_ALT);
	expect(result).toStrictEqual([1]);
});
