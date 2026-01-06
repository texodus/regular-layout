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

import type { Layout, TabLayout } from "./layout_config.ts";
import { EMPTY_PANEL } from "./layout_config.ts";

/**
 * Removes a child panel from the layout tree by its name.
 *
 * Redistributes the removed panel's space proportionally among remaining
 * siblings. Automatically collapses split panels when only one child remains.
 *
 * @param panel - The root layout tree to remove from.
 * @param child - Name of the child panel to remove.
 * @returns A new layout tree with the child removed (original is not mutated).
 * Returns `EMPTY_PANEL` if the last panel is removed.
 */
export function remove_child(panel: Layout, child: string): Layout {
	// If this is a child panel, handle tab removal
	if (panel.type === "child-panel") {
		if (panel.child.includes(child)) {
			const newChild = panel.child.filter((c) => c !== child);
			if (newChild.length === 0) {
				return structuredClone(EMPTY_PANEL);
			}
			return {
				type: "child-panel",
				child: newChild,
			};
		}
		return structuredClone(panel);
	}

	// Clone the panel structure
	const result = structuredClone(panel);

	// Try to remove the child from this split panel's children
	const index = result.children.findIndex((p) => {
		if (p.type === "child-panel") {
			return p.child.includes(child);
		}

		return false;
	});

	if (index !== -1) {
		const tab_layout = result.children[index] as TabLayout;
		if (tab_layout.child.length === 1) {
			// Found the child at this level - remove it
			const newChildren = result.children.filter((_, i) => i !== index);
			const newSizes = remove_and_redistribute(result.sizes, index);

			// If only one child remains, collapse the split panel
			if (newChildren.length === 1) {
				return newChildren[0];
			}

			result.children = newChildren;
			result.sizes = newSizes;
		} else {
			tab_layout.child.splice(tab_layout.child.indexOf(child), 1);
			if (
				tab_layout.selected &&
				tab_layout.selected >= tab_layout.child.length
			) {
				tab_layout.selected--;
			}
		}

		return result;
	}

	// Child not found at this level - recursively search children
	let modified = false;
	const newChildren = result.children.map((p) => {
		if (p.type === "split-panel") {
			const updated = remove_child(p, child);
			if (updated !== p) {
				modified = true;
			}

			return updated;
		}

		return p;
	});

	if (modified) {
		result.children = newChildren;
	}

	return result;
}

function remove_and_redistribute(arr: number[], index: number): number[] {
	const result = [];

	// Get the size of the element being removed
	const removed_size = arr[index];

	// Calculate the total of remaining elements
	let remaining_total = 0;
	for (let i = 0; i < arr.length; i++) {
		if (i !== index) {
			remaining_total += arr[i];
		}
	}

	// Distribute the removed size proportionally to remaining elements
	for (let i = 0; i < arr.length; i++) {
		if (i !== index) {
			const proportion = arr[i] / remaining_total;
			result.push(arr[i] + removed_size * proportion);
		}
	}

	return result;
}
