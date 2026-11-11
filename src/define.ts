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
import { RegularLayoutTab } from "./regular-layout-tab.ts";

/**
 * The custom elements this library provides, by tag name. The tag names are
 * fixed - `<regular-layout-frame>` renders a `<regular-layout-tab>` - so they
 * must be registered together.
 */
const ELEMENTS = [
	["regular-layout", RegularLayout],
	["regular-layout-frame", RegularLayoutFrame],
	["regular-layout-tab", RegularLayoutTab],
] as const;

/**
 * Registers `<regular-layout>`, `<regular-layout-frame>` and
 * `<regular-layout-tab>` with `registry`.
 *
 * Idempotent: a tag name which is already defined is skipped rather than
 * throwing, so this is safe to call more than once, or when another copy of
 * this library has already registered these elements (in which case that
 * copy's classes are the ones in use).
 *
 * @param registry - The registry to define the elements in, defaults to the
 *     global `customElements`.
 */
export function defineCustomElements(
	registry: CustomElementRegistry = customElements,
): void {
	for (const [name, element] of ELEMENTS) {
		if (!registry.get(name)) {
			registry.define(name, element);
		}
	}
}
