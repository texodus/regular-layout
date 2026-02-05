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
import type { Layout } from "../../src/layout/types.ts";

test("cursor near left edge of same orientation", () => {
	const result = insert_child(
		LAYOUTS.NESTED_BASIC,
		"DDD",
		[0, 1, 0],
		"horizontal",
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
						type: "split-panel",
						orientation: "horizontal",
						sizes: [0.5, 0.5],
						children: [
							{
								type: "child-panel",
								tabs: ["DDD"],
							},
							{
								type: "child-panel",
								tabs: ["BBB"],
							},
						],
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

test("cursor near top edge of opposite orientation", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [0], "vertical");

	expect(result).toStrictEqual({
		type: "split-panel",
		sizes: [0.5, 0.5],
		orientation: "vertical",
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

test("cursor near bottom edge but with opposite orientation", () => {
	const result = insert_child(
		LAYOUTS.NESTED_BASIC,
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
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
		],
	});
});

test("arbitrary regression also", () => {
	const PANEL: Layout = {
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
						type: "split-panel",
						orientation: "horizontal",
						children: [
							{
								type: "child-panel",
								tabs: ["AAA"],
								selected: 0,
							},
							{
								type: "split-panel",
								orientation: "vertical",
								children: [
									{
										type: "child-panel",
										tabs: ["BBB"],
										selected: 0,
									},
									{
										type: "child-panel",
										tabs: ["CCC"],
										selected: 0,
									},
								],
								sizes: [0.5, 0.5],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						tabs: ["EEE"],
						selected: 0,
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "child-panel",
				tabs: ["FFF", "GGG", "HHH"],
				selected: 0,
			},
		],
		sizes: [0.5, 0.5],
	};

	const result = insert_child(PANEL, "QQQ", [1], "vertical");
	expect(result).toStrictEqual({
		sizes: [0.5, 0.5],
		type: "split-panel",
		orientation: "vertical",
		children: [
			{
				type: "split-panel",
				orientation: "horizontal",
				children: [
					{
						type: "split-panel",
						orientation: "vertical",
						children: [
							{
								type: "split-panel",
								orientation: "horizontal",
								children: [
									{
										type: "child-panel",
										tabs: ["AAA"],
										selected: 0,
									},
									{
										type: "split-panel",
										orientation: "vertical",
										children: [
											{
												type: "child-panel",
												tabs: ["BBB"],
												selected: 0,
											},
											{
												type: "child-panel",
												tabs: ["CCC"],
												selected: 0,
											},
										],
										sizes: [0.5, 0.5],
									},
								],
								sizes: [0.5, 0.5],
							},
							{
								type: "child-panel",
								tabs: ["EEE"],
								selected: 0,
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						tabs: ["FFF", "GGG", "HHH"],
						selected: 0,
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "child-panel",
				tabs: ["QQQ"],
				// selected: 0,
			},
		],
	});
});
