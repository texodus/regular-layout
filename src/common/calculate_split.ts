import { calculate_intersection } from "./calculate_intersect";
import { insert_child } from "./insert_child";
import {
	SPLIT_EDGE_TOLERANCE,
	type Layout,
	type LayoutPath,
} from "./layout_config";

export function calculate_split(
	col: number,
	row: number,
	panel: Layout,
	slot: string,
	config: LayoutPath,
): LayoutPath {
	if (
		config.column_offset < SPLIT_EDGE_TOLERANCE ||
		config.column_offset > 1 - SPLIT_EDGE_TOLERANCE
	) {
		if (config.orientation === "vertical") {
			const new_panel = insert_child(panel, slot, [
				...config.path,
				config.column_offset < SPLIT_EDGE_TOLERANCE ? 0 : 1,
			]);

			config = calculate_intersection(col, row, new_panel, false);
		} else {
			const new_panel = insert_child(panel, slot, config.path);
			config = calculate_intersection(col, row, new_panel, false);
		}
	}

	if (
		(config.row_offset < SPLIT_EDGE_TOLERANCE &&
			config.row_offset < config.column_offset) ||
		(config.row_offset > 1 - SPLIT_EDGE_TOLERANCE &&
			config.row_offset > config.column_offset)
	) {
		if (config.orientation === "horizontal") {
			const new_panel = insert_child(panel, slot, [
				...config.path,
				config.row_offset < SPLIT_EDGE_TOLERANCE ? 0 : 1,
			]);

			config = calculate_intersection(col, row, new_panel, false);
		} else {
			const new_panel = insert_child(panel, slot, config.path);
			config = calculate_intersection(col, row, new_panel, false);
		}
	}

	return config;
}
