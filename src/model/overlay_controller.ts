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

import type { Layout, LayoutPath, OverlayMode } from "../core/types.ts";
import type { Physics } from "../core/constants.ts";
import type { PresizeQueue } from "./presize_queue.ts";
import { calculate_intersection } from "../layout/calculate_intersect.ts";
import { calculate_edge } from "../layout/calculate_edge.ts";
import { create_css_grid_layout } from "../layout/generate_grid.ts";
import { updateOverlaySheet } from "../layout/generate_overlay.ts";
import { remove_child } from "../layout/remove_child.ts";
import { insert_child } from "../layout/insert_child.ts";

export interface OverlayHost {
	readonly panel: Layout;
	readonly physics: Physics;
	readonly stylesheet: CSSStyleSheet;
	readonly presizeQueue: PresizeQueue;
	relativeCoordinates(
		event: { clientX: number; clientY: number },
		recalculate: boolean,
	): [number, number, DOMRect, CSSStyleDeclaration];
	restore(layout: Layout, isFlattened?: boolean): Promise<void>;
	querySelector(selectors: string): Element | null;
	dispatchEvent(event: Event): boolean;
}

/**
 * Manages overlay state during drag-and-drop panel rearrangement.
 *
 * Handles rendering a preview of where a dragged panel would land,
 * and committing or cancelling the placement when the drag ends.
 */
export class OverlayController {
	constructor(private _host: OverlayHost) {}

	async set(
		event: { clientX: number; clientY: number },
		{ slot }: LayoutPath,
		className: string = this._host.physics.OVERLAY_CLASSNAME,
		mode: OverlayMode = this._host.physics.OVERLAY_DEFAULT,
	): Promise<void> {
		const host = this._host;
		const panel = remove_child(host.panel, slot);
		const query = `:scope > [${host.physics.CHILD_ATTRIBUTE_NAME}="${slot}"]`;
		let drag_element = host.querySelector(query);
		if (drag_element) {
			drag_element.classList.add(className);
		}

		const [col, row, box, style] = host.relativeCoordinates(event, true);
		let drop_target = calculate_intersection(col, row, panel);
		if (drop_target) {
			drop_target = calculate_edge(
				col,
				row,
				panel,
				slot,
				drop_target,
				box,
				host.physics,
			);
		}

		// The dragged panel is removed from `panel` above, so it is absent from
		// the presize paths - `drop_target` carries its preview box instead
		// (null when the pointer is outside every drop target and the dragged
		// panel is hidden).
		const overlay = drop_target ? { slot, path: drop_target } : null;
		await host.presizeQueue.run(
			panel,
			() => {
				if (mode === "grid" && drop_target) {
					const path: [string, string] = [slot, drop_target?.slot];
					const css = create_css_grid_layout(panel, path, host.physics);
					host.stylesheet.replaceSync(css);
				} else if (mode === "absolute") {
					const grid_css = create_css_grid_layout(
						panel,
						undefined,
						host.physics,
					);

					while (drag_element?.tagName === "SLOT" && drag_element) {
						drag_element = (
							drag_element as HTMLSlotElement
						).assignedElements()[0];
					}

					const margin = drag_element
						? getComputedStyle(drag_element)
						: undefined;

					const overlay_css = updateOverlaySheet(
						slot,
						box,
						style,
						drop_target,
						host.physics,
						margin,
					);

					host.stylesheet.replaceSync([grid_css, overlay_css].join("\n"));
				}
			},
			overlay,
		);

		const event_name = `${host.physics.CUSTOM_EVENT_NAME_PREFIX}-before-update`;
		const custom_event = new CustomEvent<Layout>(event_name, {
			detail: panel,
		});
		host.dispatchEvent(custom_event);
	}

	async clear(
		event: { clientX: number; clientY: number } | null,
		{ slot, layout }: LayoutPath,
		className: string = this._host.physics.OVERLAY_CLASSNAME,
	): Promise<void> {
		const host = this._host;
		const panel = remove_child(host.panel, slot);
		const query = `:scope > [${host.physics.CHILD_ATTRIBUTE_NAME}="${slot}"]`;
		const drag_element = host.querySelector(query);

		if (event === null) {
			await host.restore(layout);
			return;
		}

		const [col, row, box] = host.relativeCoordinates(event, false);
		let drop_target = calculate_intersection(col, row, panel);
		if (drop_target) {
			drop_target = calculate_edge(
				col,
				row,
				panel,
				slot,
				drop_target,
				box,
				host.physics,
			);
		}

		if (drop_target) {
			const orientation = drop_target?.is_edge
				? drop_target.orientation
				: undefined;

			const new_layout = insert_child(
				panel,
				slot,
				drop_target.path,
				orientation,
			);

			await host.restore(new_layout);
		} else {
			await host.restore(layout);
		}

		if (drag_element) {
			drag_element.classList.remove(className);
		}
	}
}
