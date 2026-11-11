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

// A frame's content taller than the frame must overflow inside the container,
// not shrink the titlebar: the titlebar is a fixed-height flex item and the
// container must be allowed to shrink below its content's height.
// https://github.com/texodus/regular-layout/issues/17

import { expect, test } from "../helpers/coverage.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

for (const theme of [
	"",
	"lorax",
	"gibson",
	"chicago",
	"fluxbox",
	"hotdog",
	"borland",
]) {
	test(`tall content does not collapse the titlebar (theme: "${theme}")`, async ({
		page,
	}) => {
		await page.goto("/examples/index.html");
		await page.waitForSelector("regular-layout");
		const result = await page.evaluate(
			async ({ layout, theme }) => {
				const root = document.querySelector("regular-layout");
				const frame = document.querySelector(
					'regular-layout-frame[name="AAA"]',
				) as HTMLElement;

				if (!root || !frame) {
					throw new Error("Missing example elements");
				}

				root.className = theme;
				const tall = document.createElement("div");
				tall.style.height = "5000px";
				frame.appendChild(tall);
				await root.restore(layout as never);
				const part = (name: string) =>
					(
						frame.shadowRoot?.querySelector(`[part~="${name}"]`) as HTMLElement
					).getBoundingClientRect();

				const titlebar = part("titlebar");
				const container = part("container");
				return {
					titlebarHeight: titlebar.height,
					titlebarBottom: titlebar.bottom,
					containerTop: container.top,
					containerBottom: container.bottom,
					frameBottom: frame.getBoundingClientRect().bottom,
				};
			},
			{ layout: LAYOUTS.SINGLE_AAA, theme },
		);

		expect(result.titlebarHeight).toBeGreaterThan(0);
		expect(result.containerTop).toBeGreaterThanOrEqual(result.titlebarBottom);
		expect(result.containerBottom).toBeLessThanOrEqual(result.frameBottom + 1);
	});
}
