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
import { flatten } from "../../src/layout/flatten.ts";
import type { Layout } from "../../src/layout/types.ts";

test("Deeply alternating split partial", () => {
	const test: Layout = {
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
								tabs: ["CCC"],
							},
							{
								type: "tab-layout",
								tabs: ["DDD"],
							},
						],
						sizes: [0.5, 0.5],
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "split-layout",
				orientation: "horizontal",
				children: [
					{
						type: "tab-layout",
						tabs: ["FFF"],
					},
					{
						type: "tab-layout",
						tabs: ["BBB"],
					},
					{
						type: "tab-layout",
						tabs: ["EEE"],
					},
				],
				sizes: [0.3, 0.3, 0.4],
			},
		],
		sizes: [0.5, 0.5],
	};

	expect(flatten(test)).toStrictEqual({
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
						tabs: ["CCC"],
						selected: 0,
					},
					{
						type: "tab-layout",
						tabs: ["DDD"],
						selected: 0,
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "tab-layout",
				tabs: ["FFF"],
				selected: 0,
			},
			{
				type: "tab-layout",
				tabs: ["BBB"],
				selected: 0,
			},
			{
				type: "tab-layout",
				tabs: ["EEE"],
				selected: 0,
			},
		],
		sizes: [0.25, 0.25, 0.15, 0.15, 0.2],
	});
});

test("Nested split panels with a single child", () => {
	const test: Layout = {
		type: "split-layout",
		orientation: "horizontal",
		children: [
			{
				type: "split-layout",
				orientation: "vertical",
				children: [
					{
						type: "tab-layout",
						tabs: ["AAA", "BBB", "CCC"],
					},
					{
						type: "tab-layout",
						tabs: ["DDD"],
					},
				],
				sizes: [0.5, 0.5],
			},
		],
		sizes: [1],
	};

	expect(flatten(test)).toStrictEqual({
		type: "split-layout",
		orientation: "vertical",
		children: [
			{
				type: "tab-layout",
				tabs: ["AAA", "BBB", "CCC"],
				selected: 0,
			},
			{
				type: "tab-layout",
				tabs: ["DDD"],
				selected: 0,
			},
		],
		sizes: [0.5, 0.5],
	});
});
