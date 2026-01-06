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

import type { Layout, LayoutPath, TabLayout } from "./common/layout_config.ts";
import type { RegularLayoutEvent } from "./extensions.ts";
import type { RegularLayout } from "./regular-layout.ts";

const CSS = `
:host{--titlebar--height:24px;box-sizing:border-box}
:host([slot]){margin-top:calc(var(--titlebar--height) + 3px)!important;}
:host([slot])::part(container){position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;background-color:inherit;border-radius:inherit}
:host([slot])::part(titlebar){height:var(--titlebar--height);margin-top:calc(0px - var(--titlebar--height));user-select: none;}
:host([slot])::part(body){flex:1 1 auto;}
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
	constructor() {
		super();
		this._container_sheet = new CSSStyleSheet();
		this._container_sheet.replaceSync(CSS);
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
	}

	disconnectedCallback() {
		this._header.removeEventListener("pointerdown", this.onPointerDown);
		this._header.removeEventListener("pointermove", this.onPointerMove);
		this._header.removeEventListener("pointerup", this.onPointerUp);
		this._header.removeEventListener("lostpointercapture", this.onPointerLost);
		this._layout.removeEventListener("regular-layout-update", this.drawTabs);
	}

	private drawTabs = (event: RegularLayoutEvent) => {
		const slot = this.getAttribute("slot");
		const new_panel = event.detail;
		if (slot) {
			const result = this._layout.getPanel(slot, new_panel);
			this._header.textContent = "";
			if (result) {
				for (let e = 0; e < result.child.length; e++) {
					const tab = this.createTab(new_panel, result, e);
					this._header.appendChild(tab);
				}
			}
		}
	};

	private onPointerDown = (event: PointerEvent): void => {
		const elem = event.target as HTMLDivElement;
		if (elem.part.contains("tab")) {
			this._drag_state = this._layout.calculateIntersect(
				event.clientX,
				event.clientY,
			);

			if (this._drag_state) {
				// event.preventDefault();
				// event.stopImmediatePropagation();
				this._header.setPointerCapture(event.pointerId);
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
			this._drag_moved = true;
			this._layout.setOverlayState(
				event.clientX,
				event.clientY,
				this._drag_state,
			);
		}
	};

	private onPointerUp = (event: PointerEvent): void => {
		if (this._drag_state && this._drag_moved) {
			this._layout.clearOverlayState(
				event.clientX,
				event.clientY,
				this._drag_state,
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

	private createTab = (
		layout: Layout,
		result: TabLayout,
		index: number,
	): HTMLDivElement => {
		const selected = result.selected || 0;
		const tab = document.createElement("div");
		this._tab_to_index_map.set(tab, index);
		tab.textContent = result.child[index] || "";
		if (index === selected) {
			tab.setAttribute("part", "tab active-tab");
		} else {
			tab.setAttribute("part", "tab");
			tab.addEventListener("pointerdown", (_: PointerEvent) => {
				result.selected = index;
				this._layout.restore(layout);
			});
		}

		return tab;
	};
}
