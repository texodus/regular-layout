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
import { remove_child } from "../../src/layout/remove_child.ts";

test("remove child from nested split panel", () => {
	const result = remove_child(LAYOUTS.NESTED_BASIC, "AAA");
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "child-panel",
				child: ["BBB"],
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

test("remove child from top-level split panel", () => {
	const result = remove_child(LAYOUTS.NESTED_BASIC, "CCC");
	expect(result).toStrictEqual({
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
	});
});

test("remove child from top-level tab panel", () => {
	const result = remove_child(
		{
			type: "child-panel",
			child: ["AAA", "CCC"],
		},
		"AAA",
	);

	expect(result).toStrictEqual({
		type: "child-panel",
		child: ["CCC"],
	});
});

test("remove child from split panel with 3 children", () => {
	const result = remove_child(LAYOUTS.THREE_HORIZONTAL_CUSTOM, "BBB");
	expect(result).toStrictEqual({
		type: "split-panel",
		children: [
			{
				type: "child-panel",
				child: ["AAA"],
			},
			{
				type: "child-panel",
				child: ["CCC"],
			},
		],
		sizes: [0.28571428571428575, 0.7142857142857143],
		orientation: "horizontal",
	});
});

test("remove deeply nested child", () => {
	const result = remove_child(LAYOUTS.DEEPLY_NESTED_ALT, "BBB");
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
						child: ["CCC"],
					},
				],
				sizes: [0.5, 0.5],
				orientation: "horizontal",
			},
			{
				type: "child-panel",
				child: ["DDD"],
			},
		],
		sizes: [0.7, 0.3],
		orientation: "vertical",
	});
});
