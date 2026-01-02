import * as esbuild from "esbuild";
import { execSync } from "node:child_process";

const watch = process.argv.includes("--watch");

function generateDeclarations() {
	console.log("Generating TypeScript declaration files...");
	execSync(
		"pnpm tsc --project tsconfig.json",
		{ stdio: "inherit" }
	);

	console.log("Declaration files generated!");
}

const browserConfig = {
	entryPoints: ["src/index.ts"],
	bundle: true,
	minify: true,
	minifyWhitespace: true,
	minifyIdentifiers: true,
	outfile: "dist/index.js",
	platform: "browser",
	format: "esm",
	sourcemap: true,
	metafile: true,
};

function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function build() {
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
