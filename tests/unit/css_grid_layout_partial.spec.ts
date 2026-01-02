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

import { create_css_grid_layout } from "../../src/common/generate_grid.ts";
import type { Layout } from "../../src/common/layout_config.ts";

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
								child: "AAA",
							},
							{
								type: "split-panel",
								orientation: "vertical",
								children: [
									{
										type: "child-panel",
										child: "BBB",
									},
									{
										type: "child-panel",
										child: "CCC",
									},
								],
								sizes: [0.5, 0.5],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						child: "DDD",
					},
				],
				sizes: [0.3, 0.7],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				child: "EEE",
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	};

	expect(create_css_grid_layout(test, false, ["BBB", "AAA"])).toEqual(
		`
:host { display: grid; gap: 0px; grid-template-rows: 30% 70%; grid-template-columns: 30% 30% 40%; }
:host ::slotted([slot=AAA]) { grid-column: 1; grid-row: 1; }
:host ::slotted([slot=BBB]) { grid-column: 1; grid-row: 1; }
:host ::slotted([slot=BBB]) { z-index: 1; }
:host ::slotted([slot=CCC]) { grid-column: 2; grid-row: 1; }
:host ::slotted([slot=DDD]) { grid-column: 1 / 3; grid-row: 2; }
:host ::slotted([slot=EEE]) { grid-column: 3; grid-row: 1 / 3; }
        `.trim(),
	);
});
