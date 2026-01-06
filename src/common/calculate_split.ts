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
import { insert_child } from "./insert_child";
import {
	SPLIT_EDGE_TOLERANCE,
	type Layout,
	type LayoutPath,
} from "./layout_config";

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
export function calculate_split(
	col: number,
	row: number,
	panel: Layout,
	slot: string,
	drop_target: LayoutPath,
): LayoutPath {
	if (
		drop_target.column_offset < SPLIT_EDGE_TOLERANCE ||
		drop_target.column_offset > 1 - SPLIT_EDGE_TOLERANCE
	) {
		if (drop_target.orientation === "horizontal") {
			const is_before = drop_target.column_offset < SPLIT_EDGE_TOLERANCE;
			if (drop_target.path.length === 0) {
				const insert_index = is_before ? 0 : 1;
				const new_panel = insert_child(panel, slot, [insert_index]);
				// When inserting before, point to new panel; when after, keep original
				if (is_before) {
					drop_target = calculate_intersection(col, row, new_panel, false);
				} else {
					const new_drop_target = calculate_intersection(
						col,
						row,
						new_panel,
						false,
					);
					drop_target = {
						...new_drop_target,
						path: [0],
					};
				}
			} else {
				const path_without_last = drop_target.path.slice(0, -1);
				const last_index = drop_target.path[drop_target.path.length - 1];
				const insert_index = is_before ? last_index : last_index + 1;
				const new_panel = insert_child(panel, slot, [
					...path_without_last,
					insert_index,
				]);
				// When inserting before, point to new panel; when after, keep original
				if (is_before) {
					drop_target = calculate_intersection(col, row, new_panel, false);
				} else {
					// Keep the original panel but update view_window from new layout
					const new_drop_target = calculate_intersection(
						col,
						row,
						new_panel,
						false,
					);
					drop_target = {
						...new_drop_target,
						path: [...path_without_last, last_index],
					};
				}
			}
		} else {
			const insert_index =
				drop_target.column_offset < SPLIT_EDGE_TOLERANCE ? 0 : 1;
			const original_path = drop_target.path;
			const new_panel = insert_child(
				panel,
				slot,
				[...original_path, insert_index],
				"horizontal",
			);
			drop_target = calculate_intersection(col, row, new_panel, false);
			// Override to point to the newly inserted panel
			drop_target = {
				...drop_target,
				slot,
				path: [...original_path, insert_index],
			};
		}

		if (drop_target) {
			drop_target.is_edge = true;
		}
	} else if (
		drop_target.row_offset < SPLIT_EDGE_TOLERANCE ||
		drop_target.row_offset > 1 - SPLIT_EDGE_TOLERANCE
	) {
		if (drop_target.orientation === "vertical") {
			const is_before = drop_target.row_offset < SPLIT_EDGE_TOLERANCE;
			if (drop_target.path.length === 0) {
				const insert_index = is_before ? 0 : 1;
				const new_panel = insert_child(panel, slot, [insert_index]);
				// When inserting before, point to new panel; when after, keep original
				if (is_before) {
					drop_target = calculate_intersection(col, row, new_panel, false);
				} else {
					const new_drop_target = calculate_intersection(
						col,
						row,
						new_panel,
						false,
					);
					drop_target = {
						...new_drop_target,
						path: [0],
					};
				}
			} else {
				const path_without_last = drop_target.path.slice(0, -1);
				const last_index = drop_target.path[drop_target.path.length - 1];
				const insert_index = is_before ? last_index : last_index + 1;
				const new_panel = insert_child(panel, slot, [
					...path_without_last,
					insert_index,
				]);
				// When inserting before, point to new panel; when after, keep original
				if (is_before) {
					drop_target = calculate_intersection(col, row, new_panel, false);
				} else {
					// Keep the original panel but update view_window from new layout
					const new_drop_target = calculate_intersection(
						col,
						row,
						new_panel,
						false,
					);
					drop_target = {
						...new_drop_target,
						path: [...path_without_last, last_index],
					};
				}
			}
		} else {
			const insert_index =
				drop_target.row_offset < SPLIT_EDGE_TOLERANCE ? 0 : 1;
			const original_path = drop_target.path;
			const new_panel = insert_child(
				panel,
				slot,
				[...original_path, insert_index],
				"vertical",
			);
			drop_target = calculate_intersection(col, row, new_panel, false);
			// Override to point to the newly inserted panel
			drop_target = {
				...drop_target,
				slot,
				path: [...original_path, insert_index],
			};
		}

		if (drop_target) {
			drop_target.is_edge = true;
		}
	}

	return drop_target;
}
