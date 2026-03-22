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
 * The overlay behavior type.
 */
export type OverlayMode = "grid" | "absolute";

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
 *
 * While the type structure of `SplitLayout` allows nesting levels with the same
 * `orientation`, calling `RegularLayout.restore` with such a `Layout` will be
 * flattened to the equivalent layout with every child guaranteed to have the
 * opposite `orientation` as its parent.
 */
export interface SplitLayout {
	type: "split-layout";
	children: Layout[];
	sizes: number[];
	orientation: Orientation;
}

/**
 * A leaf panel node that contains a single named child element.
 */
export interface TabLayout {
	type: "tab-layout";
	tabs: string[];
	selected?: number;
}

/**
 * Represents a panel location relative to a `Layout` struct.
 */
export type LayoutPathTraversal = number[];

/**
 * Represents a draggable divider between two panels in the layout.
 *
 * Used for hit detection.
 */
export interface LayoutDivider {
	path: LayoutPathTraversal;
	view_window: ViewWindow;
	type: Orientation;
}

/**
 * Represents a panel location result from hit detection.
 */
export interface LayoutPath {
	type: "layout-path";
	slot: string;
	path: LayoutPathTraversal;
	view_window: ViewWindow;
	column: number;
	row: number;
	column_offset: number;
	row_offset: number;
	orientation: Orientation;
	is_edge: boolean;
	layout: Layout;
}

/**
 * The detail payload of the `regular-layout-before-resize` event.
 */
export interface PresizeDetail {
	calculatePresizePaths(): Record<string, LayoutPath>;
}

/**
 * An empty `Layout` with no panels.
 */
export const EMPTY_PANEL: Layout = {
	type: "split-layout",
	orientation: "horizontal",
	sizes: [],
	children: [],
};
