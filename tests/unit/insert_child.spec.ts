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
import { insert_child } from "../../src/common/insert_child.ts";
import type { Layout } from "../../src/common/layout_config.ts";

test.describe("insert_child", async () => {
	test("insert into root split panel", () => {
		const result = insert_child(TEST_PANEL, "DDD", []);
		expect(result).toStrictEqual({
			type: "split-panel",
			children: [
				{
					type: "split-panel",
					children: [
						{
							type: "child-panel",
							child: "AAA",
						},
						{
							type: "child-panel",
							child: "BBB",
						},
					],
					sizes: [0.3, 0.7],
					orientation: "vertical",
				},
				{
					type: "child-panel",
					child: "CCC",
				},
				{
					type: "child-panel",
					child: "DDD",
				},
			],
			sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
			orientation: "horizontal",
		});
	});

	test("append top level split-panel", () => {
		const result = insert_child(TEST_PANEL, "DDD", [2]);
		expect(result).toStrictEqual({
			type: "split-panel",
			children: [
				{
					type: "split-panel",
					children: [
						{
							type: "child-panel",
							child: "AAA",
						},
						{
							type: "child-panel",
							child: "BBB",
						},
					],
					sizes: [0.3, 0.7],
					orientation: "vertical",
				},
				{
					type: "child-panel",
					child: "CCC",
				},
				{
					type: "child-panel",
					child: "DDD",
				},
			],
			sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
			orientation: "horizontal",
		});
	});

	test("insert into top level split-panel", () => {
		const result = insert_child(TEST_PANEL, "DDD", [1]);
		expect(result).toStrictEqual({
			type: "split-panel",
			children: [
				{
					type: "split-panel",
					children: [
						{
							type: "child-panel",
							child: "AAA",
						},
						{
							type: "child-panel",
							child: "BBB",
						},
					],
					sizes: [0.3, 0.7],
					orientation: "vertical",
				},
				{
					type: "child-panel",
					child: "DDD",
				},
				{
					type: "child-panel",
					child: "CCC",
				},
			],
			sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
			orientation: "horizontal",
		});
	});

	test("insert at path splitting a child panel", () => {
		const result = insert_child(TEST_PANEL, "DDD", [1, 1]);
		expect(result).toStrictEqual({
			type: "split-panel",
			children: [
				{
					type: "split-panel",
					orientation: "vertical",
					children: [
						{
							type: "child-panel",
							child: "AAA",
						},
						{
							type: "child-panel",
							child: "BBB",
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
			sizes: [0.6, 0.4],
			orientation: "horizontal",
		});
	});

	test("insert into nested split panel", () => {
		const result = insert_child(TEST_PANEL, "DDD", [0, 2]);
		expect(result).toStrictEqual({
			type: "split-panel",
			children: [
				{
					type: "split-panel",
					children: [
						{
							type: "child-panel",
							child: "AAA",
						},
						{
							type: "child-panel",
							child: "BBB",
						},
						{
							type: "child-panel",
							child: "DDD",
						},
					],
					sizes: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
					orientation: "vertical",
				},
				{
					type: "child-panel",
					child: "CCC",
				},
			],
			sizes: [0.6, 0.4],
			orientation: "horizontal",
		});
	});

	test("insert into single child panel", () => {
		const singleChild: Layout = {
			type: "child-panel",
			child: "ONLY",
		};

		const result = insert_child(singleChild, "SECOND", []);
		expect(result).toStrictEqual({
			type: "split-panel",
			orientation: "horizontal",
			children: [
				{
					type: "child-panel",
					child: "ONLY",
				},
				{
					type: "child-panel",
					child: "SECOND",
				},
			],
			sizes: [0.5, 0.5],
		});
	});

	test("split a nested child panel", () => {
		const result = insert_child(TEST_PANEL, "DDD", [0, 0, 1]);
		expect(result).toStrictEqual({
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
									type: "child-panel",
									child: "DDD",
								},
							],
							sizes: [0.5, 0.5],
						},
						{
							type: "child-panel",
							child: "BBB",
						},
					],
					sizes: [0.3, 0.7],
					orientation: "vertical",
				},
				{
					type: "child-panel",
					child: "CCC",
				},
			],
			sizes: [0.6, 0.4],
			orientation: "horizontal",
		});
	});
});
