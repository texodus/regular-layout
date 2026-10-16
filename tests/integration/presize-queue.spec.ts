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

// Concurrent mutations while a `before-resize` transition is in flight must
// never be lost: each builds on the latest *intended* tree, every queued
// commit lands (in order), and each caller's promise resolves only once its
// own commit has.

import { expect, test } from "../helpers/coverage.ts";
import { setupLayout } from "../helpers/integration.ts";
import { LAYOUTS } from "../helpers/fixtures.ts";

const panelDisplay = (page: import("@playwright/test").Page, name: string) =>
	page.evaluate((name) => {
		const panel = document.querySelector(`[name="${name}"]`);
		return panel ? getComputedStyle(panel).display : undefined;
	}, name);

test("unawaited inserts with no listener all land", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const tabs = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		await Promise.all([
			layout?.insertPanel("BBB", [1]),
			layout?.insertPanel("CCC", [2]),
			layout?.insertPanel("DDD", [3]),
		]);

		const names = ["AAA", "BBB", "CCC", "DDD"];
		return names.filter((name) => layout?.getPanel(name));
	});

	expect(tabs).toStrictEqual(["AAA", "BBB", "CCC", "DDD"]);
});

test("insert then removes under an always-deferring listener keeps the insert", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.TWO_HORIZONTAL_EQUAL);
	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		layout?.addEventListener("regular-layout-before-resize", (e) => {
			e.preventDefault();
			setTimeout(() => layout.resumeResize(), 10);
		});

		// The single-panel `restoreWorkspace` replace sequence.
		await Promise.all([
			layout?.insertPanel("CCC"),
			layout?.removePanel("AAA"),
			layout?.removePanel("BBB"),
		]);

		const names = ["AAA", "BBB", "CCC"];
		return names.filter((name) => layout?.getPanel(name));
	});

	expect(result).toStrictEqual(["CCC"]);
});

test("a queued restore is not dropped by a later maximize", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	await page.evaluate(async (two) => {
		const layout = document.querySelector("regular-layout");
		let first = true;
		layout?.addEventListener("regular-layout-before-resize", (e) => {
			if (first) {
				first = false;
				e.preventDefault();
			}
		});

		const parked = layout?.restore({ type: "tab-layout", tabs: ["CCC"] });
		const restored = layout?.restore(two as never);
		const maximized = layout?.maximize("AAA");
		await new Promise((r) => setTimeout(r, 20));
		layout?.resumeResize();
		await Promise.all([parked, restored, maximized]);
	}, LAYOUTS.TWO_HORIZONTAL_EQUAL);

	const tabs = await page.evaluate(() => {
		const layout = document.querySelector("regular-layout");
		return ["AAA", "BBB", "CCC"].filter((name) => layout?.getPanel(name));
	});

	expect(tabs).toStrictEqual(["AAA", "BBB"]);
	expect(await panelDisplay(page, "AAA")).toBe("flex");
	expect(await panelDisplay(page, "BBB")).toBe("none");
});

test("queued commits share one presize, each emits an update, and promises wait for their commit", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		const log: string[] = [];
		let presizes = 0;
		layout?.addEventListener("regular-layout-before-resize", (e) => {
			presizes++;
			if (presizes === 1) {
				e.preventDefault();
			}
		});

		layout?.addEventListener("regular-layout-update", (e) => {
			const detail = (e as CustomEvent).detail as { tabs: string[] };
			log.push(`update-${detail.tabs[0]}`);
		});

		const p0 = layout
			?.restore({ type: "tab-layout", tabs: ["BBB"] })
			.then(() => log.push("resolved-BBB"));
		const p1 = layout
			?.restore({ type: "tab-layout", tabs: ["CCC"] })
			.then(() => log.push("resolved-CCC"));
		const p2 = layout
			?.restore({ type: "tab-layout", tabs: ["DDD"] })
			.then(() => log.push("resolved-DDD"));

		await new Promise((r) => setTimeout(r, 20));
		log.push("resume");
		layout?.resumeResize();
		await Promise.all([p0, p1, p2]);
		return { log, presizes };
	});

	const { log, presizes } = result;
	expect(presizes).toBe(2);
	expect(log[0]).toBe("resume");
	expect(log.filter((x) => x.startsWith("update-"))).toStrictEqual([
		"update-BBB",
		"update-CCC",
		"update-DDD",
	]);

	for (const name of ["BBB", "CCC", "DDD"]) {
		expect(log.indexOf(`resolved-${name}`)).toBeGreaterThan(
			log.indexOf(`update-${name}`),
		);
	}
});

test("restoreSync supersedes a parked commit", async ({ page }) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		layout?.addEventListener("regular-layout-before-resize", (e) => {
			e.preventDefault();
		});

		const parked = layout?.insertPanel("BBB", [1]);
		const queued = layout?.insertPanel("CCC", [2]);
		await new Promise((r) => setTimeout(r, 20));
		layout?.restoreSync({ type: "tab-layout", tabs: ["DDD"] });
		layout?.resumeResize();
		await Promise.all([parked, queued]);
		return ["AAA", "BBB", "CCC", "DDD"].filter((name) =>
			layout?.getPanel(name),
		);
	});

	expect(result).toStrictEqual(["DDD"]);
});

test("mutations build on the in-flight tree, not the committed one", async ({
	page,
}) => {
	await setupLayout(page, LAYOUTS.SINGLE_AAA);
	const result = await page.evaluate(async () => {
		const layout = document.querySelector("regular-layout");
		layout?.addEventListener("regular-layout-before-resize", (e) => {
			e.preventDefault();
		});

		const parked = layout?.insertPanel("BBB", [1]);
		await new Promise((r) => setTimeout(r, 20));

		// Still parked - `save()` reports what is on screen.
		const during = ["AAA", "BBB"].filter((name) =>
			layout?.getPanel(name, layout.save()),
		);

		const queued = layout?.removePanel("AAA");
		layout?.resumeResize();
		await new Promise((r) => setTimeout(r, 0));
		layout?.resumeResize();
		await Promise.all([parked, queued]);
		const after = ["AAA", "BBB"].filter((name) => layout?.getPanel(name));
		return { during, after };
	});

	expect(result.during).toStrictEqual(["AAA"]);
	expect(result.after).toStrictEqual(["BBB"]);
});
