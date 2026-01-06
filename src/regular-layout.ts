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

import {
	EMPTY_PANEL,
	iter_panel_children,
	OVERLAY_DEFAULT,
} from "./common/layout_config.ts";
import { create_css_grid_layout } from "./common/generate_grid.ts";
import type {
	LayoutPath,
	Layout,
	LayoutDivider,
	TabLayout,
} from "./common/layout_config.ts";
import { calculate_intersection } from "./common/calculate_intersect.ts";
import { remove_child } from "./common/remove_child.ts";
import { insert_child } from "./common/insert_child.ts";
import { redistribute_panel_sizes } from "./common/redistribute_panel_sizes.ts";
import { updateOverlaySheet } from "./common/generate_overlay.ts";
import { calculate_split } from "./common/calculate_split.ts";
import { flatten } from "./common/flatten.ts";

/**
 * A Web Component that provides a resizable panel layout system.
 * Panels are arranged using CSS Grid and can be resized by dragging dividers.
 *
 * The component uses Shadow DOM and CSS Grid to manage layout.
 *
 * @example
 * ```html
 * <regular-layout>
 *   <div slot="sidebar">Sidebar content</div>
 *   <div slot="main">Main content</div>
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
	private _dragPath?: [LayoutDivider, number, number];
	private _slots: Map<string, HTMLSlotElement>;
	private _unslotted_slot: HTMLSlotElement;

	constructor() {
		super();
		this._panel = structuredClone(EMPTY_PANEL);
		this._stylesheet = new CSSStyleSheet();
		this._unslotted_slot = document.createElement("slot");
		this._shadowRoot = this.attachShadow({ mode: "open" });
		this._shadowRoot.adoptedStyleSheets = [this._stylesheet];
		this._shadowRoot.appendChild(this._unslotted_slot);
		this._slots = new Map();
		this.onPointerDown = this.onPointerDown.bind(this);
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerUp = this.onPointerUp.bind(this);
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
	 * Sets the visual overlay state during drag-and-drop operations.
	 * Displays a preview of where a panel would be placed at the given coordinates.
	 *
	 * @param x - X coordinate in screen pixels.
	 * @param y - Y coordinate in screen pixels.
	 * @param layoutPath - Layout path containing the slot identifier.
	 * @param mode - Overlay rendering mode: "grid" highlights the target,
	 *   "absolute" positions the panel absolutely, "interactive" updates the
	 *   actual layout in real-time. Defaults to "absolute".
	 */
	setOverlayState<T>(
		x: number,
		y: number,
		{ slot }: LayoutPath<T>,
		mode: "grid" | "absolute" | "interactive" = OVERLAY_DEFAULT,
	) {
		let panel = this._panel;
		if (mode === "absolute") {
			panel = remove_child(panel, slot);
			this._slots.get(slot)?.assignedElements()[0]?.removeAttribute("slot");
		}

		const [col, row, box] = this.relativeCoordinates(x, y);
		let drop_target = calculate_intersection(col, row, panel, false);
		if (drop_target) {
			drop_target = calculate_split(col, row, panel, slot, drop_target);
			if (mode === "interactive") {
				let new_panel = remove_child(this._panel, slot);
				new_panel = flatten(insert_child(new_panel, slot, drop_target.path));
				const css = create_css_grid_layout(new_panel);
				this._stylesheet.replaceSync(css);
			} else if (mode === "grid") {
				const path: [string, string] = [slot, drop_target.slot];
				const css = create_css_grid_layout(this._panel, false, path);
				this._stylesheet.replaceSync(css);
			} else if (mode === "absolute") {
				const css = `${create_css_grid_layout(panel)}\n${updateOverlaySheet({ ...drop_target, box })}`;
				this._stylesheet.replaceSync(css);
			}
		} else {
			const css = `${create_css_grid_layout(panel)}}`;
			this._stylesheet.replaceSync(css);
		}

		const event = new CustomEvent("regular-layout-update", { detail: panel });
		this.dispatchEvent(event);
	}

	/**
	 * Clears the overlay state and commits the panel placement.
	 *
	 * @param x - X coordinate in screen pixels.
	 * @param y - Y coordinate in screen pixels.
	 * @param layout_path - Layout path containing the slot identifier.
	 * @param mode - Overlay rendering mode that was used, must match the mode
	 *   passed to `setOverlayState`. Defaults to "absolute".
	 */
	clearOverlayState<T>(
		x: number,
		y: number,
		drag_target: LayoutPath<T>,
		mode: "grid" | "absolute" | "interactive" = OVERLAY_DEFAULT,
	) {
		let panel = this._panel;
		if (mode === "absolute") {
			panel = remove_child(panel, drag_target.slot);
			this._unslotted_slot
				.assignedElements()[0]
				?.setAttribute("slot", drag_target.slot);
		}

		const [col, row, _] = this.relativeCoordinates(x, y);
		let drop_target = calculate_intersection(col, row, panel, false);
		if (drop_target) {
			// TODO I think I only need the new path here?
			drop_target = calculate_split(
				col,
				row,
				panel,
				drag_target.slot,
				drop_target,
			);
		}

		const { path, orientation } = drop_target ? drop_target : drag_target;

		this.restore(
			insert_child(
				panel,
				drag_target.slot,
				path,
				orientation,
				!drop_target?.is_edge,
			),
		);
	}

	/**
	 * Inserts a new panel into the layout at a specified path.
	 *
	 * @param name - Unique identifier for the new panel.
	 * @param path - Index path defining where to insert.
	 */
	insertPanel(name: string, path: number[] = []) {
		this.restore(insert_child(this._panel, name, path));
	}

	/**
	 * Removes a panel from the layout by name.
	 *
	 * @param name - Name of the panel to remove
	 */
	removePanel(name: string) {
		this.restore(remove_child(this._panel, name));
	}

	getPanel(name: string, layout: Layout = this._panel): TabLayout | null {
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
	}

	/**
	 * Determines which panel is at a given screen coordinate.
	 * Useful for drag-and-drop operations or custom interactions.
	 *
	 * @param column - X coordinate in screen pixels.
	 * @param row - Y coordinate in screen pixels.
	 * @returns Panel information if a panel is at that position, null otherwise.
	 */
	calculateIntersect(
		x: number,
		y: number,
		check_dividers: boolean = false,
	): LayoutPath<DOMRect> | null {
		const [col, row, box] = this.relativeCoordinates(x, y);
		const panel = calculate_intersection(col, row, this._panel, check_dividers);
		if (panel?.type === "layout-path") {
			return { ...panel, box };
		}

		return null;
	}

	clear() {
		this.restore(EMPTY_PANEL);
	}

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
	restore(layout: Layout, _is_flattened: boolean = false) {
		this._panel = !_is_flattened ? flatten(layout) : layout;
		const css = create_css_grid_layout(layout);
		this._stylesheet.replaceSync(css);
		const old = new Set(this._slots.keys());
		for (const name of iter_panel_children(layout)) {
			old.delete(name);
			if (!this._slots.has(name)) {
				const slot = document.createElement("slot");
				slot.setAttribute("name", name);
				this._shadowRoot.appendChild(slot);
				this._slots.set(name, slot);
			}
		}

		for (const key of old) {
			const child = this._slots.get(key);
			if (child) {
				this._shadowRoot.removeChild(child);
				this._slots.delete(key);
			}
		}

		const event = new CustomEvent("regular-layout-update", { detail: layout });
		this.dispatchEvent(event);
	}

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
	save(): Layout {
		return structuredClone(this._panel);
	}

	private relativeCoordinates(
		clientX: number,
		clientY: number,
	): [number, number, DOMRect] {
		const box = this.getBoundingClientRect();
		const col = (clientX - box.left) / (box.right - box.left);
		const row = (clientY - box.top) / (box.bottom - box.top);
		return [col, row, box];
	}

	private onPointerDown(event: PointerEvent) {
		if (event.target === this) {
			const [col, row] = this.relativeCoordinates(event.clientX, event.clientY);
			const hit = calculate_intersection(col, row, this._panel);
			if (hit && hit.type !== "layout-path") {
				this._dragPath = [hit, col, row];
				this.setPointerCapture(event.pointerId);
				// event.preventDefault();
				// event.stopImmediatePropagation();
			}
		}
	}

	private onPointerMove(event: PointerEvent) {
		if (this._dragPath) {
			const [col, row] = this.relativeCoordinates(event.clientX, event.clientY);
			const old_panel = this._panel;
			const [{ path, type }, old_col, old_row] = this._dragPath;
			const offset = type === "horizontal" ? old_col - col : old_row - row;
			const panel = redistribute_panel_sizes(old_panel, path, offset);
			this._stylesheet.replaceSync(create_css_grid_layout(panel));
		}
	}

	private onPointerUp(event: PointerEvent) {
		if (this._dragPath) {
			this.releasePointerCapture(event.pointerId);
			const [col, row] = this.relativeCoordinates(event.clientX, event.clientY);
			const old_panel = this._panel;
			const [{ path }, old_col, old_row] = this._dragPath;
			if (this._dragPath[0].type === "horizontal") {
				const panel = redistribute_panel_sizes(old_panel, path, old_col - col);
				this.restore(panel, true);
			} else {
				const panel = redistribute_panel_sizes(old_panel, path, old_row - row);
				this.restore(panel, true);
			}

			this._dragPath = undefined;
		}
	}
}
