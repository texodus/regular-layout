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

import type { Layout, LayoutPath } from "./layout/types.ts";
import type { RegularLayoutEvent } from "./extensions.ts";
import type { RegularLayout } from "./regular-layout.ts";
import type { RegularLayoutTab } from "./regular-layout-tab.ts";

const CSS = `
:host{box-sizing:border-box;flex-direction:column}
:host::part(titlebar){display:flex;height:24px;user-select:none;overflow:hidden}
:host::part(container){flex:1 1 auto}
:host::part(title){flex:1 1 auto;pointer-events:none}
:host::part(close){align-self:stretch}
:host::slotted{flex:1 1 auto;}
:host regular-layout-tab{width:0px;}
`;

const HTML_TEMPLATE = `
	<div part="titlebar"></div>
	<slot part="container"></slot>
`;

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
 *     <regular-layout-frame name="panel-1">
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
	private _drag_state: LayoutPath<Layout> | null = null;
	private _drag_moved: boolean = false;
	private _tab_to_index_map: WeakMap<RegularLayoutTab, number> = new WeakMap();
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
		this._header = this._shadowRoot.children[0] as HTMLElement;
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
		const elem = event.target as RegularLayoutTab;
		if (elem.part.contains("tab")) {
			this._drag_state = this._layout.calculateIntersect(
				event.clientX,
				event.clientY,
			);

			if (this._drag_state) {
				this._header.setPointerCapture(event.pointerId);
				event.preventDefault();
			}
		}
	};

	private onPointerMove = (event: PointerEvent): void => {
		if (this._drag_state) {
			const physics = this._layout.savePhysics();

			// Only initiate a drag if the cursor has moved sufficiently.
			if (!this._drag_moved) {
				const [current_col, current_row, box] =
					this._layout.relativeCoordinates(event.clientX, event.clientY);

				const dx = (current_col - this._drag_state.column) * box.width;
				const dy = (current_row - this._drag_state.row) * box.height;
				if (Math.sqrt(dx * dx + dy * dy) <= physics.MIN_DRAG_DISTANCE) {
					return;
				}
			}

			this._drag_moved = true;
			this._layout.setOverlayState(
				event.clientX,
				event.clientY,
				this._drag_state,
				physics.OVERLAY_CLASSNAME,
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

	private drawTabs = (event: RegularLayoutEvent) => {
		const slot = this.getAttribute(
			this._layout.savePhysics().CHILD_ATTRIBUTE_NAME,
		);

		if (!slot) {
			return;
		}

		const new_panel = event.detail;
		let new_tab_panel = this._layout.getPanel(slot, new_panel);
		if (!new_tab_panel) {
			new_tab_panel = {
				type: "child-panel",
				child: [slot],
				selected: 0,
			};
		}

		for (let i = 0; i < new_tab_panel.child.length; i++) {
			if (i >= this._header.children.length) {
				const new_tab = document.createElement("regular-layout-tab");
				new_tab.populate(this._layout, new_tab_panel, i);
				this._header.appendChild(new_tab);
				this._tab_to_index_map.set(new_tab, i);
			} else {
				const tab = this._header.children[i] as RegularLayoutTab;
				tab.populate(this._layout, new_tab_panel, i);
			}
		}

		const last_index = new_tab_panel.child.length;
		for (let j = this._header.children.length - 1; j >= last_index; j--) {
			this._header.removeChild(this._header.children[j]);
		}
	};
}
