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
import { Layout } from "./common/layout_config.ts";

customElements.define("regular-layout", RegularLayout);
customElements.define("regular-layout-frame", RegularLayoutFrame);

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

		querySelector<E extends Element = Element>(selectors: string): E | null;
		querySelector(selectors: "regular-layout"): RegularLayout | null;
		querySelector(selectors: "regular-layout-frame"): RegularLayoutFrame | null;
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

		removeEventListener(name: "regular-layout-update", cb: any): void;
	}
}

export interface RegularLayoutEvent extends CustomEvent {
	detail: Layout;
}

export interface PerspectiveViewerElementExt {
	addEventListener(
		name: "regular-layout-update",
		cb: (e: RegularLayoutEvent) => void,
		options?: { signal: AbortSignal },
	): void;

	removeEventListener(name: "regular-layout-update", cb: any): void;
}
