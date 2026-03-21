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

import type { Layout, LayoutPathTraversal } from "./types.ts";

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
 * @param is_edge - If true, create the split at the parent level.
 * @returns A new layout tree with the child inserted (original is not mutated).
 */
export function insert_child(
	panel: Layout,
	child: string,
	path: LayoutPathTraversal,
	orientation?: "horizontal" | "vertical",
): Layout {
	const createChildPanel = (childId: string): Layout => ({
		type: "tab-layout",
		tabs: [childId],
	});

	if (path.length === 0) {
		// Insert at root level
		if (panel.type === "tab-layout") {
			// Add to existing tab-layout as a tab
			return {
				type: "tab-layout",
				tabs: [child, ...panel.tabs],
			};
		} else if (orientation) {
			// When inserting at edge of root, wrap the entire panel in a new split
			return {
				type: "split-layout",
				orientation: orientation,
				children: [createChildPanel(child), panel],
				sizes: [0.5, 0.5],
			};
		} else {
			// Append to existing split-layout
			const newChildren = [...panel.children, createChildPanel(child)];
			const newSizes = [...panel.sizes, 1 / (newChildren.length - 1)];
			return {
				...panel,
				children: newChildren,
				sizes: redistribute(newSizes),
			};
		}
	}

	// Navigate down the path
	const [index, ...restPath] = path;

	// Special case: when orientation is provided and restPath is empty, handle edge insertion
	if (orientation && restPath.length === 0) {
		// If panel is a split-layout with the same orientation, insert into its children
		if (panel.type === "split-layout" && panel.orientation === orientation) {
			const newChildren = [...panel.children];
			newChildren.splice(index, 0, createChildPanel(child));
			const newSizes = [...panel.sizes];
			newSizes.splice(index, 0, 1 / (newChildren.length - 1));
			return {
				...panel,
				children: newChildren,
				sizes: redistribute(newSizes),
			};
		}

		// Otherwise, wrap the entire panel in a new split at the edge
		const children =
			index === 0
				? [createChildPanel(child), panel]
				: [panel, createChildPanel(child)];

		return {
			type: "split-layout",
			orientation: orientation,
			children,
			sizes: [0.5, 0.5],
		};
	}

	if (panel.type === "tab-layout") {
		// Stack into child array only when ALL of these conditions are met:
		// 1. Path has exactly one element (restPath is empty)
		// 2. Orientation was NOT explicitly provided (orientation is undefined)
		// 3. Index is within the valid stacking range [0, child.length]
		if (
			restPath.length === 0 &&
			orientation === undefined &&
			index >= 0 &&
			index <= panel.tabs.length
		) {
			const newChild = [...panel.tabs];
			newChild.splice(index, 0, child);
			return {
				...panel,
				tabs: newChild,
			};
		}

		// Otherwise, wrap in a split panel and recurse
		const newPanel: Layout = {
			type: "split-layout",
			orientation: orientation || "horizontal",
			children: [panel],
			sizes: [1],
		};

		return insert_child(newPanel, child, path, orientation);
	}

	if (restPath.length === 0 || index === panel.children.length) {
		if (orientation && panel.children[index]) {
			// When inserting at an edge, create a split panel with the new child and existing child
			const newSplitPanel: Layout = {
				type: "split-layout",
				orientation: orientation,
				children: [createChildPanel(child), panel.children[index]],
				sizes: [0.5, 0.5],
			};

			const newChildren = [...panel.children];
			newChildren[index] = newSplitPanel;
			return {
				...panel,
				children: newChildren,
				sizes: redistribute(panel.sizes),
			};
		}

		// Insert at this level at the specified index
		const newChildren = [...panel.children];
		newChildren.splice(index, 0, createChildPanel(child));
		const newSizes = [...panel.sizes];
		newSizes.splice(index, 0, 1 / (newChildren.length - 1));
		return {
			...panel,
			children: newChildren,
			sizes: redistribute(newSizes),
		};
	}

	const targetChild = panel.children[index];

	// Determine the orientation to pass down when navigating into a tab-layout
	const childOrientation =
		targetChild.type === "tab-layout" &&
		restPath.length > 0 &&
		orientation !== undefined
			? panel.orientation === "horizontal"
				? "vertical"
				: "horizontal"
			: orientation;

	const updatedChild = insert_child(
		targetChild,
		child,
		restPath,
		childOrientation,
	);

	const newChildren = [...panel.children];
	newChildren[index] = updatedChild;
	return {
		...panel,
		children: newChildren,
	};
}

function redistribute(arr: number[]): number[] {
	const total = arr.reduce((sum, val) => sum + val, 0);
	return arr.map((val) => val / total);
}
