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

type Entry = {
	layout: Layout;
	fn: () => void;
	overlay?: PresizeOverlay;
	resolve: () => void;
	reject: (error: unknown) => void;
};

/**
 * Manages cancelable pre-resize gating for layout updates.
 *
 * Before each layout change, a cancelable `resize-before` event is dispatched
 * on the target. If the event is cancelled via `preventDefault()`, the update
 * is suspended until {@link resume} is called.
 *
 * Updates requested while one is suspended are queued, never dropped. When
 * the suspended update lands, the whole queue is drained as one batch: a
 * single `resize-before` is dispatched for the batch's final geometry (the
 * last entry's `layout`), then every entry's `fn` runs in order. Each
 * {@link run} promise resolves only once its own `fn` has run (or was
 * discarded by {@link cancelPending}).
 */
export class PresizeQueue {
	#resizing = false;
	#queued: Entry[] = [];
	#pending: (() => void) | null = null;
	#generation = 0;

	constructor(
		private _target: EventTarget,
		private _eventName: string,
		private _onDispatch?: () => void,
	) {}

	run(layout: Layout, fn: () => void, overlay?: PresizeOverlay): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.#queued.push({ layout, fn, overlay, resolve, reject });
			if (!this.#resizing) {
				void this.#drain();
			}
		});
	}

	resume(): void {
		if (this.#pending) {
			const resolve = this.#pending;
			this.#pending = null;
			resolve();
		}
	}

	/**
	 * Discards every queued update and the suspended one, if any, resolving
	 * their {@link run} promises without running their `fn`. A suspended
	 * transition still waits for {@link resume}, so a consumer mid-presize is
	 * never resumed out from under it, but its `fn` is skipped when it lands.
	 */
	cancelPending(): void {
		this.#generation++;
		const queued = this.#queued;
		this.#queued = [];
		for (const entry of queued) {
			entry.resolve();
		}
	}

	async #drain(): Promise<void> {
		this.#resizing = true;
		try {
			while (this.#queued.length > 0) {
				const batch = this.#queued;
				this.#queued = [];
				const generation = this.#generation;
				const last = batch[batch.length - 1];
				if (!this.#dispatch(last.layout, last.overlay)) {
					await new Promise<void>((resolve) => {
						this.#pending = resolve;
					});
				}

				const cancelled = generation !== this.#generation;
				for (const entry of batch) {
					try {
						if (!cancelled) {
							entry.fn();
						}

						entry.resolve();
					} catch (error) {
						entry.reject(error);
					}
				}
			}
		} finally {
			this.#resizing = false;
		}
	}

	#dispatch(layout: Layout, overlay?: PresizeOverlay): boolean {
		this._onDispatch?.();
		const detail: PresizeDetail = {
			calculatePresizePaths: () => calculate_presize_paths(layout),
			overlay,
		};

		const event = new CustomEvent(this._eventName, {
			cancelable: true,
			detail,
		});

		return this._target.dispatchEvent(event);
	}
}
