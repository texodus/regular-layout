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

import { flatten } from "../../src/common/flatten.ts";
import type { Layout } from "../../src/common/layout_config.ts";

test("Deeply alternating split partial", () => {
	const test: Layout = {
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "split-panel",
				orientation: "horizontal",
				children: [
					{
						type: "child-panel",
						child: "AAA",
					},
					{
						type: "split-panel",
						orientation: "vertical",
						children: [
							{
								type: "child-panel",
								child: "CCC",
							},
							{
								type: "child-panel",
								child: "DDD",
							},
						],
						sizes: [0.5, 0.5],
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "split-panel",
				orientation: "horizontal",
				children: [
					{
						type: "child-panel",
						child: "FFF",
					},
					{
						type: "child-panel",
						child: "BBB",
					},
					{
						type: "child-panel",
						child: "EEE",
					},
				],
				sizes: [0.3, 0.3, 0.4],
			},
		],
		sizes: [0.5, 0.5],
	};

	expect(flatten(test)).toStrictEqual({
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				child: "AAA",
			},
			{
				type: "split-panel",
				orientation: "vertical",
				children: [
					{
						type: "child-panel",
						child: "CCC",
					},
					{
						type: "child-panel",
						child: "DDD",
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "child-panel",
				child: "FFF",
			},
			{
				type: "child-panel",
				child: "BBB",
			},
			{
				type: "child-panel",
				child: "EEE",
			},
		],
		sizes: [0.25, 0.25, 0.15, 0.15, 0.2],
	});
});
