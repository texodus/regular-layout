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

import type { Layout } from "./layout_config.ts";

/**
 * Inserts a new child panel into the layout tree at a specified location.
 * Creates a split panel if necessary and redistributes sizes equally among all
 * children.
 *
 * @param panel - The root layout tree to insert into
 * @param child - Unique identifier for the new child panel
 * @param path - Array of indices defining where to insert. Empty array inserts
 * at root level.
 * @param orientation - Orientation for newly created split panels. Defaults to
 * "horizontal".
 * @returns A new layout tree with the child inserted (original is not mutated).
 */
export function insert_child(
	panel: Layout,
	child: string,
	path: number[],
	orientation: "horizontal" | "vertical" = "horizontal",
	is_edge?: boolean,
): Layout {
	if (path.length === 0) {
		// Insert at root level
		if (panel.type === "child-panel") {
			// Add to existing child-panel as a tab
			return {
				type: "child-panel",
				child: [child, ...panel.child],
			};
		} else {
			// Append to existing split-panel
			const newChildren = [
				...panel.children,
				{
					type: "child-panel",
					child: [child],
				} as Layout,
			];

			const numChildren = newChildren.length;
			const newSizes = Array(numChildren).fill(1 / numChildren);
			return {
				...panel,
				children: newChildren,
				sizes: newSizes,
			};
		}
	}

	// Navigate down the path
	const [index, ...restPath] = path;
	if (panel.type === "child-panel") {
		// This shouldn't happen if path.length > 0, but handle it gracefully
		// We need to split this child-panel
		const newPanel: Layout = {
			type: "split-panel",
			orientation,
			children: [panel],
			sizes: [1],
		};

		return insert_child(newPanel, child, path, orientation, is_edge);
	}

	if (restPath.length === 0 || index === panel.children.length) {
		if (is_edge && panel.children[index]?.type === "child-panel") {
			panel.children[index].child.unshift(child);
			panel.children[index].selected = 0;
			return panel;
		}

		// Insert at this level at the specified index
		const newChildren = [...panel.children];
		newChildren.splice(index, 0, {
			type: "child-panel",
			child: [child],
		});

		const numChildren = newChildren.length;
		const newSizes = Array(numChildren).fill(1 / numChildren);
		return {
			...panel,
			children: newChildren,
			sizes: newSizes,
		};
	}

	const targetChild = panel.children[index];
	if (targetChild.type === "child-panel" && restPath.length > 0) {
		// Need to split this child-panel
		const oppositeOrientation =
			panel.orientation === "horizontal" ? "vertical" : "horizontal";

		const newSplitPanel = insert_child(
			targetChild,
			child,
			restPath,
			oppositeOrientation,
			is_edge,
		);

		const newChildren = [...panel.children];
		newChildren[index] = newSplitPanel;
		return {
			...panel,
			children: newChildren,
		};
	}

	const updatedChild = insert_child(
		targetChild,
		child,
		restPath,
		orientation,
		is_edge,
	);

	const newChildren = [...panel.children];
	newChildren[index] = updatedChild;
	return {
		...panel,
		children: newChildren,
	};
}
