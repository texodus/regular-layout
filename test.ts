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

import * as fs from "node:fs";
import * as path from "node:path";
import { CoverageReport } from "monocart-coverage-reports";
import { execSync } from "node:child_process";

const COVERAGE_DIR = path.join(process.cwd(), "build", "coverage");
const RAW_DIR = path.join(COVERAGE_DIR, "raw");
const REPORT_DIR = COVERAGE_DIR;

async function generateReport(): Promise<void> {
	if (!fs.existsSync(RAW_DIR)) {
		console.error("No coverage data found. Run tests with COVERAGE=1 first.");
		process.exit(1);
	}

	const rawFiles = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".json"));
	if (rawFiles.length === 0) {
		console.error("No coverage data found in .coverage/raw/");
		process.exit(1);
	}

	console.log(`Processing ${rawFiles.length} coverage file(s)...`);
	const report = new CoverageReport({
		reports: ["text", "html", "lcovonly"],
		outputDir: REPORT_DIR,
		sourceFilter: (sourcePath: string) => sourcePath.startsWith("src/"),
	});

	for (const file of rawFiles) {
		const entries = JSON.parse(
			fs.readFileSync(path.join(RAW_DIR, file), "utf-8"),
		);

		for (const entry of entries) {
			const urlPath = new URL(entry.url).pathname;
			entry.url = path.join(process.cwd(), urlPath);
		}

		await report.add(entries);
	}

	await report.generate();
	console.log(`\nCoverage report generated at ${REPORT_DIR}/index.html`);
	console.log(`LCOV data written to ${REPORT_DIR}/lcov.info`);
}

execSync(
	`rm -rf build/coverage && COVERAGE=1 playwright test tests/unit tests/integration`,
	{ stdio: "inherit" },
);

generateReport().catch((err) => {
	console.error("Failed to generate coverage report:", err);
	process.exit(1);
});
