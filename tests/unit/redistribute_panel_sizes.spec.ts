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
import { redistribute_panel_sizes } from "../../src/layout/redistribute_panel_sizes.ts";

test("redistribute depth 1 child", () => {
	const clone = redistribute_panel_sizes(
		structuredClone(LAYOUTS.NESTED_BASIC),
		[0],
		0.1,
	);

	expect(clone).toStrictEqual({
		type: "split-layout",
		children: [
			{
				type: "split-layout",
				children: [
					{
						type: "tab-layout",
						tabs: ["AAA"],
					},
					{
						type: "tab-layout",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "tab-layout",
				tabs: ["CCC"],
			},
		],
		sizes: [0.5, 0.5],
		orientation: "horizontal",
	});
});

test("redistribute depth 2 children", () => {
	const clone = redistribute_panel_sizes(LAYOUTS.NESTED_BASIC, [0, 0], 0.1);
	expect(clone).toStrictEqual({
		type: "split-layout",
		children: [
			{
				type: "split-layout",
				children: [
					{
						type: "tab-layout",
						tabs: ["AAA"],
					},
					{
						type: "tab-layout",
						tabs: ["BBB"],
					},
				],
				sizes: [0.19999999999999998, 0.7999999999999999],
				orientation: "vertical",
			},
			{
				type: "tab-layout",
				tabs: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("redistribute with 3 children", () => {
	const clone = redistribute_panel_sizes(
		LAYOUTS.NESTED_HORIZONTAL_WITH_VERTICAL_DDD,
		[0, 0],
		0.1,
	);
	expect(clone).toStrictEqual({
		type: "split-layout",
		children: [
			{
				type: "split-layout",
				children: [
					{
						type: "tab-layout",
						tabs: ["AAA"],
					},
					{
						type: "tab-layout",
						tabs: ["BBB"],
					},
					{
						type: "tab-layout",
						tabs: ["DDD"],
					},
				],
				sizes: [0.19999999999999998, 0.6857142857142857, 0.1142857142857143],
				orientation: "vertical",
			},
			{
				type: "tab-layout",
				tabs: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("redistribute nested spec with 4 children", () => {
	const clone = redistribute_panel_sizes(
		LAYOUTS.COMPLEX_FOUR_CHILDREN,
		[0, 1, 1],
		0.1,
	);
	expect(clone).toStrictEqual({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "split-layout",
				orientation: "horizontal",
				children: [
					{
						type: "tab-layout",
						tabs: ["AAA"],
					},
					{
						type: "split-layout",
						orientation: "vertical",
						children: [
							{
								type: "tab-layout",
								tabs: ["EEE"],
							},
							{
								type: "tab-layout",
								tabs: ["BBB"],
							},
							{
								type: "tab-layout",
								tabs: ["DDD"],
							},
							{
								type: "tab-layout",
								tabs: ["CCC"],
							},
						],
						sizes: [0.2, 0.2, 0.3, 0.3],
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "tab-layout",
				tabs: ["FFF"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("nested aligned splitpanels", () => {
	const clone = redistribute_panel_sizes(
		LAYOUTS.NESTED_ALIGNED,
		[0, 0, 0],
		0.1,
	);
	expect(clone).toStrictEqual({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "split-layout",
				orientation: "vertical",
				children: [
					{
						type: "split-layout",
						orientation: "horizontal",
						children: [
							{
								type: "tab-layout",
								tabs: ["AAA"],
							},
							{
								type: "tab-layout",
								tabs: ["BBB"],
							},
						],
						sizes: [0.3, 0.7],
					},
					{
						type: "tab-layout",
						tabs: ["DDD"],
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "tab-layout",
				tabs: ["FFF"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("nested aligned splitpanels, reversed orientation", () => {
	const clone = redistribute_panel_sizes(
		LAYOUTS.NESTED_ALIGNED_REVERSED,
		[0, 0, 1, 0],
		0.1,
	);
	expect(clone).toStrictEqual({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "split-layout",
				orientation: "vertical",
				children: [
					{
						type: "split-layout",
						orientation: "horizontal",
						children: [
							{
								type: "tab-layout",
								tabs: ["AAA"],
							},
							{
								type: "split-layout",
								orientation: "vertical",
								children: [
									{
										type: "tab-layout",
										tabs: ["BBB"],
									},
									{
										type: "tab-layout",
										tabs: ["CCC"],
									},
								],
								sizes: [0.3, 0.7],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "tab-layout",
						tabs: ["DDD"],
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "tab-layout",
				tabs: ["FFF"],
			},
		],
		sizes: [0.5, 0.5],
	});
});

test("nested aligned splitpanels, reversed orientation with asymmetric sizes", () => {
	const clone = redistribute_panel_sizes(
		LAYOUTS.NESTED_ALIGNED_ASYMMETRIC,
		[0, 0, 1, 0],
		0.1,
	);
	expect(clone).toStrictEqual({
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "split-layout",
				orientation: "vertical",
				children: [
					{
						type: "split-layout",
						orientation: "horizontal",
						children: [
							{
								type: "tab-layout",
								tabs: ["AAA"],
							},
							{
								type: "split-layout",
								orientation: "vertical",
								children: [
									{
										type: "tab-layout",
										tabs: ["BBB"],
									},
									{
										type: "tab-layout",
										tabs: ["CCC"],
									},
								],
								sizes: [0.3666666666666667, 0.6333333333333333],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "tab-layout",
						tabs: ["DDD"],
					},
				],
				sizes: [0.75, 0.25],
			},
			{
				type: "tab-layout",
				tabs: ["FFF"],
			},
		],
		sizes: [0.5, 0.5],
	});
});
