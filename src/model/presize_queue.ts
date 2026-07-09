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

import type { Layout, LayoutPath, PresizeDetail } from "../core/types.ts";
import { calculate_presize_paths } from "../layout/calculate_presize_paths.ts";

/**
 * The dragged panel's preview geometry during a drag transition - see
 * {@link PresizeDetail.overlay}.
 */
export type PresizeOverlay = { slot: string; path: LayoutPath } | null;

/**
 * Manages cancelable pre-resize gating for layout updates.
 *
 * Before each layout change, a cancelable `resize-before` event is dispatched
 * on the target. If the event is cancelled via `preventDefault()`, the update
 * is suspended until {@link resume} is called. Concurrent updates are queued
 * and processed sequentially.
 */
export class PresizeQueue {
	#resizing = false;
	#queued: {
		layout: Layout;
		fn: () => void;
		overlay?: PresizeOverlay;
	} | null = null;
	#pending: (() => void) | null = null;

	constructor(
		private _target: EventTarget,
		private _eventName: string,
		private _onDispatch?: () => void,
	) {}

	async run(
		layout: Layout,
		fn: () => void,
		overlay?: PresizeOverlay,
	): Promise<void> {
		if (this.#resizing) {
			this.#queued = { layout, fn, overlay };
			return;
		}

		this.#resizing = true;
		try {
			await this.#dispatchAndMaybeWait(layout, fn, overlay);
			while (this.#queued) {
				const {
					layout: nextLayout,
					fn: nextFn,
					overlay: nextOverlay,
				} = this.#queued;
				this.#queued = null;
				await this.#dispatchAndMaybeWait(nextLayout, nextFn, nextOverlay);
			}
		} finally {
			this.#resizing = false;
		}
	}

	resume(): void {
		if (this.#pending) {
			const resolve = this.#pending;
			this.#pending = null;
			resolve();
		}
	}

	async #dispatchAndMaybeWait(
		layout: Layout,
		fn: () => void,
		overlay?: PresizeOverlay,
	): Promise<void> {
		this._onDispatch?.();
		const detail: PresizeDetail = {
			calculatePresizePaths: () => calculate_presize_paths(layout),
			overlay,
		};

		const event = new CustomEvent(this._eventName, {
			cancelable: true,
			detail,
		});

		const proceed = this._target.dispatchEvent(event);
		if (!proceed) {
			await new Promise<void>((resolve) => {
				this.#pending = resolve;
			});
		}

		fn();
	}
}
