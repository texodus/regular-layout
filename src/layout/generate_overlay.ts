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

import { DEFAULT_PHYSICS } from "../core/constants";
import type { LayoutPath, ViewWindow } from "../core/types";

/**
 * Converts a {@link ViewWindow} to element-relative pixel coordinates,
 * accounting for padding and optionally CSS `gap` and child `margin`.
 *
 * @param window - The view window in normalized 0–1 coordinates.
 * @param box - The element's bounding client rect.
 * @param style - The element's computed style (for padding).
 * @param margin - Optional child element's computed style (for margin inset).
 * @returns Pixel coordinates relative to the element's border-box origin.
 */
export function viewWindowToLocalRect(
	window: ViewWindow,
	box: DOMRect,
	style: CSSStyleDeclaration,
	margin?: CSSStyleDeclaration,
): { x: number; y: number; width: number; height: number } {
	const paddingLeft = parseFloat(style.paddingLeft);
	const paddingTop = parseFloat(style.paddingTop);
	const contentWidth = box.width - paddingLeft - parseFloat(style.paddingRight);
	const contentHeight =
		box.height - paddingTop - parseFloat(style.paddingBottom);

	const x = paddingLeft + window.col_start * contentWidth;
	const y = paddingTop + window.row_start * contentHeight;
	let width = (window.col_end - window.col_start) * contentWidth;
	let height = (window.row_end - window.row_start) * contentHeight;
	if (margin) {
		const marginTop = parseFloat(margin.marginTop);
		const marginRight = parseFloat(margin.marginRight);
		const marginBottom = parseFloat(margin.marginBottom);
		const marginLeft = parseFloat(margin.marginLeft);
		width -= marginLeft + marginRight;
		height -= marginTop + marginBottom;
	}

	return { x, y, width, height };
}

export function updateOverlaySheet(
	slot: string,
	box: DOMRect,
	style: CSSStyleDeclaration,
	drag_target: LayoutPath | null,
	physics = DEFAULT_PHYSICS,
	margin?: CSSStyleDeclaration,
) {
	if (!drag_target) {
		return `:host ::slotted([${physics.CHILD_ATTRIBUTE_NAME}="${slot}"]){display:none;}`;
	}

	const local = viewWindowToLocalRect(
		drag_target.view_window,
		box,
		style,
		margin,
	);

	const css = `display:flex;position:absolute!important;z-index:1;top:${local.y}px;left:${local.x}px;height:${local.height}px;width:${local.width}px;`;
	return `::slotted([${physics.CHILD_ATTRIBUTE_NAME}="${slot}"]){${css}}`;
}
