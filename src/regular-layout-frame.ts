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

import { MIN_DRAG_DISTANCE, OVERLAY_CLASSNAME } from "./common/constants.ts";
import type { LayoutPath, TabLayout } from "./common/layout_config.ts";
import type { RegularLayoutEvent } from "./extensions.ts";
import type { RegularLayout } from "./regular-layout.ts";

const CSS = (className: string) => `
:host{--titlebar--height:24px;box-sizing:border-box}
:host(:not(.${className})){margin-top:calc(var(--titlebar--height) + 3px)!important;}
:host(:not(.${className}))::part(container){position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;background-color:inherit;border-radius:inherit}
:host(:not(.${className}))::part(titlebar){height:var(--titlebar--height);margin-top:calc(0px - var(--titlebar--height));user-select: none;}
:host(:not(.${className}))::part(body){flex:1 1 auto;}
`;

const HTML_TEMPLATE = `<slot part="container"><slot part="titlebar"></slot><slot part="body"><slot></slot></slot></slot>`;

/**
 * A custom element that represents a draggable panel within a
 * `<regular-layout>`.
 *
 * `<regular-layout-frame>` is optional - you may also use a `<regular-layout>`
 * with just plain `<div>` children (for example), but panels will not be
 * moveable within the layout unless you manually call `setOverlayState` and
 * `clearOverlayState` (or otherwise impement panel moving via the
 * `<regular-layout>` API).
 *
 * `<regular-layout-frame>` simple and highly customizable implementations
 * based on [CSS `part`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::part)
 * for custom styling, and symmetric
 * [named `slot`s](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
 * for wholesale replacement of the underlying Shadow DOM.
 *
 * @example
 * ```html
 * <regular-layout>
 *     <regular-layout-frame slot="panel-1">
 *         <!-- Panel content here -->
 *     </regular-layout-frame>
 * </regular-layout>
 * ```
 */
export class RegularLayoutFrame extends HTMLElement {
	private _shadowRoot: ShadowRoot;
	private _container_sheet: CSSStyleSheet;
	private _layout!: RegularLayout;
	private _header!: HTMLElement;
	private _drag_state: LayoutPath<DOMRect> | null = null;
	private _drag_moved: boolean = false;
	private _tab_to_index_map: WeakMap<HTMLDivElement, number> = new WeakMap();
	private _tab_panel_state: TabLayout | null = null;
	constructor() {
		super();
		this._container_sheet = new CSSStyleSheet();
		this._container_sheet.replaceSync(CSS(OVERLAY_CLASSNAME));
		this._shadowRoot = this.attachShadow({ mode: "open" });
		this._shadowRoot.adoptedStyleSheets = [this._container_sheet];
	}

	connectedCallback() {
		this._shadowRoot.innerHTML = HTML_TEMPLATE;
		this._layout = this.parentElement as RegularLayout;
		this._header = this._shadowRoot.children[0].children[0] as HTMLElement;
		this._header.addEventListener("pointerdown", this.onPointerDown);
		this._header.addEventListener("pointermove", this.onPointerMove);
		this._header.addEventListener("pointerup", this.onPointerUp);
		this._header.addEventListener("lostpointercapture", this.onPointerLost);
		this._layout.addEventListener("regular-layout-update", this.drawTabs);
		this._layout.addEventListener(
			"regular-layout-before-update",
			this.drawTabs,
		);
	}

	disconnectedCallback() {
		this._header.removeEventListener("pointerdown", this.onPointerDown);
		this._header.removeEventListener("pointermove", this.onPointerMove);
		this._header.removeEventListener("pointerup", this.onPointerUp);
		this._header.removeEventListener("lostpointercapture", this.onPointerLost);
		this._layout.removeEventListener("regular-layout-update", this.drawTabs);
		this._layout.removeEventListener(
			"regular-layout-before-update",
			this.drawTabs,
		);
	}

	private onPointerDown = (event: PointerEvent): void => {
		const elem = event.target as HTMLDivElement;
		if (elem.part.contains("tab")) {
			this._drag_state = this._layout.calculateIntersect(
				event.clientX,
				event.clientY,
			);

			if (this._drag_state) {
				this._header.setPointerCapture(event.pointerId);
				event.preventDefault();
				const last_index = this._drag_state.path.length - 1;
				const selected = this._tab_to_index_map.get(elem);
				if (selected) {
					this._drag_state.path[last_index] = selected;
				}
			}
		}
	};

	private onPointerMove = (event: PointerEvent): void => {
		if (this._drag_state) {
			// Only initiate a drag if the cursor has moved sufficiently.
			if (!this._drag_moved) {
				const [current_col, current_row, box] =
					this._layout.relativeCoordinates(event.clientX, event.clientY);

				const dx = (current_col - this._drag_state.column) * box.width;
				const dy = (current_row - this._drag_state.row) * box.height;
				if (Math.sqrt(dx * dx + dy * dy) <= MIN_DRAG_DISTANCE) {
					return;
				}
			}

			this._drag_moved = true;
			this._layout.setOverlayState(
				event.clientX,
				event.clientY,
				this._drag_state,
				OVERLAY_CLASSNAME,
			);
		}
	};

	private onPointerUp = (event: PointerEvent): void => {
		if (this._drag_state && this._drag_moved) {
			this._layout.clearOverlayState(
				event.clientX,
				event.clientY,
				this._drag_state,
				OVERLAY_CLASSNAME,
			);
		}

		// TODO This may be handled by `onPointerLost`, not sure if this is
		// browser-specific behavior ...
		this._header.releasePointerCapture(event.pointerId);
		this._drag_state = null;
		this._drag_moved = false;
	};

	private onPointerLost = (event: PointerEvent): void => {
		if (this._drag_state) {
			this._layout.clearOverlayState(-1, -1, this._drag_state);
		}

		this._header.releasePointerCapture(event.pointerId);
		this._drag_state = null;
		this._drag_moved = false;
	};

	private drawTabs = (event: RegularLayoutEvent) => {
		const slot = this.assignedSlot;
		if (!slot) {
			return;
		}

		const new_panel = event.detail;
		const new_tab_panel = this._layout.getPanel(slot.name, new_panel);
		if (!new_tab_panel) {
			return;
		}

		for (let i = 0; i < new_tab_panel.child.length; i++) {
			if (i >= this._header.children.length) {
				const new_tab = this.createTab(new_tab_panel, i);
				this._header.appendChild(new_tab);
			} else {
				const tab_changed =
					(i === new_tab_panel.selected) !==
					(i === this._tab_panel_state?.selected);

				const tab = this._header.children[i] as HTMLDivElement;
				const index_changed =
					tab_changed ||
					this._tab_panel_state?.child[i] !== new_tab_panel.child[i];

				if (index_changed) {
					const new_tab = this.createTab(new_tab_panel, i);
					this._header.replaceChild(new_tab, tab);
				}
			}
		}

		const last_index = new_tab_panel.child.length;
		for (let j = this._header.children.length - 1; j >= last_index; j--) {
			this._header.removeChild(this._header.children[j]);
		}

		this._tab_panel_state = new_tab_panel;
	};

	private createTab = (tab_panel: TabLayout, index: number): HTMLDivElement => {
		const selected = tab_panel.selected || 0;
		const tab = document.createElement("div");
		this._tab_to_index_map.set(tab, index);
		tab.textContent = tab_panel.child[index] || "";
		if (index === selected) {
			tab.setAttribute("part", "tab active-tab");
		} else {
			tab.setAttribute("part", "tab");
			tab.addEventListener("pointerdown", (_) =>
				this.onTabClick(tab_panel, index),
			);
		}

		return tab;
	};

	private onTabClick = (tab_panel: TabLayout, index: number) => {
		const new_layout = this._layout.save();
		const new_tab_panel = this._layout.getPanel(
			tab_panel.child[index],
			new_layout,
		);

		if (new_tab_panel) {
			new_tab_panel.selected = index;
			this._layout.restore(new_layout);
		}
	};
}
