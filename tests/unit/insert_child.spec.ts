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
import { insert_child } from "../../src/layout/insert_child.ts";

// - If the last index of the path is a split-panel, insert at that point.
// - If the last index of the path is a child panel, stack at the last position in the tab
// - If the second to last position is a child panel, stack in the position of the last index.
// - if _edge_mode_ is set, always insert in a split panel at the second to last index

test("insert into root split panel", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", []);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
		],
		sizes: [0.39999999999999997, 0.26666666666666666, 0.3333333333333333],
		orientation: "horizontal",
	});
});

test("insert into root split panel edge", () => {
	const result = insert_child(
		LAYOUTS.NESTED_BASIC,
		"DDD",
		[0],
		"vertical",
		// true,
	);

	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "vertical",
		sizes: [0.5, 0.5],
		children: [
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
			{
				type: "split-panel",
				children: [
					{
						type: "split-panel",
						children: [
							{
								type: "child-panel",
								tabs: ["AAA"],
							},
							{
								type: "child-panel",
								tabs: ["BBB"],
							},
						],
						sizes: [0.3, 0.7],
						orientation: "vertical",
					},
					{
						type: "child-panel",
						tabs: ["CCC"],
					},
				],
				sizes: [0.6, 0.4],
				orientation: "horizontal",
			},
		],
	});
});

test("insert into root split panel edge along the same orientation", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [0]);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
			{
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.3333333333333333, 0.39999999999999997, 0.26666666666666666],
		orientation: "horizontal",
	});
});

test("stack split panel", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [0, 1, 0]);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["DDD", "BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("stack split panel single child after", () => {
	const result = insert_child(LAYOUTS.SINGLE_AAA, "DDD", [1]);
	expect(result).toStrictEqual({
		type: "child-panel",
		tabs: ["AAA", "DDD"],
	});
});

test("stack split panel single child before", () => {
	const result = insert_child(LAYOUTS.SINGLE_AAA, "DDD", [0]);
	expect(result).toStrictEqual({
		type: "child-panel",
		tabs: ["DDD", "AAA"],
	});
});

test("stack split panel two horizontal before", () => {
	const result = insert_child(LAYOUTS.TWO_HORIZONTAL, "DDD", [0, 0]);
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["DDD", "AAA"],
			},
			{
				type: "child-panel",
				tabs: ["BBB"],
			},
		],
		sizes: [0.3, 0.7],
	});
});

test("stack split panel two horizontal after", () => {
	const result = insert_child(LAYOUTS.TWO_HORIZONTAL, "DDD", [0, 1]);
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA", "DDD"],
			},
			{
				type: "child-panel",
				tabs: ["BBB"],
			},
		],
		sizes: [0.3, 0.7],
	});
});

test("stack nested basic after", () => {
	const result = insert_child(LAYOUTS.TWO_HORIZONTAL, "DDD", [0, 1]);
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA", "DDD"],
			},
			{
				type: "child-panel",
				tabs: ["BBB"],
			},
		],
		sizes: [0.3, 0.7],
	});
});

test("stack nested basic after 5", () => {
	const result = insert_child(
		LAYOUTS.NESTED_BASIC,
		"DDD",
		[1, 0],
		// "horizontal",
		// false,
	);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["DDD", "CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("stack nested basic after 4", () => {
	const result = insert_child(LAYOUTS.TWO_HORIZONTAL_EQUAL, "DDD", [1]);
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA"],
			},
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
			{
				type: "child-panel",
				tabs: ["BBB"],
			},
		],
		sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
	});
});

test("append top level split-panel", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [2]);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
		],
		sizes: [0.39999999999999997, 0.26666666666666666, 0.3333333333333333],
		orientation: "horizontal",
	});
});

test("insert into top level split-panel", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [1]);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.39999999999999997, 0.3333333333333333, 0.26666666666666666],
		orientation: "horizontal",
	});
});

test("insert into top level split-panel 2", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [1, 0]);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["DDD", "CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("insert at path splitting a child panel", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [1, 1]);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
			},
			{
				type: "child-panel",
				tabs: ["CCC", "DDD"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("insert into nested split panel", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [0, 2]);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
					{
						type: "child-panel",
						tabs: ["DDD"],
					},
				],
				sizes: [0.19999999999999998, 0.4666666666666666, 0.3333333333333333],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("split a nested child panel", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [0, 0, 1]);
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["AAA", "DDD"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("insert into single child panel", () => {
	const result = insert_child(LAYOUTS.SINGLE_ONLY, "SECOND", []);
	expect(result).toStrictEqual({
		type: "child-panel",
		tabs: ["SECOND", "ONLY"],
	});
});

test("insert into single child panel, on the top edge", () => {
	const result = insert_child(
		LAYOUTS.SINGLE_ONLY,
		"SECOND",
		[0],
		// "vertical",
		// true,
	);

	expect(result).toStrictEqual({
		type: "child-panel",
		tabs: ["SECOND", "ONLY"],
	});
});

test("insert into single child panel, on the top edge with split", () => {
	const result = insert_child(
		LAYOUTS.SINGLE_ONLY,
		"SECOND",
		[0],
		"vertical",
		// true,
	);

	expect(result).toStrictEqual({
		type: "split-panel",
		sizes: [0.5, 0.5],
		orientation: "vertical",
		children: [
			{
				type: "child-panel",
				tabs: ["SECOND"],
			},
			{
				type: "child-panel",
				tabs: ["ONLY"],
			},
		],
	});
});

test("insert into single child panel, on the left edge", () => {
	const result = insert_child(
		LAYOUTS.SINGLE_ONLY,
		"SECOND",
		[1],
		// "vertical",
		// true,
	);

	expect(result).toStrictEqual({
		type: "child-panel",
		tabs: ["ONLY", "SECOND"],
	});
});

test("insert into single child panel, on the bottom edge", () => {
	const result = insert_child(
		LAYOUTS.SINGLE_ONLY,
		"SECOND",
		[1],
		"vertical",
		// true,
	);
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "vertical",
		children: [
			{
				type: "child-panel",
				tabs: ["ONLY"],
			},
			{
				type: "child-panel",
				tabs: ["SECOND"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("insert into single child panel, on the right edge", () => {
	const result = insert_child(
		LAYOUTS.SINGLE_ONLY,
		"SECOND",
		[1],
		"horizontal",
		// true,
	);
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["ONLY"],
			},
			{
				type: "child-panel",
				tabs: ["SECOND"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("insert into a child-panel root, on the top edge", () => {
	const result = insert_child(LAYOUTS.SINGLE_AAA, "BBB", [0]);
	expect(result).toStrictEqual({
		type: "child-panel",
		tabs: ["BBB", "AAA"],
	});
});

test("insert into a child-panel root, on the top edge with split", () => {
	const result = insert_child(LAYOUTS.SINGLE_AAA, "BBB", [0], "vertical");
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "vertical",
		children: [
			{
				type: "child-panel",
				tabs: ["BBB"],
			},
			{
				type: "child-panel",
				tabs: ["AAA"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("insert into SINGLE_TABS", () => {
	const result = insert_child(LAYOUTS.SINGLE_TABS, "DDD", [1]);
	expect(result).toStrictEqual({
		type: "child-panel",
		tabs: ["AAA", "DDD", "BBB", "CCC"],
		selected: 0,
	});
});

test("insert with split path into SINGLE_TABS", () => {
	const result = insert_child(
		LAYOUTS.SINGLE_TABS,
		"DDD",
		[1],
		"vertical",
		// true,
	);

	expect(result).toStrictEqual({
		type: "split-panel",
		sizes: [0.5, 0.5],
		orientation: "vertical",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA", "BBB", "CCC"],
				selected: 0,
			},
			{
				type: "child-panel",
				tabs: ["DDD"],
				// selected: 0,
			},
		],
	});
});
