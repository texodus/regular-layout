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
 * This module defines the `<regular-layout>` custom element for browser
 * environments.
 *
 * @packageDocumentation
 */

import { EMPTY_PANEL } from "./layout/types.ts";
import { create_css_grid_layout } from "./layout/generate_grid.ts";
import type {
	LayoutPath,
	Layout,
	LayoutDivider,
	TabLayout,
	OverlayMode,
	Orientation,
	LayoutPathTraversal,
} from "./layout/types.ts";
import { calculate_intersection } from "./layout/calculate_intersect.ts";
import { remove_child } from "./layout/remove_child.ts";
import { insert_child } from "./layout/insert_child.ts";
import { redistribute_panel_sizes } from "./layout/redistribute_panel_sizes.ts";
import { updateOverlaySheet } from "./layout/generate_overlay.ts";
import { calculate_edge } from "./layout/calculate_edge.ts";
import { flatten } from "./layout/flatten.ts";
import { calculate_path } from "./layout/calculate_path.ts";
import {
	DEFAULT_PHYSICS,
	type PhysicsUpdate,
	type Physics,
} from "./layout/constants.ts";

/**
 * An interface which models the fields of `PointerEvent` that
 * `<regular-layour>` actually uses, making it easier to sub out with an
 * JavaScript object lieral when you don't have a `PointerEvent` handy.
 */
export interface PointerEventCoordinates {
	clientX: number;
	clientY: number;
}

/**
 * A Web Component that provides a resizable panel layout system.
 * Panels are arranged using CSS Grid and can be resized by dragging dividers.
 *
 * The component uses Shadow DOM and CSS Grid to manage layout.
 *
 * @example
 * ```html
 * <regular-layout>
 *   <div name="sidebar">Sidebar content</div>
 *   <div name="main">Main content</div>
 * </regular-layout>
 * ```
 *
 * @example
 * ```typescript
 * const layout = document.querySelector('regular-layout');
 *
 * // Insert panels into the grid layout
 * layout.insertPanel('main');
 * layout.insertPanel('sidebar');
 *
 * // Remove a panel (DOM child is still connected, but not slotted)
 * layout.removePanel('sidebar');
 *
 * // Save current layout
 * const state = layout.save();
 *
 * // Restore layout later
 * layout.restore(state);
 * ```
 *
 * @remarks
 *
 * Why does this implementation use a `<slot>` at all? We must use
 * `<slot>` and the Shadow DOM to scope the grid CSS rules to each
 * instance of `<regular-layout>` (without e.g. giving them unique
 * `"id"` and injecting into `document,head`), and we can only select
 * `::slotted` light DOM children from `adoptedStyleSheets` on the
 * `ShadowRoot`.
 *
 * Why does this implementation use a single `<slot>` and the child
 * `"name"` attribute, as opposed to a named `<slot name="my_slot">`
 * and the built-in `"slot"` child attribute? Children with a `"slot"`
 * attribute don't fallback to the un-named `<slot>`, so using the
 * latter implementation would require synchronizing the light DOM
 * and shadow DOM slots/slotted children continuously.
 *
 */
export class RegularLayout extends HTMLElement {
	private _shadowRoot: ShadowRoot;
	private _panel: Layout;
	private _stylesheet: CSSStyleSheet;
	private _cursor_stylesheet: CSSStyleSheet;
	private _drag_target?: [LayoutDivider, number, number];
	private _cursor_override: boolean;
	private _dimensions?: { box: DOMRect; style: CSSStyleDeclaration };
	private _physics: Physics;

	constructor() {
		super();
		this._physics = DEFAULT_PHYSICS;
		this._panel = structuredClone(EMPTY_PANEL);
		this._shadowRoot = this.attachShadow({ mode: "open" });
		this._shadowRoot.innerHTML = `<slot></slot>`;
		this._stylesheet = new CSSStyleSheet();
		this._cursor_stylesheet = new CSSStyleSheet();
		this._cursor_override = false;
		this._shadowRoot.adoptedStyleSheets = [
			this._stylesheet,
			this._cursor_stylesheet,
		];
	}

	connectedCallback() {
		this.addEventListener("dblclick", this.onDblClick);
		this.addEventListener("pointerdown", this.onPointerDown);
		this.addEventListener("pointerup", this.onPointerUp);
		this.addEventListener("pointermove", this.onPointerMove);
	}

	disconnectedCallback() {
		this.removeEventListener("dblclick", this.onDblClick);
		this.removeEventListener("pointerdown", this.onPointerDown);
		this.removeEventListener("pointerup", this.onPointerUp);
		this.removeEventListener("pointermove", this.onPointerMove);
	}

	/**
	 * Determines which panel is at a given screen coordinate.
	 *
	 * @param coordinates - `PointerEvent`, `MouseEvent`, or just X and Y
	 *     coordinates in screen pixels.
	 * @returns Panel information if a panel is at that position, null otherwise.
	 */
	calculateIntersect = (
		coordinates: PointerEventCoordinates,
	): LayoutPath | null => {
		const [col, row, _] = this.relativeCoordinates(coordinates, false);
		return calculate_intersection(col, row, this._panel);
	};

	/**
	 * Calculates the index path for a panel with the given name.
	 *
	 * @param name - The name of the panel to find.
	 * @returns The panel's index path if found, `null` otherwise.
	 */
	calculatePath = (name: string): number[] | null => {
		return calculate_path(name, this._panel);
	};

	/**
	 * Sets the visual overlay state during drag-and-drop operations.
	 * Displays a preview of where a panel would be placed at the given coordinates.
	 *
	 * @param event - `PointerEvent`, `MouseEvent`, or just X and Y
	 *     coordinates in screen pixels.
	 * @param dragTarget - A `LayoutPath` (presumably from `calculateIntersect`)
	 *     which points to the drag element in the current layout.
	 * @param className - The CSS class name to use for the overlay panel
	 *     (defaults to "overlay").
	 * @param mode - Overlay rendering mode: "grid" uses CSS grid to position
	 *     the target, "absolute" positions the panel absolutely. Defaults to
	 *     "absolute".
	 */
	setOverlayState = (
		event: PointerEventCoordinates,
		{ slot }: LayoutPath,
		className: string = this._physics.OVERLAY_CLASSNAME,
		mode: OverlayMode = this._physics.OVERLAY_DEFAULT,
	) => {
		const panel = remove_child(this._panel, slot);
		const query = `:scope > [${this._physics.CHILD_ATTRIBUTE_NAME}="${slot}"]`;
		const drag_element = this.querySelector(query);
		if (drag_element) {
			drag_element.classList.add(className);
		}

		// TODO: Don't recalculate box (but this currently protects against resize).
		const [col, row, box, style] = this.relativeCoordinates(event, true);
		let drop_target = calculate_intersection(col, row, panel);
		if (drop_target) {
			drop_target = calculate_edge(
				col,
				row,
				panel,
				slot,
				drop_target,
				box,
				this._physics,
			);
		}

		if (mode === "grid" && drop_target) {
			const path: [string, string] = [slot, drop_target?.slot];
			const css = create_css_grid_layout(panel, path, this._physics);
			this._stylesheet.replaceSync(css);
		} else if (mode === "absolute") {
			const grid_css = create_css_grid_layout(panel, undefined, this._physics);
			const overlay_css = updateOverlaySheet(
				slot,
				box,
				style,
				drop_target,
				this._physics,
			);

			this._stylesheet.replaceSync([grid_css, overlay_css].join("\n"));
		}

		const event_name = `${this._physics.CUSTOM_EVENT_NAME_PREFIX}-before-update`;
		const custom_event = new CustomEvent<Layout>(event_name, { detail: panel });
		this.dispatchEvent(custom_event);
	};

	/**
	 * Clears the overlay state and commits the panel placement.
	 *
	 * @param event - `PointerEvent`, `MouseEvent`, or just X and Y
	 *     coordinates in screen pixels.
	 * @param dragTarget - A `LayoutPath` (presumably from `calculateIntersect`)
	 *     which points to the drag element in the current layout.
	 * @param className - The CSS class name to use for the overlay panel
	 *     (defaults to "overlay").
	 * @param mode - Overlay rendering mode that was used, must match the mode
	 *     passed to `setOverlayState`. Defaults to "absolute".
	 */
	clearOverlayState = (
		event: PointerEventCoordinates | null,
		{ slot, layout }: LayoutPath,
		className: string = this._physics.OVERLAY_CLASSNAME,
	) => {
		let panel = this._panel;
		panel = remove_child(panel, slot);
		const query = `:scope > [${this._physics.CHILD_ATTRIBUTE_NAME}="${slot}"]`;
		const drag_element = this.querySelector(query);
		if (drag_element) {
			drag_element.classList.remove(className);
		}

		if (event === null) {
			this.restore(layout);
			return;
		}

		const [col, row, box] = this.relativeCoordinates(event, false);
		let drop_target = calculate_intersection(col, row, panel);
		if (drop_target) {
			drop_target = calculate_edge(
				col,
				row,
				panel,
				slot,
				drop_target,
				box,
				this._physics,
			);
		}

		if (drop_target) {
			const orientation = drop_target?.is_edge
				? drop_target.orientation
				: undefined;

			const new_layout = insert_child(
				panel,
				slot,
				drop_target.path,
				orientation,
			);

			this.restore(new_layout);
		} else {
			this.restore(layout);
		}
	};

	/**
	 * Inserts a new panel into the layout at a specified path.
	 *
	 * @param name - Unique identifier for the new panel.
	 * @param path - Index path defining where to insert.
	 * @param split - Force a split in the layout at the end of `path`
	 *     regardless if there is a leaf at this position or not. Optionally,
	 *.    `split` may be your preferred `Orientation`, which will be used by
	 *     the new `SplitPanel` _if_ there is an option of orientation (e.g. if
	 *     the layout had no pre-existing `SplitPanel`)
	 */
	insertPanel = (
		name: string,
		path: LayoutPathTraversal = [],
		split?: boolean | Orientation,
	) => {
		let orientation: Orientation | undefined;
		if (typeof split === "boolean" && split) {
			orientation = "horizontal";
		} else if (typeof split === "string") {
			orientation = split;
		}

		this.restore(insert_child(this._panel, name, path, orientation));
	};

	/**
	 * Removes a panel from the layout by name.
	 *
	 * @param name - Name of the panel to remove
	 */
	removePanel = (name: string) => {
		this.restore(remove_child(this._panel, name));
	};

	/**
	 * Retrieves a panel by name from the layout tree.
	 *
	 * @param name - Name of the panel to find.
	 * @param layout - Optional layout tree to search in (defaults to current layout).
	 * @returns The TabLayout containing the panel if found, null otherwise.
	 */
	getPanel = (name: string, layout: Layout = this._panel): TabLayout | null => {
		if (layout.type === "tab-layout") {
			if (layout.tabs.includes(name)) {
				return layout;
			}

			return null;
		}

		for (const child of layout.children) {
			const found = this.getPanel(name, child);
			if (found) {
				return found;
			}
		}

		return null;
	};

	/**
	 * Clears the entire layout, unslotting all panels.
	 */
	clear = () => {
		this.restore(EMPTY_PANEL);
	};

	/**
	 * Restores the layout from a saved state.
	 *
	 * @param layout - The layout tree to restore
	 *
	 * @example
	 * ```typescript
	 * const layout = document.querySelector('regular-layout');
	 * const savedState = JSON.parse(localStorage.getItem('layout'));
	 * layout.restore(savedState);
	 * ```
	 */
	restore = (layout: Layout, _is_flattened: boolean = false) => {
		this._panel = !_is_flattened ? flatten(layout) : layout;
		const css = create_css_grid_layout(this._panel, undefined, this._physics);
		this._stylesheet.replaceSync(css);
		const event_name = `${this._physics.CUSTOM_EVENT_NAME_PREFIX}-update`;
		const event = new CustomEvent<Layout>(event_name, { detail: this._panel });
		this.dispatchEvent(event);
	};

	/**
	 * Serializes the current layout state, which can be restored via `restore`.
	 *
	 * @returns The current layout tree
	 *
	 * @example
	 * ```typescript
	 * const layout = document.querySelector('regular-layout');
	 * const state = layout.save();
	 * localStorage.setItem('layout', JSON.stringify(state));
	 * ```
	 */
	save = (): Layout => {
		return structuredClone(this._panel);
	};

	/**
	 * Override this instance's global constants.
	 *
	 * @param physics
	 */
	restorePhysics(physics: PhysicsUpdate) {
		this._physics = Object.freeze({
			...this._physics,
			...physics,
		});
	}

	/**
	 * Get this instance's constants.
	 *
	 * @returns The current constants
	 */
	savePhysics(): Physics {
		return this._physics;
	}

	/**
	 * Converts screen coordinates to relative layout coordinates.
	 *
	 * Transforms absolute pixel positions into normalized coordinates (0-1 range)
	 * relative to the layout's bounding box.
	 *
	 * @param coordinates - `PointerEvent`, `MouseEvent`, or just X and Y
	 *     coordinates in screen pixels.
	 * @returns A tuple containing:
	 *   - col: Normalized X coordinate (0 = left edge, 1 = right edge)
	 *   - row: Normalized Y coordinate (0 = top edge, 1 = bottom edge)
	 *   - box: The layout element's bounding rectangle
	 */
	relativeCoordinates = (
		event: PointerEventCoordinates,
		recalculate_bounds: boolean = true,
	): [number, number, DOMRect, CSSStyleDeclaration] => {
		if (recalculate_bounds || !this._dimensions) {
			this._dimensions = {
				box: this.getBoundingClientRect(),
				style: getComputedStyle(this),
			};
		}

		const box = this._dimensions.box;
		const style = this._dimensions.style;
		const col =
			(event.clientX - box.left - parseFloat(style.paddingLeft)) /
			(box.width -
				parseFloat(style.paddingLeft) -
				parseFloat(style.paddingRight));

		const row =
			(event.clientY - box.top - parseFloat(style.paddingTop)) /
			(box.height -
				parseFloat(style.paddingTop) -
				parseFloat(style.paddingBottom));

		return [col, row, box, style];
	};

	/**
	 * Calculates the Euclidean distance in pixels between the current pointer
	 * coordinates and a drag target's position within the layout.
	 *
	 * @param coordinates - The current pointer event coordinates.
	 * @param drag_target - The layout path representing the drag target
	 * 	   position.
	 * @returns The distance in pixels between the coordinates and the drag
	 *     target.
	 */
	diffCoordinates = (
		event: PointerEventCoordinates,
		drag_target: LayoutPath,
	): number => {
		const [column, row, box] = this.relativeCoordinates(event, false);
		const dx = (column - drag_target.column) * box.width;
		const dy = (row - drag_target.row) * box.height;
		return Math.sqrt(dx ** 2 + dy ** 2);
	};

	private onDblClick = (event: MouseEvent) => {
		const [col, row, rect] = this.relativeCoordinates(event, false);
		const divider = calculate_intersection(col, row, this._panel, {
			rect,
			size: this._physics.GRID_DIVIDER_SIZE,
		});

		if (divider?.type === "horizontal" || divider?.type === "vertical") {
			const panel = redistribute_panel_sizes(
				this._panel,
				divider.path,
				undefined,
			);

			this.restore(panel, true);
		}
	};

	private onPointerDown = (event: PointerEvent) => {
		if (!this._physics.GRID_DIVIDER_CHECK_TARGET || event.target === this) {
			const [col, row, rect] = this.relativeCoordinates(event);
			const size = this._physics.GRID_DIVIDER_SIZE;
			const hit = calculate_intersection(col, row, this._panel, { rect, size });
			if (hit && hit.type !== "layout-path") {
				this._drag_target = [hit, col, row];
				this.setPointerCapture(event.pointerId);
				event.preventDefault();
			}
		}
	};

	private onPointerMove = (event: PointerEvent) => {
		if (this._drag_target) {
			const [col, row] = this.relativeCoordinates(event, false);
			const [{ path, type }, old_col, old_row] = this._drag_target;
			const offset = type === "horizontal" ? old_col - col : old_row - row;
			const panel = redistribute_panel_sizes(this._panel, path, offset);
			this._stylesheet.replaceSync(
				create_css_grid_layout(panel, undefined, this._physics),
			);
		}

		if (this._physics.GRID_DIVIDER_CHECK_TARGET && event.target !== this) {
			if (this._cursor_override) {
				this._cursor_override = false;
				this._cursor_stylesheet.replaceSync("");
			}

			return;
		}

		const [col, row, rect] = this.relativeCoordinates(event, false);
		const divider = calculate_intersection(col, row, this._panel, {
			rect,
			size: this._physics.GRID_DIVIDER_SIZE,
		});

		if (divider?.type === "vertical") {
			this._cursor_stylesheet.replaceSync(":host{cursor:row-resize");
			this._cursor_override = true;
		} else if (divider?.type === "horizontal") {
			this._cursor_stylesheet.replaceSync(":host{cursor:col-resize");
			this._cursor_override = true;
		} else if (this._cursor_override) {
			this._cursor_override = false;
			this._cursor_stylesheet.replaceSync("");
		}
	};

	private onPointerUp = (event: PointerEvent) => {
		if (this._drag_target) {
			this.releasePointerCapture(event.pointerId);
			const [col, row] = this.relativeCoordinates(event, false);
			const [{ path, type }, old_col, old_row] = this._drag_target;
			const offset = type === "horizontal" ? old_col - col : old_row - row;
			const panel = redistribute_panel_sizes(this._panel, path, offset);
			this.restore(panel, true);
			this._drag_target = undefined;
		}
	};
}
