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
import * as http from "node:http";

const PORT = 8081;

const build_config: esbuild.BuildOptions = {
	entryPoints: ["examples/index.ts"],
	bundle: true,
	outdir: ".esbuild-serve",
	platform: "browser",
	format: "esm",
	sourcemap: true,
	splitting: true,
};

async function serve(): Promise<void> {
	const ctx = await esbuild.context(build_config);
	const { port } = await ctx.serve({
		servedir: ".",
		onRequest: (args) => {
			console.log(`${args.method} ${args.path} - ${args.status}`);
		},
	});

	const esbuild_host = "127.0.0.1";
	console.log(`esbuild server running on ${esbuild_host}:${port}`);
	const proxy = http.createServer((req, res) => {
		const options: http.RequestOptions = {
			hostname: esbuild_host,
			port: port,
			path: req.url,
			method: req.method,
			headers: req.headers,
		};

		const proxy_req = http.request(options, (proxy_res) => {
			if (proxy_res.statusCode === 404) {
				res.writeHead(404, { "Content-Type": "text/html" });
				res.end("<h1>404 - Not Found</h1>");
				return;
			}

			res.writeHead(proxy_res.statusCode || 200, proxy_res.headers);
			proxy_res.pipe(res, { end: true });
		});

		proxy_req.on("error", (err) => {
			console.error(`Proxy request error for ${req.url}:`, err.message);
			res.writeHead(500, { "Content-Type": "text/html" });
			res.end("<h1>500 - Internal Server Error</h1>");
		});

		req.pipe(proxy_req, { end: true });
	});

	proxy.listen(PORT, () => {
		console.log(`Development server running at http://localhost:${PORT}`);
		console.log(`Serving directory: ${process.cwd()}`);
		console.log("\nWatching for changes...");
	});

	await ctx.watch();
}

serve().catch((error) => {
	console.error(error);
	process.exit(1);
});
