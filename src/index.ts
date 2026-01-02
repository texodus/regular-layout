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

/**
 * Regular Layout - Resizable Panel Layout System
 *
 * A Web Component library for creating resizable, re-arrangeable layouts using
 * CSS `grid`.
 *
 * ## Basic Usage
 *
 * ```html
 * <regular-layout>
 *   <regular-layout-frame slot="sidebar">Sidebar content</regular-layout-frame>
 *   <regular-layout-frame slot="main">Main content</regular-layout-frame>
 * </regular-layout>
 * ```
 *
 * ```typescript
 * import { RegularLayout } from 'regular-layout';
 *
 * const layout = document.querySelector('regular-layout');
 *
 * // Insert panels into the grid layout.
 * layout.insertPanel('sidebar', [0]);
 * layout.insertPanel('main', [1]);
 *
 * // Remove a panel (DOM child remains connected, but not slotted).
 * layout.removePanel('sidebar');
 *
 * // Save current layout state.
 * const state = layout.save();
 * localStorage.setItem('layout', JSON.stringify(state));
 *
 * // Restore layout later.
 * const savedState = JSON.parse(localStorage.getItem('layout'));
 * layout.restore(savedState);
 * ```
 *
 * ## Core Components
 *
 * - {@link RegularLayout}: The main `<regular-layout>` custom element.
 * - {@link RegularLayoutFrame}: Optional frame component with titlebar support.
 *
 * ## Type Definitions
 *
 * - {@link Layout}: The layout tree structure for panel configuration.
 * - {@link LayoutPath}: Information about a panel's position and viewport.
 * - {@link LayoutDivider}: Information about a resizable divider.
 *
 * @packageDocumentation
 */

export type {
	LayoutPath,
	Layout,
	LayoutDivider,
} from "./common/layout_config.ts";

export { RegularLayout } from "./regular-layout.ts";
export { RegularLayoutFrame } from "./regular-layout-frame.ts";

// Side effects
import "./extensions.ts";
