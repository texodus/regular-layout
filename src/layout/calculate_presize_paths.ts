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

import type {
	Layout,
	LayoutPath,
	Orientation,
	ViewWindow,
} from "../core/types.ts";

/**
 * Walks a layout tree and returns a {@link LayoutPath} for every visible
 * panel, keyed by panel name. Each path's `column`/`row` are set to the
 * center of the panel's view window, with offsets of 0.5.
 *
 * @param layout - The layout tree to walk.
 * @returns A record mapping panel names to their layout paths.
 */
export function calculate_presize_paths(
	layout: Layout,
): Record<string, LayoutPath> {
	const result: Record<string, LayoutPath> = {};
	walk_layout(layout, result, [], null, {
		row_start: 0,
		row_end: 1,
		col_start: 0,
		col_end: 1,
	});

	return result;
}

function walk_layout(
	layout: Layout,
	result: Record<string, LayoutPath>,
	path: number[],
	parentOrientation: Orientation | null,
	viewWindow: ViewWindow,
): void {
	if (layout.type === "tab-layout") {
		const selected = layout.selected ?? 0;
		const slot = layout.tabs[selected];
		const col = (viewWindow.col_start + viewWindow.col_end) / 2;
		const row = (viewWindow.row_start + viewWindow.row_end) / 2;
		result[slot] = {
			type: "layout-path",
			layout,
			slot,
			path,
			view_window: viewWindow,
			is_edge: false,
			column: col,
			row: row,
			column_offset: 0.5,
			row_offset: 0.5,
			orientation: parentOrientation || "horizontal",
		};

		return;
	}

	const isVertical = layout.orientation === "vertical";
	const startKey = isVertical ? "row_start" : "col_start";
	const endKey = isVertical ? "row_end" : "col_end";
	let currentPos = viewWindow[startKey];
	const totalSize = viewWindow[endKey] - viewWindow[startKey];
	for (let i = 0; i < layout.children.length; i++) {
		const nextPos = currentPos + totalSize * layout.sizes[i];
		const childWindow: ViewWindow = {
			...viewWindow,
			[startKey]: currentPos,
			[endKey]: nextPos,
		};

		walk_layout(
			layout.children[i],
			result,
			[...path, i],
			layout.orientation,
			childWindow,
		);

		currentPos = nextPos;
	}
}
