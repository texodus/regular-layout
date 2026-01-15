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

import { create_css_grid_layout } from "../../src/layout/generate_grid.ts";
import type { Layout } from "../../src/layout/types.ts";
import { DEFAULT_PHYSICS } from "../../src/layout/constants.ts";

test("Deeply alternating split with grid-based overlay", () => {
	const test: Layout = {
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
								type: "split-panel",
								orientation: "vertical",
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
								sizes: [0.5, 0.5],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						child: ["DDD"],
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				child: ["EEE"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	};

	expect(
		create_css_grid_layout(test, ["BBB", "AAA"], {
			...DEFAULT_PHYSICS,
			SHOULD_ROUND: true,
		}),
	).toEqual(
		`
:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:15fr 15fr 70fr;grid-template-columns:30fr 30fr 40fr}
:host ::slotted([name="AAA"]){display:flex;grid-column:1;grid-row:1 / 3}
:host ::slotted([name="BBB"]){display:flex;grid-column:1;grid-row:1 / 3}
:host ::slotted([name=BBB]){z-index:1}
:host ::slotted([name="BBB"]){display:flex;grid-column:2;grid-row:1}
:host ::slotted([name="CCC"]){display:flex;grid-column:2;grid-row:2}
:host ::slotted([name="DDD"]){display:flex;grid-column:1 / 3;grid-row:3}
:host ::slotted([name="EEE"]){display:flex;grid-column:3;grid-row:1 / 4}
        `.trim(),
	);
});
