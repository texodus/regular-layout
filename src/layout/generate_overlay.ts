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

import { DEFAULT_PHYSICS } from "./constants";
import type { LayoutPath } from "./types";

export function updateOverlaySheet(
	slot: string,
	box: DOMRect,
	style: CSSStyleDeclaration,
	drag_target: LayoutPath<undefined> | null,
	physics = DEFAULT_PHYSICS,
) {
	if (!drag_target) {
		return `:host ::slotted([${physics.CHILD_ATTRIBUTE_NAME}="${slot}"]){display:none;}`;
	}

	const {
		view_window: { row_start, row_end, col_start, col_end },
	} = drag_target;

	const box_height =
		box.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);

	const box_width =
		box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);

	const top = row_start * box_height + parseFloat(style.paddingTop);
	const left = col_start * box_width + parseFloat(style.paddingLeft);
	const height = (row_end - row_start) * box_height;
	const width = (col_end - col_start) * box_width;
	const css = `display:flex;position:absolute!important;z-index:1;top:${top}px;left:${left}px;height:${height}px;width:${width}px;`;
	return `::slotted([${physics.CHILD_ATTRIBUTE_NAME}="${slot}"]){${css}}`;
}
