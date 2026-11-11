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
import { execSync } from "node:child_process";

const watch = process.argv.includes("--watch");

function generateDeclarations(): void {
	console.log("Generating TypeScript declaration files...");
	execSync(
		"pnpm tsc --project tsconfig.json",
		{ stdio: "inherit" }
	);

	console.log("Declaration files generated!");
}

// `index` auto-registers the custom elements, `components` does not. Code
// splitting puts the shared implementation in a common chunk, so importing
// both entry points yields the same classes rather than two copies.
const browserConfig: esbuild.BuildOptions = {
	entryPoints: ["src/index.ts", "src/components.ts"],
	bundle: true,
	splitting: true,
	minify: true,
	minifyWhitespace: true,
	minifyIdentifiers: true,
	mangleProps: /^[_#]/,
	outdir: "dist",
	platform: "browser",
	format: "esm",
	sourcemap: true,
	metafile: true,
};

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function build(): Promise<void> {
	if (watch) {
		const browserContext = await esbuild.context(browserConfig);
		await browserContext.watch();
		console.log("Watching for changes...");
	} else {
		const result = await esbuild.build(browserConfig);
		if (result.metafile) {
			console.log("\nBundle Size:");
			for (const [file, info] of Object.entries(result.metafile.outputs)) {
				console.log(`  ${file}: ${formatBytes(info.bytes)}`);
			}
		}

		generateDeclarations();
	}
}

build().catch(() => process.exit(1));
