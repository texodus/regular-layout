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

import type { Layout } from "../../src/layout/types.ts";

/**
 * Common layout fixtures for testing
 */
export const LAYOUTS = {
	/** Single panel with AAA */
	SINGLE_AAA: {
		type: "child-panel",
		tabs: ["AAA"],
	} as Layout,

	/** Single panel with BBB */
	SINGLE_BBB: {
		type: "child-panel",
		tabs: ["BBB"],
	} as Layout,

	/** Single panel with multiple tabs */
	SINGLE_TABS: {
		type: "child-panel",
		tabs: ["AAA", "BBB", "CCC"],
		selected: 0,
	} as Layout,

	/** Two panels horizontal split (30/70) */
	TWO_HORIZONTAL: {
		type: "split-panel",
		orientation: "horizontal",
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
	} as Layout,

	/** Two panels vertical split (50/50) */
	TWO_VERTICAL: {
		type: "split-panel",
		orientation: "vertical",
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
		sizes: [0.5, 0.5],
	} as Layout,

	/** Three panels horizontal split */
	THREE_HORIZONTAL: {
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA"],
			},
			{
				type: "child-panel",
				tabs: ["BBB"],
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.3, 0.3, 0.4],
	} as Layout,

	/** Nested layout: horizontal split with left side vertical split (60/40 outer, 30/70 inner) */
	NESTED_BASIC: {
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
	} as Layout,

	/** Nested layout: vertical split with nested horizontal */
	NESTED_VERTICAL_OUTER: {
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
					},
					{
						type: "child-panel",
						tabs: ["BBB"],
					},
				],
				sizes: [0.3, 0.7],
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.6, 0.4],
	} as Layout,

	/** Deeply nested layout with alternating orientations */
	DEEPLY_NESTED: {
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "split-panel",
				orientation: "vertical",
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
			},
			{
				type: "split-panel",
				orientation: "vertical",
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
				sizes: [0.5, 0.5],
			},
		],
		sizes: [0.6, 0.4],
	} as Layout,

	/** Single panel with DDD */
	SINGLE_DDD: {
		type: "child-panel",
		tabs: ["DDD"],
	} as Layout,

	/** Two panels horizontal split (50/50) */
	TWO_HORIZONTAL_EQUAL: {
		type: "split-panel",
		orientation: "horizontal",
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
		sizes: [0.5, 0.5],
	} as Layout,

	/** Three panels horizontal split with custom sizes */
	THREE_HORIZONTAL_CUSTOM: {
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA"],
			},
			{
				type: "child-panel",
				tabs: ["BBB"],
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.2, 0.3, 0.5],
	} as Layout,

	/** Three panels vertical split (CCC, DDD, EEE) */
	THREE_VERTICAL_CDE: {
		type: "split-panel",
		orientation: "vertical",
		children: [
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
			{
				type: "child-panel",
				tabs: ["EEE"],
			},
		],
		sizes: [0.3, 0.3, 0.4],
	} as Layout,

	/** Three panels horizontal with precise custom sizes */
	THREE_HORIZONTAL_PRECISE: {
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA"],
			},
			{
				type: "child-panel",
				tabs: ["BBB"],
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.123456789, 0.456789123, 0.419754088],
	} as Layout,

	/** Three panels horizontal with different sizes (30/40/30) */
	THREE_HORIZONTAL_304030: {
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA"],
			},
			{
				type: "child-panel",
				tabs: ["BBB"],
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.3, 0.4, 0.3],
	} as Layout,

	/** Deeply nested layout: vertical outer with horizontal inner */
	DEEPLY_NESTED_ALT: {
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
								type: "child-panel",
								tabs: ["AAA"],
							},
							{
								type: "child-panel",
								tabs: ["BBB"],
							},
						],
						sizes: [0.4, 0.6],
					},
					{
						type: "child-panel",
						tabs: ["CCC"],
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
		],
		sizes: [0.7, 0.3],
	} as Layout,

	/** Three panels with tabs in middle */
	THREE_HORIZONTAL_WITH_TABS: {
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA"],
			},
			{
				type: "child-panel",
				tabs: ["BBB", "DDD", "EEE"],
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.2, 0.3, 0.5],
	} as Layout,

	/** Two panels horizontal with tabs (AAA, BBB) and CCC */
	TWO_HORIZONTAL_WITH_TABS: {
		type: "split-panel",
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA", "BBB"],
				selected: 0,
			},
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.5, 0.5],
	} as Layout,

	/** Single panel with tabs (AAA, BBB, CCC) with selected index */
	SINGLE_TABS_WITH_SELECTED: {
		type: "child-panel",
		tabs: ["AAA", "BBB", "CCC"],
		selected: 0,
	} as Layout,

	/** Single panel with one child (ONLY) */
	SINGLE_ONLY: {
		type: "child-panel",
		tabs: ["ONLY"],
	} as Layout,

	/** Single panel with one child (SECOND) */
	SINGLE_SECOND: {
		type: "child-panel",
		tabs: ["SECOND"],
	} as Layout,

	/** Single panel horizontal split with one child (AAA) */
	SINGLE_SPLIT_HORIZONTAL: {
		type: "split-panel",
		sizes: [1],
		orientation: "horizontal",
		children: [
			{
				type: "child-panel",
				tabs: ["AAA"],
			},
		],
	} as Layout,

	/** Single panel vertical split with one child (AAA) */
	SINGLE_SPLIT_VERTICAL: {
		type: "split-panel",
		orientation: "vertical",
		sizes: [1],
		children: [
			{
				type: "child-panel",
				tabs: ["AAA"],
			},
		],
	} as Layout,

	/** Complex nested layout with 4 children */
	COMPLEX_FOUR_CHILDREN: {
		type: "split-panel",
		orientation: "horizontal",
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
						type: "split-panel",
						orientation: "vertical",
						children: [
							{
								type: "child-panel",
								tabs: ["EEE"],
							},
							{
								type: "child-panel",
								tabs: ["BBB"],
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
						sizes: [0.25, 0.25, 0.25, 0.25],
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "child-panel",
				tabs: ["FFF"],
			},
		],
		sizes: [0.5, 0.5],
	} as Layout,

	/** Nested aligned split panels */
	NESTED_ALIGNED: {
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
							},
							{
								type: "child-panel",
								tabs: ["BBB"],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						tabs: ["DDD"],
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "child-panel",
				tabs: ["FFF"],
			},
		],
		sizes: [0.5, 0.5],
	} as Layout,

	/** Nested aligned reversed orientation */
	NESTED_ALIGNED_REVERSED: {
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
							},
							{
								type: "split-panel",
								orientation: "vertical",
								children: [
									{
										type: "child-panel",
										tabs: ["BBB"],
									},
									{
										type: "child-panel",
										tabs: ["CCC"],
									},
								],
								sizes: [0.5, 0.5],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						tabs: ["DDD"],
					},
				],
				sizes: [0.5, 0.5],
			},
			{
				type: "child-panel",
				tabs: ["FFF"],
			},
		],
		sizes: [0.5, 0.5],
	} as Layout,

	/** Nested aligned reversed with asymmetric sizes */
	NESTED_ALIGNED_ASYMMETRIC: {
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
							},
							{
								type: "split-panel",
								orientation: "vertical",
								children: [
									{
										type: "child-panel",
										tabs: ["BBB"],
									},
									{
										type: "child-panel",
										tabs: ["CCC"],
									},
								],
								sizes: [0.5, 0.5],
							},
						],
						sizes: [0.5, 0.5],
					},
					{
						type: "child-panel",
						tabs: ["DDD"],
					},
				],
				sizes: [0.75, 0.25],
			},
			{
				type: "child-panel",
				tabs: ["FFF"],
			},
		],
		sizes: [0.5, 0.5],
	} as Layout,

	/** Three children with DDD (vertical) */
	THREE_VERTICAL_WITH_DDD: {
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
			{
				type: "child-panel",
				tabs: ["DDD"],
			},
		],
		sizes: [0.3, 0.6, 0.1],
		orientation: "vertical",
	} as Layout,

	/** Nested horizontal with vertical inner (AAA, BBB, DDD) and CCC */
	NESTED_HORIZONTAL_WITH_VERTICAL_DDD: {
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
	} as Layout,

	/** Three children horizontal (AAA, BBB, CCC) */
	THREE_HORIZONTAL_ABC: {
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
			{
				type: "child-panel",
				tabs: ["CCC"],
			},
		],
		sizes: [0.2, 0.3, 0.5],
		orientation: "horizontal",
	} as Layout,

	/** Complex nested layout (horizontal outer, vertical inner with A and B, and C) */
	COMPLEX_NESTED_ABC: {
		type: "split-panel",
		orientation: "horizontal",
		sizes: [0.5, 0.5],
		children: [
			{
				type: "split-panel",
				orientation: "vertical",
				sizes: [0.5, 0.5],
				children: [
					{
						type: "child-panel",
						tabs: ["A"],
					},
					{
						type: "child-panel",
						tabs: ["B"],
					},
				],
			},
			{
				type: "child-panel",
				tabs: ["C"],
			},
		],
	} as Layout,
};
