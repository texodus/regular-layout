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
 * Flattens the layout tree by merging parent and child split panels that have
 * the same orientation and type.
 *
 * When a split panel contains a child split panel with the same orientation,
 * they are merged into a single split panel. The sizes array is scaled
 * correctly to maintain proportions.
 *
 * @param layout - The layout tree to flatten
 * @returns A new flattened layout tree (original is not mutated).
 */
export function flatten(layout: Layout): Layout {
	if (layout.type === "child-panel") {
		layout.selected = layout.selected || 0;
		return layout;
	}

	const flattenedChildren: Layout[] = [];
	const flattenedSizes: number[] = [];
	for (let i = 0; i < layout.children.length; i++) {
		const child = layout.children[i];
		const childSize = layout.sizes[i];
		const flattenedChild = flatten(child);

		if (
			flattenedChild.type === "split-panel" &&
			flattenedChild.orientation === layout.orientation
		) {
			for (let j = 0; j < flattenedChild.children.length; j++) {
				flattenedChildren.push(flattenedChild.children[j]);
				flattenedSizes.push(flattenedChild.sizes[j] * childSize);
			}
		} else {
			flattenedChildren.push(flattenedChild);
			flattenedSizes.push(childSize);
		}
	}

	if (flattenedChildren.length === 1) {
		return flattenedChildren[0];
	}

	return {
		type: "split-panel",
		orientation: layout.orientation,
		children: flattenedChildren,
		sizes: flattenedSizes,
	};
}
