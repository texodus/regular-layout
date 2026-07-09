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
:host{box-sizing:border-box;flex-direction:column;pointer-events:none}
[part~="titlebar"]{height:24px;user-select:none;overflow:hidden}
[part~="container"]{flex:1 1 auto;pointer-events:auto}
[part~="title"]{flex:1 1 auto;pointer-events:none}
[part~="close"]{align-self:stretch}
:host([inactive]) [part~="container"]{display:none}
.tabs{display:grid;width:100%;height:100%}
.tabs slot[name="tab"]{display:grid;grid-row:1;pointer-events:auto}
.tabs regular-layout-tab{display:flex;overflow:hidden}
`;

const HTML_TEMPLATE = `
	<div part="titlebar"><div class="tabs" part="titlebar-track"><slot name="tab"><regular-layout-tab></regular-layout-tab></slot></div></div>
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
	private _tab_sheet!: CSSStyleSheet;
	private _layout!: RegularLayout;
	private _header!: HTMLElement;
	private _default_tab!: RegularLayoutTab;
	private _drag: DragState | null = null;

	/**
	 * Initializes this elements. Override this method and
	 * `disconnectedCallback` to modify how this subclass renders the Shadow
	 * DOM and registers events.
	 */
	connectedCallback() {
		this._container_sheet ??= new CSSStyleSheet();
		this._container_sheet.replaceSync(CSS);
		this._tab_sheet ??= new CSSStyleSheet();
		this._shadowRoot ??= this.attachShadow({ mode: "open" });
		this._shadowRoot.adoptedStyleSheets = [
			this._container_sheet,
			this._tab_sheet,
		];
		this._shadowRoot.innerHTML = HTML_TEMPLATE;
		this._layout = this.parentElement as RegularLayout;
		this._header = this._shadowRoot.children[0] as HTMLElement;
		// The built-in tab is the `slot="tab"` fallback; a consumer-supplied
		// `slot="tab"` child replaces it.
		this._default_tab = this._header.querySelector(
			"regular-layout-tab",
		) as RegularLayoutTab;
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
			const slot = this.getAttribute(
				this._layout.savePhysics().CHILD_ATTRIBUTE_NAME,
			);

			const path = this._layout.calculateIntersect(event);
			if (path && slot) {
				// Drag *this frame's* panel, not whichever panel is front-most at
				// the pointer (which is what `calculateIntersect` resolves to in a
				// stack). The overlapping stack shares geometry, so only the slot
				// needs overriding.
				this._drag = { path: { ...path, slot } };
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

		let tab_panel = this._layout.getPanel(slot, event.detail);
		if (!tab_panel) {
			tab_panel = { type: "tab-layout", tabs: [slot], selected: 0 };
		}

		// Each frame renders only its *own* tab. Frames in a stack overlap (see
		// `create_css_grid_layout`); the tabs tile because every frame derives
		// the same column template and places its tab in its own column. Only
		// the selected frame shows its content; the rest keep just their tab.
		const index = tab_panel.tabs.indexOf(slot);
		const selected = (tab_panel.selected ?? 0) === index;
		this.toggleAttribute("inactive", !selected);
		this._default_tab.populate(this._layout, tab_panel, index);
		this.drawTab(slot, index, tab_panel.tabs.length);
	};

	/**
	 * Regenerates this frame's tab stylesheet: the shared titlebar grid template
	 * (so every frame in the stack aligns), the column this frame's tab occupies,
	 * and the tab label. The label renders via the title's `::before` `content`,
	 * reading the slot's `--regular-layout-<slot>--title` override variable with
	 * the slot name as the fallback - so a consumer can relabel a tab purely in
	 * CSS and the change applies reactively.
	 *
	 * @param slot - This frame's panel name.
	 * @param index - This frame's column (zero-based) within the stack.
	 * @param count - The number of tabs in the stack.
	 */
	private drawTab = (slot: string, index: number, count: number) => {
		this._tab_sheet.replaceSync(
			[
				`.tabs{grid-template-columns:repeat(${count},var(--rl-tab-width,1fr))}`,
				`.tabs slot[name="tab"]{grid-column:${index + 1}}`,
				`[part~="title"]::before{content:var(${title_variable(slot)}, ${css_string(slot)})}`,
			].join("\n"),
		);
	};
}
