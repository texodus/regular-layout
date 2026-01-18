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
import { calculate_edge } from "../../src/layout/calculate_edge.ts";
import { calculate_intersection } from "../../src/layout/calculate_intersect.ts";
import type { Layout, LayoutPath } from "../../src/layout/types.ts";

test("cursor in center of panel - no split", () => {
	const drop_target = calculate_intersection(0.3, 0.5, LAYOUTS.NESTED_BASIC);
	expect(drop_target).not.toBeNull();
	const result = calculate_edge(
		0.3,
		0.5,
		LAYOUTS.NESTED_BASIC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(false);
	expect(result.slot).toBe("BBB");
	expect(result.path).toStrictEqual([0, 1, 0]);
});

test("cursor near left edge of vertical split panel", () => {
	const drop_target = calculate_intersection(0.1, 0.5, LAYOUTS.NESTED_BASIC);
	expect(drop_target).not.toBeNull();
	const result = calculate_edge(
		0.1,
		0.5,
		LAYOUTS.NESTED_BASIC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("BBB");
	expect(result.path).toStrictEqual([0, 1, 0]);
	expect(result.orientation).toBe("horizontal");
});

test("cursor near right edge of vertical split panel", () => {
	const drop_target = calculate_intersection(0.55, 0.5, LAYOUTS.NESTED_BASIC);
	const result = calculate_edge(
		0.55,
		0.5,
		LAYOUTS.NESTED_BASIC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("BBB");
	expect(result.path).toStrictEqual([0, 1, 1]);
	expect(result.orientation).toBe("horizontal");
});

test("cursor near top edge of horizontal split panel", () => {
	const drop_target = calculate_intersection(0.7, 0.05, LAYOUTS.NESTED_BASIC);
	const result = calculate_edge(
		0.7,
		0.05,
		LAYOUTS.NESTED_BASIC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("CCC");
	expect(result.path).toStrictEqual([1, 0]);
	expect(result.orientation).toBe("vertical");
});

test("cursor near bottom edge of horizontal split panel", () => {
	const drop_target = calculate_intersection(0.7, 0.95, LAYOUTS.NESTED_BASIC);
	const result = calculate_edge(
		0.7,
		0.95,
		LAYOUTS.NESTED_BASIC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("CCC");
	expect(result.path).toStrictEqual([1, 1]);
	expect(result.orientation).toBe("vertical");
});

test("cursor near left edge but with horizontal orientation", () => {
	const drop_target = calculate_intersection(
		0.05,
		0.5,
		LAYOUTS.SINGLE_SPLIT_HORIZONTAL,
	);

	const result = calculate_edge(
		0.05,
		0.5,
		LAYOUTS.SINGLE_SPLIT_HORIZONTAL,
		"BBB",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("AAA");
	expect(result.path).toStrictEqual([0]);
	expect(result.orientation).toBe("horizontal");
});

test("cursor near right edge but with horizontal orientation", () => {
	const drop_target = calculate_intersection(
		0.95,
		0.5,
		LAYOUTS.SINGLE_SPLIT_HORIZONTAL,
	);

	const result = calculate_edge(
		0.95,
		0.5,
		LAYOUTS.SINGLE_SPLIT_HORIZONTAL,
		"BBB",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("AAA");
});

test("cursor near top edge but with vertical orientation", () => {
	const drop_target = calculate_intersection(
		0.5,
		0.05,
		LAYOUTS.SINGLE_SPLIT_VERTICAL,
	);

	const result = calculate_edge(
		0.5,
		0.05,
		LAYOUTS.SINGLE_SPLIT_VERTICAL,
		"BBB",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("AAA");
});

test("cursor near bottom edge but with vertical orientation", () => {
	const drop_target = calculate_intersection(
		0.5,
		0.95,
		LAYOUTS.SINGLE_SPLIT_VERTICAL,
	);

	const result = calculate_edge(
		0.5,
		0.95,
		LAYOUTS.SINGLE_SPLIT_VERTICAL,
		"BBB",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("AAA");
});

test("integrated top edge", () => {
	const col = 0.51;
	const row = 0.15;
	let drop_target = calculate_intersection(col, row, LAYOUTS.SINGLE_AAA);
	if (drop_target) {
		drop_target = calculate_edge(
			col,
			row,
			LAYOUTS.SINGLE_AAA,
			"BBB",
			// biome-ignore lint/style/noNonNullAssertion: playwright assertion
			drop_target!,
		);
	}

	expect(drop_target?.view_window).toStrictEqual({
		col_end: 1,
		col_start: 0,
		row_end: 0.5,
		row_start: 0,
	});
});

test("integrated right edge", () => {
	const col = 0.85;
	const row = 0.53;
	let drop_target = calculate_intersection(col, row, LAYOUTS.SINGLE_AAA);
	if (drop_target) {
		drop_target = calculate_edge(
			col,
			row,
			LAYOUTS.SINGLE_AAA,
			"BBB",
			drop_target,
		);
	}

	expect(drop_target?.is_edge).toBe(true);
	expect(drop_target?.path).toStrictEqual([1]);
	expect(drop_target?.view_window).toStrictEqual({
		col_end: 1,
		col_start: 0.5,
		row_end: 1,
		row_start: 0,
	});
});

test("integrated far right edge", () => {
	const col = 0.996;
	const row = 0.53;
	let drop_target = calculate_intersection(col, row, LAYOUTS.SINGLE_AAA);
	if (drop_target) {
		drop_target = calculate_edge(
			col,
			row,
			LAYOUTS.SINGLE_AAA,
			"BBB",
			drop_target,
		);
	}

	expect(drop_target?.is_edge).toBe(true);
	expect(drop_target?.path).toStrictEqual([2]);
	expect(drop_target?.view_window).toStrictEqual({
		col_end: 1,
		col_start: 0.5,
		row_end: 1,
		row_start: 0,
	});
});

test("integrated far right edge 2", () => {
	const col = 0.996;
	const row = 0.53;
	let drop_target = calculate_intersection(col, row, LAYOUTS.NESTED_BASIC);
	if (drop_target) {
		drop_target = calculate_edge(
			col,
			row,
			LAYOUTS.SINGLE_AAA,
			"BBB",
			drop_target,
		);
	}

	expect(drop_target?.is_edge).toBe(true);
	expect(drop_target?.path).toStrictEqual([2]);
	expect(drop_target?.view_window).toStrictEqual({
		col_end: 1,
		col_start: 0.5,
		row_end: 1,
		row_start: 0,
	});
});

test("cursor in top-left corner prioritizes row offset", () => {
	const singlePanel = LAYOUTS.SINGLE_AAA;
	const drop_target: LayoutPath = {
		type: "layout-path",
		slot: "AAA",
		path: [],
		layout: undefined as unknown as Layout,
		view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
		column: 0.1,
		row: 0.05,
		column_offset: 0.1,
		row_offset: 0.05,
		orientation: "horizontal",
		is_edge: false,
	};

	const result = calculate_edge(0.1, 0.05, singlePanel, "BBB", drop_target);
	expect(result.is_edge).toBe(true);
	expect(result.path).toStrictEqual([0]);
	expect(result.view_window).toStrictEqual({
		col_end: 1,
		col_start: 0,
		row_end: 0.5,
		row_start: 0,
	});
});

test("cursor in bottom-right corner prioritizes row offset", () => {
	const singlePanel = LAYOUTS.SINGLE_AAA;
	const drop_target: LayoutPath = {
		type: "layout-path",
		slot: "AAA",
		layout: undefined as unknown as Layout,
		path: [],
		view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
		column: 0.9,
		row: 0.95,
		column_offset: 0.9,
		row_offset: 0.95,
		orientation: "horizontal",
		is_edge: false,
	};

	const result = calculate_edge(0.9, 0.95, singlePanel, "BBB", drop_target);
	expect(result).toStrictEqual({
		column: 0.9,
		column_offset: 0.9,
		is_edge: true,
		layout: undefined,
		orientation: "vertical",
		path: [1],
		row: 0.95,
		row_offset: 0.95,
		slot: "AAA",
		type: "layout-path",
		view_window: {
			col_end: 1,
			col_start: 0,
			row_end: 1,
			row_start: 0.5,
		},
	});
});

test("cursor in bottom-right corner prioritizes column offset", () => {
	const singlePanel = LAYOUTS.SINGLE_AAA;
	const drop_target: LayoutPath = {
		type: "layout-path",
		slot: "AAA",
		layout: undefined as unknown as Layout,
		path: [],
		view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
		column: 0.95,
		row: 0.9,
		column_offset: 0.95,
		row_offset: 0.9,
		orientation: "horizontal",
		is_edge: false,
	};

	const result = calculate_edge(0.95, 0.9, singlePanel, "BBB", drop_target);
	expect(result).toStrictEqual({
		column: 0.95,
		column_offset: 0.95,
		is_edge: true,
		layout: undefined,
		orientation: "horizontal",
		path: [1],
		row: 0.9,
		row_offset: 0.9,
		slot: "AAA",
		type: "layout-path",
		view_window: {
			col_end: 1,
			col_start: 0.5,
			row_end: 1,
			row_start: 0,
		},
	});
});

test("cursor near edge with offset exactly at tolerance threshold", () => {
	const singlePanel = LAYOUTS.SINGLE_AAA;
	const drop_target: LayoutPath = {
		type: "layout-path",
		slot: "AAA",
		path: [],
		layout: undefined as unknown as Layout,
		view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
		column: 0.3,
		row: 0.5,
		column_offset: 0.3,
		row_offset: 0.5,
		orientation: "horizontal",
		is_edge: false,
	};

	const result = calculate_edge(0.3, 0.5, singlePanel, "BBB", drop_target);
	expect(result.is_edge).toBe(false);
	expect(result.path).toStrictEqual([0]);
});

test("cursor near edge with offset just below tolerance threshold", () => {
	const singlePanel = LAYOUTS.SINGLE_AAA;
	const drop_target: LayoutPath = {
		type: "layout-path",
		slot: "AAA",
		path: [],
		layout: undefined as unknown as Layout,
		view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
		column: 0.14,
		row: 0.5,
		column_offset: 0.14,
		row_offset: 0.5,
		orientation: "horizontal",
		is_edge: false,
	};

	const result = calculate_edge(0.14, 0.5, singlePanel, "BBB", drop_target);
	expect(result.is_edge).toBe(true);
});

test("nested panel with vertical orientation at left edge", () => {
	const drop_target = calculate_intersection(0.02, 0.5, LAYOUTS.NESTED_BASIC);
	const result = calculate_edge(
		0.02,
		0.5,
		LAYOUTS.NESTED_BASIC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);
	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("BBB");
	expect(result.path).toEqual([0, 1, 0]);
});

test("nested panel with vertical orientation at right edge", () => {
	const drop_target = calculate_intersection(0.58, 0.5, LAYOUTS.NESTED_BASIC);
	const result = calculate_edge(
		0.58,
		0.5,
		LAYOUTS.NESTED_BASIC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);
	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("BBB");
	expect(result.path).toEqual([0, 1, 1]);
});

test("nested panel with vertical orientation at right edge2", () => {
	const drop_target = calculate_intersection(0.58, 0.5, LAYOUTS.NESTED_BASIC);
	const result = calculate_edge(
		0.58,
		0.5,
		LAYOUTS.NESTED_BASIC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);
	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("BBB");
	expect(result.path).toEqual([0, 1, 1]);
});

test("arbitrary regression", () => {
	const drop_target = calculate_intersection(0.8, 0.5, LAYOUTS.NESTED_BASIC);
	const result = calculate_edge(
		0.8,
		0.5,
		LAYOUTS.NESTED_BASIC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(false);
	expect(result.slot).toBe("CCC");
	expect(result.path).toEqual([1, 0]);
});

test("complex layout with multiple nested panels", () => {
	const drop_target = calculate_intersection(
		0.02,
		0.3,
		LAYOUTS.COMPLEX_NESTED_ABC,
	);

	const result = calculate_edge(
		0.02,
		0.3,
		LAYOUTS.COMPLEX_NESTED_ABC,
		"DDD",
		// biome-ignore lint/style/noNonNullAssertion: playwright assertion
		drop_target!,
	);

	expect(result.is_edge).toBe(true);
	expect(result.slot).toBe("A");
});
