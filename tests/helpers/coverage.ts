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

import { test as base, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

const COVERAGE_DIR = path.join(process.cwd(), "build", "coverage", "raw");

/**
 * Extended Playwright test fixture that collects V8 JS coverage from
 * Chromium's CDP coverage API. Coverage entries are written as JSON
 * files to `build/coverage/raw/` for later merging and report generation.
 *
 * Only active when the `COVERAGE` environment variable is set.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		const enabled = !!process.env.COVERAGE;
		if (enabled) {
			await page.coverage.startJSCoverage({
				resetOnNavigation: false,
			});
		}

		await use(page);

		if (enabled) {
			const coverage = await page.coverage.stopJSCoverage();
			const relevant = coverage.filter((entry) =>
				entry.url.includes(".esbuild-serve/"),
			);

			if (relevant.length > 0) {
				fs.mkdirSync(COVERAGE_DIR, { recursive: true });
				const id = crypto.randomUUID();
				fs.writeFileSync(
					path.join(COVERAGE_DIR, `${id}.json`),
					JSON.stringify(relevant),
				);
			}
		}
	},
});

export { expect };
