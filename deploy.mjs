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

import { execSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function exec(command, options = {}) {
	console.log(`> ${command}`);
	return execSync(command, { stdio: "inherit", ...options });
}

function execOutput(command) {
	return execSync(command, { encoding: "utf-8" }).trim();
}

try {
	console.log("Checking git status...");
	const gitStatus = execOutput("git status --porcelain");
	if (gitStatus) {
		console.error("Error: Git staging area is not clean. Please commit or stash your changes.");
		console.error(gitStatus);
		process.exit(1);
	}

	console.log("Building project...");
	exec("pnpm run build");

	console.log("Preparing deployment files...");
	const currentBranch = execOutput("git rev-parse --abbrev-ref HEAD");
	const currentCommit = execOutput("git rev-parse --short HEAD");
	const tempDir = mkdtempSync(join(tmpdir(), "gh-pages-"));
	cpSync("dist", join(tempDir, "dist"), { recursive: true });
	cpSync("examples", tempDir, { recursive: true });

	console.log("Switching to gh-pages branch...");
	let ghPagesExists = false;
	try {
		execSync("git show-ref --verify --quiet refs/heads/gh-pages");
		ghPagesExists = true;
	} catch (e) {
		throw new Error("No gh-pages branch found");
	}

	if (ghPagesExists) {
		exec("git checkout gh-pages");
	} else {
		throw new Error("No gh-pages branch found");
	}

	console.log("Copying build artifacts...");
	cpSync(tempDir, ".", { recursive: true });
	console.log("Committing changes...");
	exec("git add -A");
	exec(`git commit -m "Deploy from ${currentBranch} @ ${currentCommit}"`);

	console.log(`Returning to ${currentBranch}...`);
	exec(`git checkout ${currentBranch}`);
	rmSync(tempDir, { recursive: true, force: true });
	console.log("Deployment complete! gh-pages branch updated locally.");
} catch (error) {
	console.error("Deployment failed:", error.message);
	process.exit(1);
}
