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
import { calculate_intersection } from "../../src/layout/calculate_intersect.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";
import { DEFAULT_PHYSICS } from "../../src/layout/constants.ts";

test("AAA", () => {
	const result = calculate_intersection(0.1, 0.1, LAYOUTS.NESTED_BASIC);
	expect(result).toStrictEqual({
		slot: "AAA",
		path: [0, 0],
		layout: { type: "child-panel", tabs: ["AAA"] },
		type: "layout-path",
		is_edge: false,
		orientation: "vertical",
		view_window: {
			col_end: 0.6,
			col_start: 0,
			row_end: 0.3,
			row_start: 0,
		},
		column: 0.1,
		row: 0.1,
		column_offset: 0.16666666666666669,
		row_offset: 0.33333333333333337,
	});
});

test("BBB", () => {
	const result = calculate_intersection(0.1, 0.4, LAYOUTS.NESTED_BASIC);
	expect(result).toStrictEqual({
		slot: "BBB",
		path: [0, 1],
		layout: { type: "child-panel", tabs: ["BBB"] },
		type: "layout-path",
		is_edge: false,
		orientation: "vertical",
		view_window: {
			col_end: 0.6,
			col_start: 0,
			row_end: 1,
			row_start: 0.3,
		},
		column: 0.1,
		row: 0.4,
		column_offset: 0.16666666666666669,
		row_offset: 0.1428571428571429,
	});
});

test("CCC", () => {
	const result = calculate_intersection(0.7, 0.1, LAYOUTS.NESTED_BASIC);
	expect(result).toStrictEqual({
		slot: "CCC",
		path: [1],
		layout: { type: "child-panel", tabs: ["CCC"] },
		type: "layout-path",
		is_edge: false,
		orientation: "horizontal",
		view_window: {
			row_end: 1,
			row_start: 0,
			col_end: 1,
			col_start: 0.6,
		},
		column: 0.7,
		row: 0.1,
		column_offset: 0.24999999999999994,
		row_offset: 0.1,
	});
});

test("gap", () => {
	const result = calculate_intersection(0.6, 0.1, LAYOUTS.NESTED_BASIC, {
		size: DEFAULT_PHYSICS.GRID_DIVIDER_SIZE,
		rect: {
			width: 100,
			height: 100,
		} as DOMRect,
	});

	expect(result).toStrictEqual({
		path: [0],
		type: "horizontal",
		view_window: {
			row_start: 0,
			row_end: 1,
			col_start: 0,
			col_end: 0.6,
		},
	});
});

test("nested gap", () => {
	const result = calculate_intersection(0.1, 0.3, LAYOUTS.NESTED_BASIC, {
		size: DEFAULT_PHYSICS.GRID_DIVIDER_SIZE,
		rect: {
			width: 100,
			height: 100,
		} as DOMRect,
	});
	expect(result).toStrictEqual({
		path: [0, 0],
		type: "vertical",
		view_window: {
			row_start: 0,
			row_end: 0.3,
			col_start: 0,
			col_end: 0.6,
		},
	});
});

test("single AAA", () => {
	const result = calculate_intersection(0.1, 0.3, LAYOUTS.SINGLE_AAA, {
		size: DEFAULT_PHYSICS.GRID_DIVIDER_SIZE,
		rect: {
			width: 100,
			height: 100,
		} as DOMRect,
	});
	expect(result).toStrictEqual({
		layout: { type: "child-panel", tabs: ["AAA"] },
		column: 0.1,
		column_offset: 0.1,
		is_edge: false,
		orientation: "horizontal",
		path: [],
		row: 0.3,
		row_offset: 0.3,
		slot: "AAA",
		type: "layout-path",
		view_window: {
			col_end: 1,
			col_start: 0,
			row_end: 1,
			row_start: 0,
		},
	});
});
