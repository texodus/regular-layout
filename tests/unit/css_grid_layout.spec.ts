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
import { TEST_PANEL } from "../fixtures.ts";

import { create_css_grid_layout } from "../../src/common/generate_grid.ts";
import type { Layout } from "../../src/common/layout_config.ts";

const RESULT = `
:host { display: grid; gap: 0px; grid-template-rows: 30% 70%; grid-template-columns: 60% 40%; }
:host ::slotted([slot=AAA]) { grid-column: 1; grid-row: 1; }
:host ::slotted([slot=BBB]) { grid-column: 1; grid-row: 2; }
:host ::slotted([slot=CCC]) { grid-column: 2; grid-row: 1 / 3; }
`.trim();

test("simple test", async () => {
	const css = create_css_grid_layout(TEST_PANEL, true);
	expect(css).toBe(RESULT);
});

test("single child panel", () => {
	const singleChild: Layout = {
		type: "child-panel",
		child: ["ONLY"],
	};

	expect(create_css_grid_layout(singleChild, true)).toEqual(
		`:host { display: grid; gap: 0px; grid-template-rows: 100%; grid-template-columns: 100%; }\n:host ::slotted([slot=ONLY]) { grid-column: 1; grid-row: 1; }`,
	);
});

test("regressions", () => {
	const test: Layout = {
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
				sizes: [0.8, 0.2],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				child: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	};

	expect(create_css_grid_layout(test, true)).toEqual(
		`
:host { display: grid; gap: 0px; grid-template-rows: 80% 20%; grid-template-columns: 60% 40%; }
:host ::slotted([slot=AAA]) { grid-column: 1; grid-row: 1; }
:host ::slotted([slot=BBB]) { grid-column: 1; grid-row: 2; }
:host ::slotted([slot=CCC]) { grid-column: 2; grid-row: 1 / 3; }
	`.trim(),
	);
});

test("deeply nested css grid", () => {
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
								type: "child-panel",
								child: ["EEE"],
							},
						],
						sizes: [0.5, 0.5],
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
				sizes: [0.3, 0.6, 0.1],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				child: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	};

	expect(create_css_grid_layout(test, true)).toEqual(
		`
:host { display: grid; gap: 0px; grid-template-rows: 30% 60% 10%; grid-template-columns: 30% 30% 40%; }
:host ::slotted([slot=AAA]) { grid-column: 1; grid-row: 1; }
:host ::slotted([slot=EEE]) { grid-column: 2; grid-row: 1; }
:host ::slotted([slot=BBB]) { grid-column: 1 / 3; grid-row: 2; }
:host ::slotted([slot=DDD]) { grid-column: 1 / 3; grid-row: 3; }
:host ::slotted([slot=CCC]) { grid-column: 3; grid-row: 1 / 4; }
	`.trim(),
	);
});

test("Deeply nested CSS grid part 2", () => {
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
								type: "child-panel",
								child: ["EEE"],
							},
						],
						sizes: [0.5, 0.5],
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
				sizes: [0.3, 0.6, 0.1],
				orientation: "vertical",
			},
			{
				type: "split-panel",
				orientation: "horizontal",
				children: [
					{
						type: "child-panel",
						child: ["CCC"],
					},
					{
						type: "child-panel",
						child: ["FFF"],
					},
				],
				sizes: [0.5, 0.5],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	};

	expect(create_css_grid_layout(test, true)).toEqual(
		`
:host { display: grid; gap: 0px; grid-template-rows: 30% 60% 10%; grid-template-columns: 30% 30% 20% 20%; }
:host ::slotted([slot=AAA]) { grid-column: 1; grid-row: 1; }
:host ::slotted([slot=EEE]) { grid-column: 2; grid-row: 1; }
:host ::slotted([slot=BBB]) { grid-column: 1 / 3; grid-row: 2; }
:host ::slotted([slot=DDD]) { grid-column: 1 / 3; grid-row: 3; }
:host ::slotted([slot=CCC]) { grid-column: 3; grid-row: 1 / 4; }
:host ::slotted([slot=FFF]) { grid-column: 4; grid-row: 1 / 4; }
	`.trim(),
	);
});

test("parallel", () => {
	const test: Layout = {
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
	};

	expect(create_css_grid_layout(test, true)).toEqual(
		`
:host { display: grid; gap: 0px; grid-template-rows: 30% 70%; grid-template-columns: 33% 33% 33%; }
:host ::slotted([slot=AAA]) { grid-column: 1; grid-row: 1; }
:host ::slotted([slot=BBB]) { grid-column: 1; grid-row: 2; }
:host ::slotted([slot=DDD]) { grid-column: 2; grid-row: 1 / 3; }
:host ::slotted([slot=CCC]) { grid-column: 3; grid-row: 1 / 3; }
	`.trim(),
	);
});

test("Parallel split-panels with different sizes", () => {
	const test: Layout = {
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
				type: "split-panel",
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
				sizes: [0.7, 0.3],
				orientation: "vertical",
			},
		],
		sizes: [0.5, 0.5],
		orientation: "horizontal",
	};

	expect(create_css_grid_layout(test, true)).toEqual(
		`
:host { display: grid; gap: 0px; grid-template-rows: 30% 40% 30%; grid-template-columns: 50% 50%; }
:host ::slotted([slot=AAA]) { grid-column: 1; grid-row: 1; }
:host ::slotted([slot=BBB]) { grid-column: 1; grid-row: 2 / 4; }
:host ::slotted([slot=CCC]) { grid-column: 2; grid-row: 1 / 3; }
:host ::slotted([slot=DDD]) { grid-column: 2; grid-row: 3; }
	`.trim(),
	);
});

test("Deeply alternating split", () => {
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
								child: ["VfssXzLK"],
							},
							{
								type: "split-panel",
								orientation: "vertical",
								children: [
									{
										type: "child-panel",
										child: ["qsAwxKvs"],
									},
									{
										type: "child-panel",
										child: ["AAA"],
									},
								],
								sizes: [0.5, 0.5],
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
	};

	expect(create_css_grid_layout(test, true)).toEqual(
		`
:host { display: grid; gap: 0px; grid-template-rows: 15% 15% 70%; grid-template-columns: 30% 30% 40%; }
:host ::slotted([slot=VfssXzLK]) { grid-column: 1; grid-row: 1 / 3; }
:host ::slotted([slot=qsAwxKvs]) { grid-column: 2; grid-row: 1; }
:host ::slotted([slot=AAA]) { grid-column: 2; grid-row: 2; }
:host ::slotted([slot=BBB]) { grid-column: 1 / 3; grid-row: 3; }
:host ::slotted([slot=CCC]) { grid-column: 3; grid-row: 1 / 4; }
	`.trim(),
	);
});
