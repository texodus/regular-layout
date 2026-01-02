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

import type { LayoutPath } from "./common/layout_config.ts";
import type { RegularLayout } from "./regular-layout.ts";

const CSS = `
:host{--titlebar--height:24px;box-sizing:border-box}
:host([slot]){margin-top:calc(var(--titlebar--height) + 3px)!important;}
:host([slot])::part(container){position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;background-color:inherit;border-radius:inherit}
:host([slot])::part(titlebar){height:var(--titlebar--height);margin-top:calc(-2px - var(--titlebar--height));user-select: none;}
:host([slot])::part(body){flex:1 1 auto;}
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
	constructor() {
		super();
		this._container_sheet = new CSSStyleSheet();
		this._container_sheet.replaceSync(CSS);
		this._shadowRoot = this.attachShadow({ mode: "open" });
		this._shadowRoot.adoptedStyleSheets = [this._container_sheet];
		this._shadowRoot.innerHTML = `<slot part="container"><slot part="titlebar">header</slot><slot part="body"><slot></slot></slot></slot>`;
		this._layout = this.parentElement as RegularLayout;
		this._header = this._shadowRoot.children[0].children[0] as HTMLElement;
	}

	connectedCallback() {
		this._header.addEventListener("pointerdown", this.onPointerDown);
		this._header.addEventListener("pointermove", this.onPointerMove);
		this._header.addEventListener("pointerup", this.onPointerUp);
	}

	disconnectedCallback() {
		this._header.removeEventListener("pointerdown", this.onPointerDown);
		this._header.removeEventListener("pointermove", this.onPointerMove);
		this._header.removeEventListener("pointerup", this.onPointerUp);
	}

	private onPointerDown = (event: PointerEvent): void => {
		this._drag_state = this._layout.calculateIntersect(
			event.clientX,
			event.clientY,
		);

		if (!this._drag_state) {
			return;
		}

		this._header.setPointerCapture(event.pointerId);
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	private onPointerMove = (event: PointerEvent): void => {
		if (this._drag_state) {
			this._layout.setOverlayState(
				event.clientX,
				event.clientY,
				this._drag_state,
			);
		}
	};

	private onPointerUp = (event: PointerEvent): void => {
		if (this._drag_state) {
			this._layout.clearOverlayState(
				event.clientX,
				event.clientY,
				this._drag_state,
			);

			this._header.releasePointerCapture(event.pointerId);
			this._drag_state = null;
		}
	};
}
