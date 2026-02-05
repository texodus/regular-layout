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

import type { LayoutPath, LayoutDivider, Layout, ViewWindow } from "./types.ts";

const VIEW_WINDOW = {
	row_start: 0,
	row_end: 1,
	col_start: 0,
	col_end: 1,
};

/**
 * Determines which panel or divider is located at a given position in the
 * layout.
 *
 * @param column - Horizontal position as a fraction (0-1) of the container width
 * @param row - Vertical position as a fraction (0-1) of the container height
 * @param layout - The layout tree to search
 * @param check_dividers - Whether `LayoutDivider` intersection should be
 * checked, which you may not want for e.g. `drop` actions.
 * @returns The panel path if over a panel, a divider if over a resizable
 * boundary, or null if outside all panels
 */
export function calculate_intersection(
	column: number,
	row: number,
	layout: Layout,
	check_dividers?: null,
): LayoutPath | null;

export function calculate_intersection(
	column: number,
	row: number,
	layout: Layout,
	check_dividers?: { rect: DOMRect; size: number },
): LayoutPath | null | LayoutDivider;

export function calculate_intersection(
	column: number,
	row: number,
	layout: Layout,
	check_dividers?: { rect: DOMRect; size: number } | null,
): LayoutPath | null | LayoutDivider;

export function calculate_intersection(
	column: number,
	row: number,
	layout: Layout,
	check_dividers: { rect: DOMRect; size: number } | null = null,
): LayoutPath | null | LayoutDivider {
	return calculate_intersection_recursive(column, row, layout, check_dividers);
}

function calculate_intersection_recursive(
	column: number,
	row: number,
	panel: Layout,
	check_dividers: { rect: DOMRect; size: number } | null,
	parent_orientation: "horizontal" | "vertical" | null = null,
	view_window: ViewWindow = structuredClone(VIEW_WINDOW),
	path: number[] = [],
): LayoutPath | null | LayoutDivider {
	if (column < 0 || row < 0 || column > 1 || row > 1) {
		return null;
	}

	// Base case: if this is a child panel, return its name
	if (panel.type === "child-panel") {
		const selected = panel.selected ?? 0;
		const col_width = view_window.col_end - view_window.col_start;
		const row_height = view_window.row_end - view_window.row_start;
		return {
			type: "layout-path",
			layout: panel,
			slot: panel.tabs[selected],
			path,
			view_window,
			is_edge: false,
			column,
			row,
			column_offset: (column - view_window.col_start) / col_width,
			row_offset: (row - view_window.row_start) / row_height,
			orientation: parent_orientation || "horizontal",
		};
	}

	// For split panels, determine which child was hit
	const is_vertical = panel.orientation === "vertical";
	const position = is_vertical ? row : column;
	const start_key = is_vertical ? "row_start" : "col_start";
	const end_key = is_vertical ? "row_end" : "col_end";
	const rect_dim = is_vertical
		? check_dividers?.rect?.height
		: check_dividers?.rect?.width;

	let current_pos = view_window[start_key];
	const total_size = view_window[end_key] - view_window[start_key];
	for (let i = 0; i < panel.children.length; i++) {
		const next_pos = current_pos + total_size * panel.sizes[i];

		// Check if position is on a divider
		if (check_dividers && rect_dim) {
			const divider_threshold = check_dividers.size / rect_dim;
			if (Math.abs(position - next_pos) < divider_threshold) {
				return {
					path: [...path, i],
					type: panel.orientation,
					view_window: {
						...view_window,
						[start_key]: current_pos,
						[end_key]: next_pos,
					},
				};
			}
		}

		// Check if position falls within this child's bounds
		if (position >= current_pos && position < next_pos) {
			return calculate_intersection_recursive(
				column,
				row,
				panel.children[i],
				check_dividers,
				panel.orientation,
				{
					...view_window,
					[start_key]: current_pos,
					[end_key]: next_pos,
				},
				[...path, i],
			);
		}

		current_pos = next_pos;
	}

	// If we get here, the hit was outside all children (possibly in a gap or
	// boundary).
	return null;
}
