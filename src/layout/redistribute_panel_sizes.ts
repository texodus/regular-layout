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

import { MINIMUM_REDISTRIBUTION_SIZE_THRESHOLD } from "./constants.ts";
import type { Layout } from "./types.ts";

/**
 * Adjusts panel sizes during a drag operation on a divider.
 *
 * The `delta` is distributed proportionally among affected panels, maintaining
 * the sum:
 *
 * - Panels before and including the path index shrink by delta.
 * - Panels after the path index grow by delta.
 *
 * @param panel - The root layout tree to modify.
 * @param path - Path to the divider being dragged (identifies which split panel
 * to resize).
 * @param delta - Amount to resize, as a fraction (0-1). Positive values grow
 * panels before the divider, negative values shrink them.
 * @returns A new layout tree with updated sizes (original is not mutated).
 * ```
 */
export function redistribute_panel_sizes(
	panel: Layout,
	path: number[],
	delta: number,
): Layout {
	// Clone the entire panel structure
	const result = structuredClone(panel);

	// Find the orientation of the insertion panel,
	// and scale the delta on the respective axis if aligned.
	let current: Layout = result;
	const deltas = { horizontal: delta, vertical: delta };
	for (let i = 0; i < path.length - 1; i++) {
		if (current.type === "split-panel") {
			deltas[current.orientation] /= current.sizes[path[i]];
			current = current.children[path[i]];
		}
	}

	// Apply the redistribution at the final path index
	if (current.type === "split-panel") {
		const delta = deltas[current.orientation];
		const index = path[path.length - 1];

		// It would be fun to remove this condition.
		if (index < current.sizes.length - 1) {
			current.sizes = add_and_redistribute(current.sizes, index, delta);
		}
	}

	return result;
}

function add_and_redistribute(
	arr: number[],
	index: number,
	delta: number,
): number[] {
	const result = [...arr];
	let before_total = 0;
	for (let i = 0; i <= index; i++) {
		before_total += arr[i];
	}

	let after_total = 0;
	for (let i = index + 1; i < arr.length; i++) {
		after_total += arr[i];
	}

	// Clamp `delta` to prevent redistributing either side to 0.
	delta =
		Math.sign(delta) *
		Math.min(
			Math.abs(delta),
			(1 - MINIMUM_REDISTRIBUTION_SIZE_THRESHOLD) *
				(delta > 0 ? before_total : after_total),
		);

	// Redistribute elements
	for (let i = 0; i <= index; i++) {
		const proportion = arr[i] / before_total;
		result[i] = arr[i] - delta * proportion;
	}

	for (let i = index + 1; i < arr.length; i++) {
		const proportion = arr[i] / after_total;
		result[i] = arr[i] + delta * proportion;
	}

	return result;
}
