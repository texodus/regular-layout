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

import { calculate_intersection } from "./calculate_intersect";
import { SPLIT_EDGE_TOLERANCE } from "./constants";
import { insert_child } from "./insert_child";
import type { Layout, LayoutPath, Orientation } from "./layout_config";

/**
 * Calculates an insertion point (which may involve splitting a single
 * `"child-panel"` into a new `"split-panel"`), based on the  cursor position.
 * *
 * @param col - The cursor column.
 * @param row - The cursor row.
 * @param panel - The `Layout` to insert into.
 * @param slot - The slot identifier where the insert should occur
 * @param drop_target - The `LayoutPath` (from `calculateIntersect`) of the
 * panel to either insert next to, or split by.
 * @returns A new `LayoutPath` reflecting the updated (maybe) `"split-panel"`,
 * which is enough to draw the overlay.
 */
export function calculate_edge(
	col: number,
	row: number,
	panel: Layout,
	slot: string,
	drop_target: LayoutPath,
): LayoutPath {
	const is_column_edge =
		drop_target.column_offset < SPLIT_EDGE_TOLERANCE ||
		drop_target.column_offset > 1 - SPLIT_EDGE_TOLERANCE;

	const is_row_edge =
		drop_target.row_offset < SPLIT_EDGE_TOLERANCE ||
		drop_target.row_offset > 1 - SPLIT_EDGE_TOLERANCE;

	if (is_column_edge) {
		return handle_axis(
			col,
			row,
			panel,
			slot,
			drop_target,
			drop_target.column_offset,
			"horizontal",
		);
	} else if (is_row_edge) {
		return handle_axis(
			col,
			row,
			panel,
			slot,
			drop_target,
			drop_target.row_offset,
			"vertical",
		);
	}

	return drop_target;
}

function handle_axis(
	col: number,
	row: number,
	panel: Layout,
	slot: string,
	drop_target: LayoutPath,
	axis_offset: number,
	axis_orientation: Orientation,
): LayoutPath {
	const is_before = axis_offset < SPLIT_EDGE_TOLERANCE;
	if (drop_target.orientation === axis_orientation) {
		if (drop_target.path.length === 0) {
			const insert_index = is_before ? 0 : 1;
			const new_panel = insert_child(panel, slot, [insert_index]);
			drop_target = calculate_intersection(col, row, new_panel, false);
		} else {
			const path_without_last = drop_target.path.slice(0, -1);
			const last_index = drop_target.path[drop_target.path.length - 1];
			const insert_index = is_before ? last_index : last_index + 1;
			const new_panel = insert_child(panel, slot, [
				...path_without_last,
				insert_index,
			]);

			drop_target = calculate_intersection(col, row, new_panel, false);
		}
	} else {
		const path = [...drop_target.path, is_before ? 0 : 1];
		const new_panel = insert_child(panel, slot, path, axis_orientation);
		drop_target = calculate_intersection(col, row, new_panel, false);
	}

	drop_target.is_edge = true;
	return drop_target;
}
