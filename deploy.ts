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

import * as esbuild from "esbuild";
import {
	copyFileSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";

const ROOT_DIR = process.cwd();
const EXAMPLES_DIR = join(ROOT_DIR, "examples");

async function deploy(): Promise<void> {
	console.log("Building examples for deployment...");

	// Build the examples bundle
	const result = await esbuild.build({
		entryPoints: [join(EXAMPLES_DIR, "index.ts")],
		bundle: true,
		minify: true,
		minifyWhitespace: true,
		minifyIdentifiers: true,
		outfile: join(ROOT_DIR, "index.js"),
		platform: "browser",
		format: "esm",
		sourcemap: true,
		metafile: true,
	});

	if (result.metafile) {
		console.log("\nBundle Size:");
		for (const [file, info] of Object.entries(result.metafile.outputs)) {
			const bytes = info.bytes;
			const size =
				bytes < 1024
					? `${bytes} B`
					: bytes < 1024 * 1024
						? `${(bytes / 1024).toFixed(2)} KB`
						: `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
			console.log(`  ${file}: ${size}`);
		}
	}

	// Copy HTML file and update paths
	console.log("\nCopying HTML file...");
	const htmlContent = readFileSync(join(EXAMPLES_DIR, "index.html"), "utf-8");
	const updatedHtml = htmlContent
		.replace(
			'<script type="module" src="/.esbuild-serve/index.js"></script>',
			'<script type="module" src="./index.js"></script>',
		)
		.replace(/href="\.\.\/themes\//g, 'href="./');

	writeFileSync(join(ROOT_DIR, "index.html"), updatedHtml);

	// Copy CSS file
	console.log("\nCopying CSS file...");
	copyFileSync(join(EXAMPLES_DIR, "index.css"), join(ROOT_DIR, "index.css"));

	// Copy layout.json
	console.log("\nCopying layout configuration...");
	copyFileSync(
		join(EXAMPLES_DIR, "layout.json"),
		join(ROOT_DIR, "layout.json"),
	);

	// Copy theme files
	console.log("\nCopying theme files...");
	const themesDir = join(ROOT_DIR, "themes");
	const themeFiles = readdirSync(themesDir);

	for (const file of themeFiles) {
		if (file.endsWith(".css")) {
			copyFileSync(join(themesDir, file), join(ROOT_DIR, file));
			console.log(`  Copied ${file}`);
		}
	}
}

deploy().catch((error) => {
	console.error("Deploy failed:", error);
	process.exit(1);
});
