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
import { LAYOUTS } from "../helpers/fixtures.ts";
import { calculate_intersection } from "../../src/layout/calculate_intersect.ts";

test("returns null for out-of-bounds coordinates", () => {
	expect(calculate_intersection(-0.1, 0.5, LAYOUTS.SINGLE_AAA)).toBeNull();
	expect(calculate_intersection(0.5, -0.1, LAYOUTS.SINGLE_AAA)).toBeNull();
	expect(calculate_intersection(1.1, 0.5, LAYOUTS.SINGLE_AAA)).toBeNull();
	expect(calculate_intersection(0.5, 1.1, LAYOUTS.SINGLE_AAA)).toBeNull();
});

test("returns panel path for single tab-layout", () => {
	const result = calculate_intersection(0.5, 0.5, LAYOUTS.SINGLE_AAA);
	expect(result).toStrictEqual({
		type: "layout-path",
		layout: LAYOUTS.SINGLE_AAA,
		slot: "AAA",
		path: [],
		view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
		is_edge: false,
		column: 0.5,
		row: 0.5,
		column_offset: 0.5,
		row_offset: 0.5,
		orientation: "horizontal",
	});
});

test("returns selected tab for right edge", () => {
	const result = calculate_intersection(1, 0.5, LAYOUTS.TWO_HORIZONTAL);
	expect(result).not.toBeNull();
	expect(result?.slot).toBe("BBB");
});

test("returns selected tab for multi-tab layout", () => {
	const result = calculate_intersection(0.5, 0.5, LAYOUTS.SINGLE_TABS);
	expect(result).not.toBeNull();
	expect(result?.slot).toBe("AAA");
});

test("hits left panel in horizontal split", () => {
	const result = calculate_intersection(0.1, 0.5, LAYOUTS.TWO_HORIZONTAL);
	expect(result).not.toBeNull();
	expect(result?.slot).toBe("AAA");
	expect(result?.path).toStrictEqual([0]);
});

test("hits right panel in horizontal split", () => {
	const result = calculate_intersection(0.5, 0.5, LAYOUTS.TWO_HORIZONTAL);
	expect(result).not.toBeNull();
	expect(result?.slot).toBe("BBB");
	expect(result?.path).toStrictEqual([1]);
});

test("hits top panel in vertical split", () => {
	const result = calculate_intersection(0.5, 0.1, LAYOUTS.TWO_VERTICAL);
	expect(result).not.toBeNull();
	expect(result?.slot).toBe("AAA");
	expect(result?.path).toStrictEqual([0]);
});

test("hits bottom panel in vertical split", () => {
	const result = calculate_intersection(0.5, 0.7, LAYOUTS.TWO_VERTICAL);
	expect(result).not.toBeNull();
	expect(result?.slot).toBe("BBB");
	expect(result?.path).toStrictEqual([1]);
});

test("hits nested panel in deeply nested layout", () => {
	// DEEPLY_NESTED: horizontal [0.6, 0.4] -> left is vertical [0.3, 0.7]
	// Left-top: col 0-0.6, row 0-0.3 -> AAA
	const result = calculate_intersection(0.1, 0.1, LAYOUTS.DEEPLY_NESTED);
	expect(result).not.toBeNull();
	expect(result?.slot).toBe("AAA");
	expect(result?.path).toStrictEqual([0, 0]);
});

test("hits sibling nested panel", () => {
	// Right-bottom: col 0.6-1.0, row 0.5-1.0 -> DDD
	const result = calculate_intersection(0.8, 0.8, LAYOUTS.DEEPLY_NESTED);
	expect(result).not.toBeNull();
	expect(result?.slot).toBe("DDD");
	expect(result?.path).toStrictEqual([1, 1]);
});

test("computes correct view_window for child panel", () => {
	// TWO_HORIZONTAL_EQUAL: horizontal [0.5, 0.5]
	// Right panel: col_start=0.5, col_end=1.0
	const result = calculate_intersection(
		0.75,
		0.5,
		LAYOUTS.TWO_HORIZONTAL_EQUAL,
	);
	expect(result).not.toBeNull();
	expect(result?.view_window).toStrictEqual({
		row_start: 0,
		row_end: 1,
		col_start: 0.5,
		col_end: 1,
	});
});

test("computes correct column_offset and row_offset", () => {
	// TWO_HORIZONTAL_EQUAL: right panel spans col 0.5-1.0
	// column=0.75 -> offset = (0.75 - 0.5) / 0.5 = 0.5
	const result = calculate_intersection(
		0.75,
		0.25,
		LAYOUTS.TWO_HORIZONTAL_EQUAL,
	);
	expect(result).not.toBeNull();
	expect(result?.column_offset).toBe(0.5);
	expect(result?.row_offset).toBe(0.25);
});

test("sets orientation from parent split", () => {
	const horiz = calculate_intersection(0.1, 0.5, LAYOUTS.TWO_HORIZONTAL);
	expect(horiz?.orientation).toBe("horizontal");

	const vert = calculate_intersection(0.5, 0.1, LAYOUTS.TWO_VERTICAL);
	expect(vert?.orientation).toBe("vertical");
});

test("hits middle panel in three-way split", () => {
	// THREE_HORIZONTAL: sizes [0.3, 0.3, 0.4] -> BBB is col 0.3-0.6
	const result = calculate_intersection(0.45, 0.5, LAYOUTS.THREE_HORIZONTAL);
	expect(result).not.toBeNull();
	expect(result?.slot).toBe("BBB");
	expect(result?.path).toStrictEqual([1]);
});
