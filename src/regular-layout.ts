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
} from "./layout/types.ts";
import { calculate_intersection } from "./layout/calculate_intersect.ts";
import { remove_child } from "./layout/remove_child.ts";
import { insert_child } from "./layout/insert_child.ts";
import { redistribute_panel_sizes } from "./layout/redistribute_panel_sizes.ts";
import { updateOverlaySheet } from "./layout/generate_overlay.ts";
import { calculate_edge } from "./layout/calculate_edge.ts";
import { flatten } from "./layout/flatten.ts";
import {
	DEFAULT_PHYSICS,
	type PhysicsUpdate,
	type Physics,
} from "./layout/constants.ts";

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

		// Why does this implementation use a `<slot>` at all? We must use
		// `<slot>` and the Shadow DOM to scope the grid CSS rules to each
		// instance of `<regular-layout>` (without e.g. giving them unique
		// `"id"` and injecting into `document,head`), and we can only select
		// `::slotted` light DOM children from `adoptedStyleSheets` on the
		// `ShadowRoot`.

		// In addition, this model uses a single un-named `<slot>` to host all
		// light-DOM children, and the child's `"name"` attribute to identify
		// its position in the `Layout`. Alternatively, using named
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
		this.addEventListener("pointerdown", this.onPointerDown);
		this.addEventListener("pointerup", this.onPointerUp);
		this.addEventListener("pointermove", this.onPointerMove);
	}

	disconnectedCallback() {
		this.removeEventListener("pointerdown", this.onPointerDown);
		this.removeEventListener("pointerup", this.onPointerUp);
		this.removeEventListener("pointermove", this.onPointerMove);
	}

	/**
	 * Determines which panel is at a given screen coordinate.
	 *
	 * @param column - X coordinate in screen pixels.
	 * @param row - Y coordinate in screen pixels.
	 * @returns Panel information if a panel is at that position, null otherwise.
	 */
	calculateIntersect = (
		x: number,
		y: number,
		check_dividers: boolean = false,
	): LayoutPath<Layout> | null => {
		const [col, row, rect] = this.relativeCoordinates(x, y, false);
		const panel = calculate_intersection(
			col,
			row,
			this._panel,
			check_dividers ? { rect, size: this._physics.GRID_DIVIDER_SIZE } : null,
		);

		if (panel?.type === "layout-path") {
			return { ...panel, layout: this.save() };
		}

		return null;
	};

	/**
	 * Sets the visual overlay state during drag-and-drop operations.
	 * Displays a preview of where a panel would be placed at the given coordinates.
	 *
	 * @param x - X coordinate in screen pixels.
	 * @param y - Y coordinate in screen pixels.
	 * @param dragTarget - A `LayoutPath` (presumably from `calculateIntersect`)
	 *     which points to the drag element in the current layout.
	 * @param className - The CSS class name to use for the overlay panel
	 *     (defaults to "overlay").
	 * @param mode - Overlay rendering mode: "grid" uses CSS grid to position
	 *     the target, "absolute" positions the panel absolutely. Defaults to
	 *     "absolute".
	 */
	setOverlayState = (
		x: number,
		y: number,
		{ slot }: LayoutPath<unknown>,
		className: string = this._physics.OVERLAY_CLASSNAME,
		mode: OverlayMode = this._physics.OVERLAY_DEFAULT,
	) => {
		const panel = remove_child(this._panel, slot);
		Array.from(this.children)
			.find((x) => x.getAttribute(this._physics.CHILD_ATTRIBUTE_NAME) === slot)
			?.classList.add(className);

		const [col, row, box, style] = this.relativeCoordinates(x, y, false);
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
		const event = new CustomEvent<Layout>(event_name, { detail: panel });
		this.dispatchEvent(event);
	};

	/**
	 * Clears the overlay state and commits the panel placement.
	 *
	 * @param x - X coordinate in screen pixels.
	 * @param y - Y coordinate in screen pixels.
	 * @param dragTarget - A `LayoutPath` (presumably from `calculateIntersect`)
	 *     which points to the drag element in the current layout.
	 * @param className - The CSS class name to use for the overlay panel
	 *     (defaults to "overlay").
	 * @param mode - Overlay rendering mode that was used, must match the mode
	 *     passed to `setOverlayState`. Defaults to "absolute".
	 */
	clearOverlayState = (
		x: number,
		y: number,
		drag_target: LayoutPath<Layout>,
		className: string = this._physics.OVERLAY_CLASSNAME,
	) => {
		let panel = this._panel;
		panel = remove_child(panel, drag_target.slot);
		Array.from(this.children)
			.find(
				(x) =>
					x.getAttribute(this._physics.CHILD_ATTRIBUTE_NAME) ===
					drag_target.slot,
			)
			?.classList.remove(className);

		const [col, row, box] = this.relativeCoordinates(x, y, false);
		let drop_target = calculate_intersection(col, row, panel);
		if (drop_target) {
			drop_target = calculate_edge(
				col,
				row,
				panel,
				drag_target.slot,
				drop_target,
				box,
				this._physics,
			);
		}

		const { path, orientation } = drop_target ? drop_target : drag_target;
		const new_layout = drop_target
			? insert_child(
					panel,
					drag_target.slot,
					path,
					drop_target?.is_edge ? orientation : undefined,
				)
			: drag_target.layout;

		this.restore(new_layout);
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
		path: number[] = [],
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
		if (layout.type === "child-panel") {
			if (layout.child.includes(name)) {
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
	 * @param clientX - X coordinate in screen pixels (client space).
	 * @param clientY - Y coordinate in screen pixels (client space).
	 * @returns A tuple containing:
	 *   - col: Normalized X coordinate (0 = left edge, 1 = right edge)
	 *   - row: Normalized Y coordinate (0 = top edge, 1 = bottom edge)
	 *   - box: The layout element's bounding rectangle
	 */
	relativeCoordinates = (
		clientX: number,
		clientY: number,
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
			(clientX - box.left - parseFloat(style.paddingLeft)) /
			(box.width -
				parseFloat(style.paddingLeft) -
				parseFloat(style.paddingRight));
		const row =
			(clientY - box.top - parseFloat(style.paddingTop)) /
			(box.height -
				parseFloat(style.paddingTop) -
				parseFloat(style.paddingBottom));

		return [col, row, box, style];
	};

	private onPointerDown = (event: PointerEvent) => {
		if (!this._physics.GRID_DIVIDER_CHECK_TARGET || event.target === this) {
			const [col, row, rect] = this.relativeCoordinates(
				event.clientX,
				event.clientY,
			);

			const hit = calculate_intersection(col, row, this._panel, {
				rect,
				size: this._physics.GRID_DIVIDER_SIZE,
			});
			if (hit && hit.type !== "layout-path") {
				this._drag_target = [hit, col, row];
				this.setPointerCapture(event.pointerId);
				event.preventDefault();
			}
		}
	};

	private onPointerMove = (event: PointerEvent) => {
		if (this._drag_target) {
			const [col, row] = this.relativeCoordinates(
				event.clientX,
				event.clientY,
				false,
			);

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

		const [col, row, rect] = this.relativeCoordinates(
			event.clientX,
			event.clientY,
			false,
		);

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
			const [col, row] = this.relativeCoordinates(
				event.clientX,
				event.clientY,
				false,
			);

			const [{ path, type }, old_col, old_row] = this._drag_target;
			const offset = type === "horizontal" ? old_col - col : old_row - row;
			const panel = redistribute_panel_sizes(this._panel, path, offset);
			this.restore(panel, true);
			this._drag_target = undefined;
		}
	};
}
