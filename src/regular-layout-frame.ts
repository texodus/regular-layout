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

import type { LayoutPath } from "./core/types.ts";
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
	<div part="container"><slot></slot></div>
`;

type DragState = { moved?: boolean; path: LayoutPath };

/**
 * Escapes a string for safe use as a CSS `<string>` token (the `content`
 * fallback), handling backslashes, double-quotes, and newlines.
 */
const css_string = (value: string): string =>
	`"${value.replace(/[\\"\n]/g, (c) => (c === "\n" ? "\\A " : `\\${c}`))}"`;

/**
 * The per-slot CSS custom property a consumer sets to override a tab's label,
 * e.g. `regular-layout { --regular-layout-my-panel--title: "My Panel"; }`.
 */
const title_variable = (slot: string): string =>
	`--regular-layout-${globalThis.CSS.escape(slot)}--title`;

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
 * The `name` attribute identifies the panel within the layout. The tab label
 * defaults to `name`, but can be overridden with pure CSS by setting the
 * `--regular-layout-<name>--title` custom property to a CSS string - the label
 * is rendered via the tab title's `::before` `content`, so the override
 * applies reactively with no JavaScript.
 *
 * @example
 * ```html
 * <style>
 *     regular-layout { --regular-layout-panel-1--title: "Panel 1"; }
 * </style>
 * <regular-layout>
 *     <regular-layout-frame name="panel-1">
 *         <!-- Panel content here -->
 *     </regular-layout-frame>
 * </regular-layout>
 * ```
 */
export class RegularLayoutFrame extends HTMLElement {
	private _shadowRoot!: ShadowRoot;
	private _container_sheet!: CSSStyleSheet;
	private _title_sheet!: CSSStyleSheet;
	private _layout!: RegularLayout;
	private _header!: HTMLElement;
	private _drag: DragState | null = null;
	private _tab_to_index_map: WeakMap<RegularLayoutTab, number> = new WeakMap();

	/**
	 * Initializes this elements. Override this method and
	 * `disconnectedCallback` to modify how this subclass renders the Shadow
	 * DOM and registers events.
	 */
	connectedCallback() {
		this._container_sheet ??= new CSSStyleSheet();
		this._container_sheet.replaceSync(CSS);
		this._title_sheet ??= new CSSStyleSheet();
		this._shadowRoot ??= this.attachShadow({ mode: "open" });
		this._shadowRoot.adoptedStyleSheets = [
			this._container_sheet,
			this._title_sheet,
		];
		this._shadowRoot.innerHTML = HTML_TEMPLATE;
		this._layout = this.parentElement as RegularLayout;
		this._header = this._shadowRoot.children[0] as HTMLElement;
		this._header.addEventListener("pointerdown", this.onPointerDown);
		this.addEventListener("pointermove", this.onPointerMove);
		this.addEventListener("pointerup", this.onPointerUp);
		this.addEventListener("pointercancel", this.onPointerCancel);
		this.addEventListener("lostpointercapture", this.onPointerLost);
		this._layout.addEventListener("regular-layout-update", this.drawTabs);
		this._layout.addEventListener(
			"regular-layout-before-update",
			this.drawTabs,
		);
	}

	/**
	 * Destroys this element.
	 */
	disconnectedCallback() {
		this._header.removeEventListener("pointerdown", this.onPointerDown);
		this.removeEventListener("pointermove", this.onPointerMove);
		this.removeEventListener("pointerup", this.onPointerUp);
		this.removeEventListener("pointercancel", this.onPointerUp);
		this.removeEventListener("lostpointercapture", this.onPointerLost);
		this._layout.removeEventListener("regular-layout-update", this.drawTabs);
		this._layout.removeEventListener(
			"regular-layout-before-update",
			this.drawTabs,
		);
	}

	private onPointerDown = (event: PointerEvent): void => {
		if (event.button !== 0) {
			return;
		}

		const elem = event.target as RegularLayoutTab;
		if (elem.part.contains("tab")) {
			const path = this._layout.calculateIntersect(event);
			if (path) {
				this._drag = { path };
				this.setPointerCapture(event.pointerId);
				event.preventDefault();
			} else {
				this._drag = null;
			}
		}
	};

	private onPointerMove = (event: PointerEvent): void => {
		if (this._drag) {
			const physics = this._layout.savePhysics();
			if (!this._drag.moved) {
				const diff = this._layout.diffCoordinates(event, this._drag.path);
				if (diff <= physics.MIN_DRAG_DISTANCE) {
					return;
				}
			}

			this._drag.moved = true;
			this._layout.setOverlayState(event, this._drag.path);
		}
	};

	private onPointerUp = (event: PointerEvent): void => {
		if (this._drag?.moved) {
			this._layout.clearOverlayState(event, this._drag.path);
		}
	};

	private onPointerCancel = (_: PointerEvent): void => {
		if (this._drag?.moved) {
			this._layout.clearOverlayState(null, this._drag.path);
		}
	};

	private onPointerLost = (event: PointerEvent): void => {
		this.releasePointerCapture(event.pointerId);
		this._drag = null;
	};

	private drawTabs = (event: RegularLayoutEvent) => {
		const attr = this._layout.savePhysics().CHILD_ATTRIBUTE_NAME;
		const slot = this.getAttribute(attr);
		if (!slot) {
			return;
		}

		const new_panel = event.detail;
		let new_tab_panel = this._layout.getPanel(slot, new_panel);
		if (!new_tab_panel) {
			new_tab_panel = {
				type: "tab-layout",
				tabs: [slot],
				selected: 0,
			};
		}

		for (let i = 0; i < new_tab_panel.tabs.length; i++) {
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

		const last_index = new_tab_panel.tabs.length;
		for (let j = this._header.children.length - 1; j >= last_index; j--) {
			this._header.removeChild(this._header.children[j]);
		}

		this.drawTitles(attr, new_tab_panel.tabs);
	};

	/**
	 * Regenerates this frame's title stylesheet, mapping each tab (by its slot
	 * `name`) to its label. The label is rendered via the title's `::before`
	 * `content`, reading the slot's `--regular-layout-<slot>--title` override
	 * variable with the slot name as the fallback - so a consumer can relabel a
	 * tab purely in CSS and the change applies reactively.
	 *
	 * @param attr - The child name attribute (`CHILD_ATTRIBUTE_NAME`).
	 * @param tabs - The slot names rendered in this frame's titlebar.
	 */
	private drawTitles = (attr: string, tabs: string[]) => {
		const css = tabs
			.map(
				(slot) =>
					`regular-layout-tab[${attr}="${slot}"] [part~="title"]::before{content:var(${title_variable(slot)}, ${css_string(slot)})}`,
			)
			.join("\n");

		this._title_sheet.replaceSync(css);
	};
}
