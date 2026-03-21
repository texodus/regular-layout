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
						type: "split-layout",
						orientation: "horizontal",
						sizes: [0.5, 0.5],
						children: [
							{
								type: "tab-layout",
								tabs: ["DDD"],
							},
							{
								type: "tab-layout",
								tabs: ["BBB"],
							},
						],
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
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	});
});

test("cursor near top edge of opposite orientation", () => {
	const result = insert_child(LAYOUTS.NESTED_BASIC, "DDD", [0], "vertical");

	expect(result).toStrictEqual({
		type: "split-layout",
		sizes: [0.5, 0.5],
		orientation: "vertical",
		children: [
			{
				type: "tab-layout",
				tabs: ["DDD"],
			},
			{
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
		type: "split-layout",
		sizes: [0.5, 0.5],
		orientation: "vertical",
		children: [
			{
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
				sizes: [0.6, 0.4],
				orientation: "horizontal",
			},
			{
				type: "tab-layout",
				tabs: ["DDD"],
			},
		],
	});
});

test("arbitrary regression also", () => {
	const PANEL: Layout = {
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
								selected: 0,
							},
							{
								type: "split-layout",
								orientation: "vertical",
								children: [
									{
										type: "tab-layout",
										tabs: ["BBB"],
										selected: 0,
									},
									{
										type: "tab-layout",
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
						type: "tab-layout",
						tabs: ["EEE"],
						selected: 0,
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "tab-layout",
				tabs: ["FFF", "GGG", "HHH"],
				selected: 0,
			},
		],
		sizes: [0.5, 0.5],
	};

	const result = insert_child(PANEL, "QQQ", [1], "vertical");
	expect(result).toStrictEqual({
		sizes: [0.5, 0.5],
		type: "split-layout",
		orientation: "vertical",
		children: [
			{
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
										selected: 0,
									},
									{
										type: "split-layout",
										orientation: "vertical",
										children: [
											{
												type: "tab-layout",
												tabs: ["BBB"],
												selected: 0,
											},
											{
												type: "tab-layout",
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
								type: "tab-layout",
								tabs: ["EEE"],
								selected: 0,
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "tab-layout",
						tabs: ["FFF", "GGG", "HHH"],
						selected: 0,
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "tab-layout",
				tabs: ["QQQ"],
				// selected: 0,
			},
		],
	});
});
