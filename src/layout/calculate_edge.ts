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

import { DEFAULT_PHYSICS, type Physics } from "../core/constants";
import { insert_child } from "./insert_child";
import type {
	Layout,
	LayoutPath,
	LayoutPathTraversal,
	Orientation,
	ViewWindow,
} from "../core/types";

/**
 * Calculates an insertion point (which may involve splitting a single
 * `"tab-layout"` into a new `"split-layout"`), based on the  cursor position.
 * *
 * @param col - The cursor column.
 * @param row - The cursor row.
 * @param panel - The `Layout` to insert into.
 * @param slot - The slot identifier where the insert should occur
 * @param drop_target - The `LayoutPath` (from `calculateIntersect`) of the
 * panel to either insert next to, or split by.
 * @returns A new `LayoutPath` reflecting the updated (maybe) `"split-layout"`,
 * which is enough to draw the overlay.
 */
export function calculate_edge(
	col: number,
	row: number,
	panel: Layout,
	slot: string,
	drop_target: LayoutPath,
	box?: DOMRect,
	physics: Physics = DEFAULT_PHYSICS,
): LayoutPath {
	// Check root edges first
	if (col < physics.SPLIT_ROOT_EDGE_TOLERANCE) {
		return insert_root_edge(panel, slot, drop_target, [0], true, "horizontal");
	}

	if (col > 1 - physics.SPLIT_ROOT_EDGE_TOLERANCE) {
		return insert_root_edge(
			panel,
			slot,
			drop_target,
			drop_target.path.length > 0 ? drop_target.path : [1],
			false,
			"horizontal",
		);
	}

	if (row < physics.SPLIT_ROOT_EDGE_TOLERANCE) {
		return insert_root_edge(panel, slot, drop_target, [0], true, "vertical");
	}

	if (row > 1 - physics.SPLIT_ROOT_EDGE_TOLERANCE) {
		return insert_root_edge(
			panel,
			slot,
			drop_target,
			drop_target.path.length > 0 ? drop_target.path : [1],
			false,
			"vertical",
		);
	}

	// Check panel edges
	const is_column_edge =
		drop_target.column_offset < physics.SPLIT_EDGE_TOLERANCE ||
		drop_target.column_offset > 1 - physics.SPLIT_EDGE_TOLERANCE;

	const is_row_edge =
		drop_target.row_offset < physics.SPLIT_EDGE_TOLERANCE ||
		drop_target.row_offset > 1 - physics.SPLIT_EDGE_TOLERANCE;

	// If both edges triggered, choose closer axis
	if (is_column_edge && is_row_edge) {
		const col_distance = Math.abs(drop_target.column_offset - 0.5);
		const row_distance = Math.abs(drop_target.row_offset - 0.5);
		const col_scale =
			(box?.width || 1) *
			(drop_target.view_window.col_end - drop_target.view_window.col_start);

		const row_scale =
			(box?.height || 1) *
			(drop_target.view_window.row_end - drop_target.view_window.row_start);

		const use_column =
			col_scale / 2 - col_distance * col_scale <
			row_scale / 2 - row_distance * row_scale;

		return insert_axis(
			panel,
			slot,
			drop_target,
			use_column
				? drop_target.column_offset < physics.SPLIT_EDGE_TOLERANCE
				: drop_target.row_offset < physics.SPLIT_EDGE_TOLERANCE,
			use_column ? "horizontal" : "vertical",
		);
	}

	if (is_column_edge) {
		return insert_axis(
			panel,
			slot,
			drop_target,
			drop_target.column_offset < physics.SPLIT_EDGE_TOLERANCE,
			"horizontal",
		);
	}

	if (is_row_edge) {
		return insert_axis(
			panel,
			slot,
			drop_target,
			drop_target.row_offset < physics.SPLIT_EDGE_TOLERANCE,
			"vertical",
		);
	}

	// Not at an edge - insert as a tab
	return {
		...drop_target,
		path: [...drop_target.path, 0],
	};
}

function insert_root_edge(
	panel: Layout,
	slot: string,
	drop_target: LayoutPath,
	path: LayoutPathTraversal,
	is_before: boolean,
	orientation: Orientation,
): LayoutPath {
	return insert_axis(
		panel,
		slot,
		{ ...drop_target, path, orientation },
		is_before,
		orientation,
	);
}

function insert_axis(
	panel: Layout,
	slot: string,
	drop_target: LayoutPath,
	is_before: boolean,
	axis_orientation: Orientation,
): LayoutPath {
	let result_path: LayoutPathTraversal;

	if (drop_target.orientation === axis_orientation) {
		// Same orientation - insert into existing split
		if (drop_target.path.length === 0) {
			result_path = [is_before ? 0 : 1];
		} else {
			const last_index = drop_target.path[drop_target.path.length - 1];
			result_path = [
				...drop_target.path.slice(0, -1),
				is_before ? last_index : last_index + 1,
			];
		}
	} else {
		// Different orientation - split the child panel
		result_path = [...drop_target.path, is_before ? 0 : 1];
	}

	const new_panel = insert_child(panel, slot, result_path, axis_orientation);
	const view_window = calculate_view_window(new_panel, result_path);
	return {
		...drop_target,
		path: result_path,
		slot: drop_target.slot,
		is_edge: true,
		orientation: axis_orientation,
		view_window,
	};
}

function calculate_view_window(
	panel: Layout,
	path: LayoutPathTraversal,
): ViewWindow {
	let view_window: ViewWindow = {
		row_start: 0,
		row_end: 1,
		col_start: 0,
		col_end: 1,
	};

	let current_panel = panel;
	for (const step of path) {
		if (current_panel.type === "tab-layout") {
			break;
		}

		const index = Math.min(step, current_panel.children.length - 1);
		const is_vertical = current_panel.orientation === "vertical";
		const start_key = is_vertical ? "row_start" : "col_start";
		const end_key = is_vertical ? "row_end" : "col_end";
		const total_size = view_window[end_key] - view_window[start_key];
		const offset = current_panel.sizes
			.slice(0, index)
			.reduce((sum, size) => sum + size * total_size, view_window[start_key]);

		view_window = {
			...view_window,
			[start_key]: offset,
			[end_key]: offset + total_size * current_panel.sizes[index],
		};

		current_panel = current_panel.children[index];
	}

	return view_window;
}
