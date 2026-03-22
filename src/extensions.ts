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

import { RegularLayout } from "./regular-layout.ts";
import { RegularLayoutFrame } from "./regular-layout-frame.ts";
import type { Layout, PresizeDetail } from "./core/types.ts";
import { RegularLayoutTab } from "./regular-layout-tab.ts";

customElements.define("regular-layout", RegularLayout);
customElements.define("regular-layout-frame", RegularLayoutFrame);
customElements.define("regular-layout-tab", RegularLayoutTab);

declare global {
	interface Document {
		createElement(
			tagName: "regular-layout",
			options?: ElementCreationOptions,
		): RegularLayout;

		createElement(
			tagName: "regular-layout-frame",
			options?: ElementCreationOptions,
		): RegularLayoutFrame;

		createElement(
			tagName: "regular-layout-tab",
			options?: ElementCreationOptions,
		): RegularLayoutTab;

		querySelector<E extends Element = Element>(selectors: string): E | null;
		querySelector(selectors: "regular-layout"): RegularLayout | null;
		querySelector(selectors: "regular-layout-frame"): RegularLayoutFrame | null;
		querySelector(selectors: "regular-layout-tab"): RegularLayoutTab | null;
	}

	interface CustomElementRegistry {
		get(tagName: "regular-layout"): typeof RegularLayout;
		get(tagName: "regular-layout-frame"): typeof RegularLayoutFrame;
	}

	interface HTMLElement {
		addEventListener(
			name: "regular-layout-update",
			cb: (e: RegularLayoutEvent) => void,
			options?: { signal: AbortSignal },
		): void;

		addEventListener(
			name: "regular-layout-before-update",
			cb: (e: RegularLayoutEvent) => void,
			options?: { signal: AbortSignal },
		): void;

		addEventListener(
			name: "regular-layout-before-resize",
			cb: (e: RegularLayoutPresizeEvent) => void,
			options?: { signal: AbortSignal },
		): void;

		removeEventListener(
			name: "regular-layout-update",
			cb: (e: RegularLayoutEvent) => void,
		): void;

		removeEventListener(
			name: "regular-layout-before-update",
			cb: (e: RegularLayoutEvent) => void,
		): void;

		removeEventListener(
			name: "regular-layout-before-resize",
			cb: (e: RegularLayoutPresizeEvent) => void,
		): void;
	}
}

export type RegularLayoutEvent = CustomEvent<Layout>;
export type RegularLayoutPresizeEvent = CustomEvent<PresizeDetail>;
