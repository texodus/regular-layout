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

customElements.define("regular-layout-frame", RegularLayoutFrame);

customElements.define("regular-layout", RegularLayout);

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
}
