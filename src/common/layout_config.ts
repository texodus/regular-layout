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

/**
 * The percentage of the maximum resize distance that will be clamped.
 *
 */
export const MINIMUM_REDISTRIBUTION_SIZE_THRESHOLD = 0.15;

/**
 * Threshold from panel edge that is considered a split vs drop action.
 */
export const SPLIT_EDGE_TOLERANCE = 0.25;

/**
 * Tolerance threshold for considering two grid track positions as identical.
 *
 * When collecting and deduplicating track positions, any positions closer than
 * this value are treated as the same position to avoid redundant grid tracks.
 */
export const GRID_TRACK_COLLAPSE_TOLERANCE = 0.001;

/**
 * The overlay default behavior.
 */
export const OVERLAY_DEFAULT: OverlayMode = "absolute";

/**
 * The overlay behavior type.
 */
export type OverlayMode = "grid" | "absolute" | "interactive";

/**
 * The representation of a CSS grid, in JSON form.
 */
export type Layout = SplitLayout | TabLayout;

/**
 * The orientation (of a `SplitPanel`).
 */
export type Orientation = "horizontal" | "vertical";

/**
 * A logical rectange in percent-coordinates (of a (1, 1) square).
 */
export interface ViewWindow {
	row_start: number;
	row_end: number;
	col_start: number;
	col_end: number;
}

/**
 * A split panel that divides space among multiple child layouts
 * .
 * Child panels are arranged either horizontally (side by side) or vertically
 * (stacked), via the `orientation` property `"horizzontal"` and `"vertical"`
 * (respectively).
 */
export interface SplitLayout {
	type: "split-panel";
	children: Layout[];
	sizes: number[];
	orientation: Orientation;
}

/**
 * A leaf panel node that contains a single named child element.
 */
export interface TabLayout {
	type: "child-panel";
	child: string[];
	selected?: number;
}

/**
 * Represents a draggable divider between two panels in the layout.
 *
 * Used for hit detection.
 */
export interface LayoutDivider {
	path: number[];
	view_window: ViewWindow;
	type: Orientation;
}

/**
 * Represents a panel location result from hit detection.
 *
 * Contains both the panel identifier and its grid position in relative units.
 * The generic parameter `T` allows DOM-only properties (e.g. `DOMRect`) to be
 * shared in this cross-platform module.
 */
export interface LayoutPath<T = undefined> {
	type: "layout-path";
	slot: string;
	panel: TabLayout;
	path: number[];
	view_window: ViewWindow;
	column_offset: number;
	row_offset: number;
	orientation: Orientation;
	is_edge: boolean;
	box: T;
}

/**
 * Recursively iterates over all child panel names in the layout tree, yielding
 * panel names in depth-first order.
 *
 * @param panel - The layout tree to iterate over
 * @returns Generator yielding child panel names
 */
export function* iter_panel_children(panel: Layout): Generator<string> {
	if (panel.type === "split-panel") {
		for (const child of panel.children) {
			yield* iter_panel_children(child);
		}
	} else {
		yield* panel.child;
	}
}

/**
 * An empty `Layout` with no panels.
 */
export const EMPTY_PANEL: Layout = {
	type: "split-panel",
	orientation: "horizontal",
	sizes: [],
	children: [],
};
