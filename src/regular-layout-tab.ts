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

import type { TabLayout } from "./core/types.ts";
import type { RegularLayout } from "./regular-layout.ts";

/**
 * A custom HTML element representing an individual tab in a tab panel.
 *
 * This element manages the visual representation and interactions for a single tab,
 * including selection state, close functionality, and content display.
 */
export class RegularLayoutTab extends HTMLElement {
	private _layout?: RegularLayout;
	private _tab_panel?: TabLayout;
	private _index?: number;

	/**
	 * Populates or updates the tab with layout information.
	 *
	 * This method initializes the tab's content and event listeners on first call,
	 * and efficiently updates only the changed properties on subsequent calls.
	 *
	 * @param layout - The parent RegularLayout instance managing this tab.
	 * @param tab_panel - The tab panel layout containing this tab.
	 * @param index - The index of this tab within the tab panel.
	 */
	populate = (layout: RegularLayout, tab_panel: TabLayout, index: number) => {
		if (this._tab_panel) {
			const tab_changed =
				(index === tab_panel.selected) !==
				(index === this._tab_panel?.selected);

			const index_changed =
				tab_changed || this._tab_panel?.tabs[index] !== tab_panel.tabs[index];

			if (index_changed) {
				const selected = tab_panel.selected === index;
				const slot = tab_panel.tabs[index];
				this.children[0].textContent = slot;

				if (selected) {
					this.children[1].part.add("active-close");
					this.part.add("active-tab");
				} else {
					this.children[1].part.remove("active-close");
					this.part.remove("active-tab");
				}
			}
		} else {
			const slot = tab_panel.tabs[index];
			const selected = tab_panel.selected === index;
			const parts = selected ? "active-close close" : "close";
			this.innerHTML = `<div part="title"></div><button part="${parts}"></button>`;
			if (selected) {
				this.part.add("tab", "active-tab");
			} else {
				this.part.add("tab");
			}

			this.addEventListener("pointerdown", this.onTabClick);
			this.children[0].textContent = slot;
			this.children[1].addEventListener("pointerdown", this.onTabClose);
		}

		this._tab_panel = tab_panel;
		this._layout = layout;
		this._index = index;
	};

	private onTabClose = (_: Event) => {
		if (this._tab_panel !== undefined && this._index !== undefined) {
			this._layout?.removePanel(this._tab_panel.tabs[this._index]);
		}
	};

	private onTabClick = (_: PointerEvent) => {
		if (
			this._tab_panel !== undefined &&
			this._index !== undefined &&
			this._index !== this._tab_panel.selected
		) {
			const new_layout = this._layout?.save();
			const new_tab_panel = this._layout?.getPanel(
				this._tab_panel.tabs[this._index],
				new_layout,
			);

			if (new_tab_panel && new_layout) {
				new_tab_panel.selected = this._index;
				this._layout?.restore(new_layout);
			}
		}
	};
}
