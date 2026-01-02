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
	LayoutPath,
	LayoutDivider,
	Layout,
	ViewWindow,
} from "./layout_config.ts";

/**
 * Determines which panel or divider is located at a given position in the
 * layout.
 *
 * @param row - Vertical position as a fraction (0-1) of the container
 * height
 * @param column - Horizontal position as a fraction (0-1) of the
 * container width
 * @param layout - The layout tree to search
 * @param check_dividers - Whether `LayoutDivider` intersection should be
 * checked, which oyu may not want for e.g. `drop` actions.
 * @returns The panel path if over a panel, a divider if over a resizable
 * boundary, or null if outside all panels
 */
export function calculate_intersection(
	column: number,
	row: number,
	layout: Layout,
	check_dividers: false,
): LayoutPath;

export function calculate_intersection(
	column: number,
	row: number,
	layout: Layout,
	check_dividers: true,
): LayoutPath | null | LayoutDivider;

export function calculate_intersection(
	column: number,
	row: number,
	layout: Layout,
	check_dividers?: boolean,
): LayoutPath | null | LayoutDivider;

export function calculate_intersection(
	column: number,
	row: number,
	layout: Layout,
	check_dividers: boolean = true,
): LayoutPath | null | LayoutDivider {
	return calculate_intersection_recursive(column, row, layout, check_dividers);
}

const VIEW_WINDOW = {
	row_start: 0,
	row_end: 1,
	col_start: 0,
	col_end: 1,
};

function calculate_intersection_recursive(
	column: number,
	row: number,
	panel: Layout,
	check_dividers: boolean,
	parent_orientation: "horizontal" | "vertical" = "horizontal",
	view_window: ViewWindow = structuredClone(VIEW_WINDOW),
	path: number[] = [],
): LayoutPath | null | LayoutDivider {
	// Base case: if this is a child panel, return its name
	if (panel.type === "child-panel") {
		return {
			type: "layout-path",
			box: undefined,
			slot: panel.child,
			path: path,
			view_window: view_window,
			column_offset:
				(column - view_window.col_start) /
				(view_window.col_end - view_window.col_start),
			row_offset:
				(row - view_window.row_start) /
				(view_window.row_end - view_window.row_start),
			orientation: parent_orientation,
		};
	}

	// For split panels, determine which child was hit
	if (panel.orientation === "vertical") {
		// Vertical orientation = rows
		let current_row = view_window.row_start;
		for (let i = 0; i < panel.children.length; i++) {
			const total_size = view_window.row_end - view_window.row_start;
			const next_row = total_size * panel.sizes[i] + current_row;
			if (check_dividers && Math.abs(row - next_row) < 0.01) {
				return {
					path: [...path, i],
					type: "vertical",
					view_window: {
						...view_window,
						row_start: current_row,
						row_end: next_row,
					},
				};
			}

			if (row >= current_row && row < next_row) {
				return calculate_intersection_recursive(
					column,
					row,
					panel.children[i],
					check_dividers,
					"vertical",
					{
						...view_window,
						row_start: current_row,
						row_end: next_row,
					},
					[...path, i],
				);
			}

			current_row = next_row;
		}
	} else {
		// Horizontal orientation = columns
		let current_col = view_window.col_start;
		for (let i = 0; i < panel.children.length; i++) {
			const total_size = view_window.col_end - view_window.col_start;
			const next_col = current_col + total_size * panel.sizes[i];
			if (check_dividers && Math.abs(column - next_col) < 0.01) {
				return {
					path: [...path, i],
					type: "horizontal",
					view_window: {
						...view_window,
						col_start: current_col,
						col_end: next_col,
					},
				};
			}

			// Check if the column falls within this child's bounds.
			if (column >= current_col && column < next_col) {
				return calculate_intersection_recursive(
					column,
					row,
					panel.children[i],
					check_dividers,
					"horizontal",
					{
						...view_window,
						col_start: current_col,
						col_end: next_col,
					},
					[...path, i],
				);
			}

			current_col = next_col;
		}
	}

	// If we get here, the hit was outside all children (possibly in a gap or
	// boundary).
	return null;
}
