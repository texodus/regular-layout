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

import { create_css_grid_layout } from "../../src/layout/generate_grid.ts";
import type { Layout } from "../../src/layout/types.ts";
import { DEFAULT_PHYSICS } from "../../src/layout/constants.ts";

const RESULT = `
:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:30fr 70fr;grid-template-columns:60fr 40fr}
:host ::slotted([name="AAA"]){display:flex;grid-column:1;grid-row:1}
:host ::slotted([name="BBB"]){display:flex;grid-column:1;grid-row:2}
:host ::slotted([name="CCC"]){display:flex;grid-column:2;grid-row:1 / 3}
`.trim();

test("simple test", async () => {
	const css = create_css_grid_layout(LAYOUTS.NESTED_BASIC, undefined, {
		...DEFAULT_PHYSICS,
		SHOULD_ROUND: true,
	});
	expect(css).toBe(RESULT);
});

test("single child panel", () => {
	const singleChild: Layout = {
		type: "child-panel",
		tabs: ["ONLY"],
	};

	expect(
		create_css_grid_layout(singleChild, undefined, {
			...DEFAULT_PHYSICS,
			SHOULD_ROUND: true,
		}),
	).toEqual(
		`:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:100%;grid-template-columns:100%}\n:host ::slotted([name="ONLY"]){display:flex;grid-column:1;grid-row:1}`,
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
						tabs: ["AAA"],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.8, 0.2],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	};

	expect(
		create_css_grid_layout(test, undefined, {
			...DEFAULT_PHYSICS,
			SHOULD_ROUND: true,
		}),
	).toEqual(
		`
:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:80fr 20fr;grid-template-columns:60fr 40fr}
:host ::slotted([name="AAA"]){display:flex;grid-column:1;grid-row:1}
:host ::slotted([name="BBB"]){display:flex;grid-column:1;grid-row:2}
:host ::slotted([name="CCC"]){display:flex;grid-column:2;grid-row:1 / 3}
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
								tabs: ["AAA"],
							},
							{
								type: "child-panel",
								tabs: ["EEE"],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
					{
						type: "child-panel",
						tabs: ["DDD"],
					},
				],
				sizes: [0.3, 0.6, 0.1],
				orientation: "vertical",
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	};

	expect(
		create_css_grid_layout(test, undefined, {
			...DEFAULT_PHYSICS,
			SHOULD_ROUND: true,
		}),
	).toEqual(
		`
:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:30fr 60fr 10fr;grid-template-columns:30fr 30fr 40fr}
:host ::slotted([name="AAA"]){display:flex;grid-column:1;grid-row:1}
:host ::slotted([name="EEE"]){display:flex;grid-column:2;grid-row:1}
:host ::slotted([name="BBB"]){display:flex;grid-column:1 / 3;grid-row:2}
:host ::slotted([name="DDD"]){display:flex;grid-column:1 / 3;grid-row:3}
:host ::slotted([name="CCC"]){display:flex;grid-column:3;grid-row:1 / 4}
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
								tabs: ["AAA"],
							},
							{
								type: "child-panel",
								tabs: ["EEE"],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
					{
						type: "child-panel",
						tabs: ["DDD"],
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
						tabs: ["CCC"],
					},
					{
						type: "child-panel",
						tabs: ["FFF"],
					},
				],
				sizes: [0.5, 0.5],
			},
		],
		sizes: [0.6, 0.4],
		orientation: "horizontal",
	};

	expect(
		create_css_grid_layout(test, undefined, {
			...DEFAULT_PHYSICS,
			SHOULD_ROUND: true,
		}),
	).toEqual(
		`
:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:30fr 60fr 10fr;grid-template-columns:30fr 30fr 20fr 20fr}
:host ::slotted([name="AAA"]){display:flex;grid-column:1;grid-row:1}
:host ::slotted([name="EEE"]){display:flex;grid-column:2;grid-row:1}
:host ::slotted([name="BBB"]){display:flex;grid-column:1 / 3;grid-row:2}
:host ::slotted([name="DDD"]){display:flex;grid-column:1 / 3;grid-row:3}
:host ::slotted([name="CCC"]){display:flex;grid-column:3;grid-row:1 / 4}
:host ::slotted([name="FFF"]){display:flex;grid-column:4;grid-row:1 / 4}
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
				tabs: ["DDD"],
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
		orientation: "horizontal",
	};

	expect(
		create_css_grid_layout(test, undefined, {
			...DEFAULT_PHYSICS,
			SHOULD_ROUND: true,
		}),
	).toEqual(
		`
:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:30fr 70fr;grid-template-columns:33fr 33fr 33fr}
:host ::slotted([name="AAA"]){display:flex;grid-column:1;grid-row:1}
:host ::slotted([name="BBB"]){display:flex;grid-column:1;grid-row:2}
:host ::slotted([name="DDD"]){display:flex;grid-column:2;grid-row:1 / 3}
:host ::slotted([name="CCC"]){display:flex;grid-column:3;grid-row:1 / 3}
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
				type: "split-panel",
				children: [
					{
						type: "child-panel",
						tabs: ["CCC"],
					},
					{
						type: "child-panel",
						tabs: ["DDD"],
					},
				],
				sizes: [0.7, 0.3],
				orientation: "vertical",
			},
		],
		sizes: [0.5, 0.5],
		orientation: "horizontal",
	};

	expect(
		create_css_grid_layout(test, undefined, {
			...DEFAULT_PHYSICS,
			SHOULD_ROUND: true,
		}),
	).toEqual(
		`
:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:30fr 40fr 30fr;grid-template-columns:50fr 50fr}
:host ::slotted([name="AAA"]){display:flex;grid-column:1;grid-row:1}
:host ::slotted([name="BBB"]){display:flex;grid-column:1;grid-row:2 / 4}
:host ::slotted([name="CCC"]){display:flex;grid-column:2;grid-row:1 / 3}
:host ::slotted([name="DDD"]){display:flex;grid-column:2;grid-row:3}
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
								tabs: ["VfssXzLK"],
							},
							{
								type: "split-panel",
								orientation: "vertical",
								children: [
									{
										type: "child-panel",
										tabs: ["qsAwxKvs"],
									},
									{
										type: "child-panel",
										tabs: ["AAA"],
									},
								],
								sizes: [0.5, 0.5],
							},
						],
						sizes: [0.5, 0.5],
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
	};

	expect(
		create_css_grid_layout(test, undefined, {
			...DEFAULT_PHYSICS,
			SHOULD_ROUND: true,
		}),
	).toEqual(
		`
:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:15fr 15fr 70fr;grid-template-columns:30fr 30fr 40fr}
:host ::slotted([name="VfssXzLK"]){display:flex;grid-column:1;grid-row:1 / 3}
:host ::slotted([name="qsAwxKvs"]){display:flex;grid-column:2;grid-row:1}
:host ::slotted([name="AAA"]){display:flex;grid-column:2;grid-row:2}
:host ::slotted([name="BBB"]){display:flex;grid-column:1 / 3;grid-row:3}
:host ::slotted([name="CCC"]){display:flex;grid-column:3;grid-row:1 / 4}
	`.trim(),
	);
});
