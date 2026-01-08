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
import { insert_child } from "../../src/common/insert_child.ts";

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
						child: ["AAA"],
					},
					{
						type: "child-panel",
						child: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				child: ["CCC"],
			},
			{
				type: "child-panel",
				child: ["DDD"],
			},
		],
		sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
		orientation: "horizontal",
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
						child: ["AAA"],
					},
					{
						type: "child-panel",
						child: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				child: ["CCC"],
			},
			{
				type: "child-panel",
				child: ["DDD"],
			},
		],
		sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
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
						child: ["AAA"],
					},
					{
						type: "child-panel",
						child: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				child: ["DDD"],
			},
			{
				type: "child-panel",
				child: ["CCC"],
			},
		],
		sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
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
						child: ["AAA"],
					},
					{
						type: "child-panel",
						child: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
			},
			{
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
						type: "child-panel",
						child: ["CCC"],
					},
					{
						type: "child-panel",
						child: ["DDD"],
					},
				],
				sizes: [0.5, 0.5],
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
						child: ["AAA"],
					},
					{
						type: "child-panel",
						child: ["BBB"],
					},
					{
						type: "child-panel",
						child: ["DDD"],
					},
				],
				sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				child: ["CCC"],
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
						type: "split-panel",
						orientation: "horizontal",
						children: [
							{
								type: "child-panel",
								child: ["AAA"],
							},
							{
								type: "child-panel",
								child: ["DDD"],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						child: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				child: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("insert into single child panel", () => {
	const result = insert_child(LAYOUTS.SINGLE_ONLY, "SECOND", [], "horizontal");
	expect(result).toStrictEqual({
		type: "child-panel",
		child: ["SECOND", "ONLY"],
	});
});

test("insert into single child panel, on the top edge", () => {
	const result = insert_child(LAYOUTS.SINGLE_ONLY, "SECOND", [0], "vertical");
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "vertical",
		children: [
			{
				type: "child-panel",
				child: ["SECOND"],
			},
			{
				type: "child-panel",
				child: ["ONLY"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("insert into single child panel, on the left edge", () => {
	const result = insert_child(LAYOUTS.SINGLE_ONLY, "SECOND", [0], "horizontal");
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				child: ["SECOND"],
			},
			{
				type: "child-panel",
				child: ["ONLY"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("insert into single child panel, on the bottom edge", () => {
	const result = insert_child(LAYOUTS.SINGLE_ONLY, "SECOND", [1], "vertical");
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "vertical",
		children: [
			{
				type: "child-panel",
				child: ["ONLY"],
			},
			{
				type: "child-panel",
				child: ["SECOND"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("insert into single child panel, on the right edge", () => {
	const result = insert_child(LAYOUTS.SINGLE_ONLY, "SECOND", [1], "horizontal");
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				child: ["ONLY"],
			},
			{
				type: "child-panel",
				child: ["SECOND"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("insert into a child-panel root, on the top edge", () => {
	const result = insert_child(LAYOUTS.SINGLE_AAA, "BBB", [0], "vertical");
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "vertical",
		children: [
			{
				type: "child-panel",
				child: ["BBB"],
			},
			{
				type: "child-panel",
				child: ["AAA"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("insert with split path into SINGLE_TABS", () => {
	const result = insert_child(LAYOUTS.SINGLE_TABS, "DDD", [0, 1], "horizontal");
	expect(result).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
						type: "child-panel",
						child: ["AAA", "BBB", "CCC"],
						selected: 0,
					},
					{
						type: "child-panel",
						child: ["DDD"],
						// TODO this one case does not call flatten internally for performance
						// selected: 0,
					},
				],
				sizes: [0.5, 0.5],
			},
		],
		sizes: [1],
	});
});
