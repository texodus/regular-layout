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
import { TEST_PANEL } from "../fixtures.ts";
import { calculate_split } from "../../src/common/calculate_split.ts";
import { calculate_intersection } from "../../src/common/calculate_intersect.ts";
import type { Layout, LayoutPath } from "../../src/common/layout_config.ts";

test.describe("calculate_split", () => {
	test("cursor in center of panel - no split", () => {
		const drop_target = calculate_intersection(0.3, 0.5, TEST_PANEL, false);
		const result = calculate_split(0.3, 0.5, TEST_PANEL, "DDD", drop_target);

		expect(result.is_edge).toBe(false);
		expect(result.slot).toBe("BBB");
	});

	test("cursor near left edge of vertical split panel", () => {
		const drop_target = calculate_intersection(0.05, 0.3, TEST_PANEL, false);
		const result = calculate_split(0.05, 0.3, TEST_PANEL, "DDD", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("DDD");
	});

	test("cursor near right edge of vertical split panel", () => {
		const drop_target = calculate_intersection(0.55, 0.3, TEST_PANEL, false);
		const result = calculate_split(0.55, 0.3, TEST_PANEL, "DDD", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("DDD");
	});

	test("cursor near top edge of horizontal split panel", () => {
		const drop_target = calculate_intersection(0.7, 0.05, TEST_PANEL, false);
		const result = calculate_split(0.7, 0.05, TEST_PANEL, "DDD", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("CCC"); // ???
	});

	test("cursor near bottom edge of horizontal split panel", () => {
		const drop_target = calculate_intersection(0.7, 0.95, TEST_PANEL, false);
		const result = calculate_split(0.7, 0.95, TEST_PANEL, "DDD", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("CCC"); // ???
	});

	test("cursor near left edge but with horizontal orientation", () => {
		const singlePanel: Layout = {
			type: "split-panel",
			sizes: [1],
			orientation: "horizontal",
			children: [
				{
					type: "child-panel",
					child: ["AAA"],
				},
			],
		};

		const drop_target = calculate_intersection(0.05, 0.5, singlePanel, false);
		const result = calculate_split(0.05, 0.5, singlePanel, "BBB", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("BBB");
	});

	test("cursor near right edge but with horizontal orientation", () => {
		const singlePanel: Layout = {
			type: "split-panel",
			orientation: "horizontal",
			sizes: [1],
			children: [
				{
					type: "child-panel",
					child: ["AAA"],
				},
			],
		};

		const drop_target = calculate_intersection(0.95, 0.5, singlePanel, false);
		const result = calculate_split(0.95, 0.5, singlePanel, "BBB", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("BBB");
	});

	test("cursor near top edge but with vertical orientation", () => {
		const singlePanel: Layout = {
			type: "split-panel",
			orientation: "vertical",
			sizes: [1],
			children: [
				{
					type: "child-panel",
					child: ["AAA"],
				},
			],
		};

		const drop_target = calculate_intersection(0.5, 0.05, singlePanel, false);
		const result = calculate_split(0.5, 0.05, singlePanel, "BBB", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("BBB");
	});

	test("cursor near bottom edge but with vertical orientation", () => {
		const singlePanel: Layout = {
			type: "split-panel",
			orientation: "vertical",
			sizes: [1],
			children: [
				{
					type: "child-panel",
					child: ["AAA"],
				},
			],
		};

		const drop_target = calculate_intersection(0.5, 0.95, singlePanel, false);
		const result = calculate_split(0.5, 0.95, singlePanel, "BBB", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("BBB");
	});

	test("integrated top edge", () => {
		const col = 0.51;
		const row = 0.002;
		const panel: Layout = { type: "child-panel", child: ["AAA"] };

		let drop_target = calculate_intersection(col, row, panel, false);
		if (drop_target) {
			drop_target = calculate_split(col, row, panel, "BBB", drop_target);
		}

		expect(drop_target.view_window).toStrictEqual({
			col_end: 1,
			col_start: 0,
			row_end: 0.5,
			row_start: 0,
		});
	});

	test("integrated right edge", () => {
		const col = 0.998;
		const row = 0.53;
		const panel: Layout = { type: "child-panel", child: ["AAA"] };

		let drop_target = calculate_intersection(col, row, panel, false);
		if (drop_target) {
			drop_target = calculate_split(col, row, panel, "BBB", drop_target);
		}

		expect(drop_target.view_window).toStrictEqual({
			col_end: 1,
			col_start: 0.5,
			row_end: 1,
			row_start: 0,
		});
	});

	test("cursor in top-left corner prioritizes row offset", () => {
		const singlePanel: Layout = {
			type: "child-panel",
			child: ["AAA"],
		};

		const drop_target: LayoutPath = {
			type: "layout-path",
			slot: "AAA",
			panel: singlePanel,
			path: [],
			view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
			column_offset: 0.1,
			row_offset: 0.05,
			orientation: "horizontal",
			is_edge: false,
			box: undefined,
		};

		const result = calculate_split(0.1, 0.05, singlePanel, "BBB", drop_target);

		expect(result.is_edge).toBe(true);
	});

	test("cursor in bottom-right corner prioritizes row offset", () => {
		const singlePanel: Layout = {
			type: "child-panel",
			child: ["AAA"],
		};

		const drop_target: LayoutPath = {
			type: "layout-path",
			slot: "AAA",
			panel: singlePanel,
			path: [],
			view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
			column_offset: 0.9,
			row_offset: 0.95,
			orientation: "horizontal",
			is_edge: false,
			box: undefined,
		};

		const result = calculate_split(0.9, 0.95, singlePanel, "BBB", drop_target);

		expect(result.is_edge).toBe(true);
	});

	test("cursor near edge with offset exactly at tolerance threshold", () => {
		const singlePanel: Layout = {
			type: "child-panel",
			child: ["AAA"],
		};

		const drop_target: LayoutPath = {
			type: "layout-path",
			slot: "AAA",
			path: [],
			panel: singlePanel,
			view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
			column_offset: 0.3,
			row_offset: 0.5,
			orientation: "horizontal",
			is_edge: false,
			box: undefined,
		};

		const result = calculate_split(0.3, 0.5, singlePanel, "BBB", drop_target);

		expect(result.is_edge).toBe(false);
	});

	test("cursor near edge with offset just below tolerance threshold", () => {
		const singlePanel: Layout = {
			type: "child-panel",
			child: ["AAA"],
		};

		const drop_target: LayoutPath = {
			type: "layout-path",
			slot: "AAA",
			panel: singlePanel,
			path: [],
			view_window: { row_start: 0, row_end: 1, col_start: 0, col_end: 1 },
			column_offset: 0.14,
			row_offset: 0.5,
			orientation: "horizontal",
			is_edge: false,
			box: undefined,
		};

		const result = calculate_split(0.14, 0.5, singlePanel, "BBB", drop_target);

		expect(result.is_edge).toBe(true);
	});

	test("nested panel with vertical orientation at left edge", () => {
		const drop_target = calculate_intersection(0.02, 0.3, TEST_PANEL, false);
		const result = calculate_split(0.02, 0.3, TEST_PANEL, "DDD", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("DDD");
		expect(result.path).toEqual([0, 1, 0]);
	});

	test("nested panel with vertical orientation at right edge", () => {
		const drop_target = calculate_intersection(0.58, 0.3, TEST_PANEL, false);
		const result = calculate_split(0.58, 0.3, TEST_PANEL, "DDD", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("DDD");
		expect(result.path).toEqual([0, 1, 1]);
	});

	test("complex layout with multiple nested panels", () => {
		const complexPanel: Layout = {
			type: "split-panel",
			orientation: "horizontal",
			sizes: [0.5, 0.5],
			children: [
				{
					type: "split-panel",
					orientation: "vertical",
					sizes: [0.5, 0.5],
					children: [
						{
							type: "child-panel",
							child: ["A"],
						},
						{
							type: "child-panel",
							child: ["B"],
						},
					],
				},
				{
					type: "child-panel",
					child: ["C"],
				},
			],
		};

		const drop_target = calculate_intersection(0.02, 0.3, complexPanel, false);
		const result = calculate_split(0.02, 0.3, complexPanel, "DDD", drop_target);

		expect(result.is_edge).toBe(true);
		expect(result.slot).toBe("DDD");
	});

	test("preserves drop_target properties when no split occurs", () => {
		const drop_target = calculate_intersection(0.3, 0.3, TEST_PANEL, false);
		const result = calculate_split(0.3, 0.3, TEST_PANEL, "DDD", drop_target);

		expect(result.view_window).toBeDefined();
		expect(result.path).toBeDefined();
		expect(result.orientation).toBeDefined();
	});
});
