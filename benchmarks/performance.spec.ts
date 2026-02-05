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

import { test } from "@playwright/test";
import type { CDPSession } from "@playwright/test";
import {
	setupLayout,
	restoreLayout,
	dragMouse,
	getLayoutBounds,
} from "../tests/helpers/integration.ts";
import type { Layout, SplitLayout, TabLayout } from "../src/layout/types.ts";

interface PerformanceMetrics {
	ProcessTime: number;
	JSHeapUsedSize: number;
	Documents: number;
	Frames: number;
	LayoutCount: number;
	LayoutDuration: number;
	RecalcStyleCount: number;
	RecalcStyleDuration: number;
	ScriptDuration: number;
	TaskDuration: number;
}

interface PerformanceStats {
	testName: string;
	iterations: number;
	durationMs: number;
	startMetrics: PerformanceMetrics;
	endMetrics: PerformanceMetrics;
	deltaMetrics: Partial<PerformanceMetrics>;
	operationsPerSecond: number;
}

function generateLargeLayout(depth: number, panelsPerLevel: number): Layout {
	let panelCounter = 0;
	function generatePanel(): TabLayout {
		const name = `Panel${panelCounter++}`;
		return {
			type: "child-panel",
			tabs: [name],
		};
	}

	function generateSplit(
		currentDepth: number,
		orientation: "horizontal" | "vertical",
	): Layout {
		if (currentDepth === 0) {
			return generatePanel();
		}

		const children: Layout[] = [];
		const sizes: number[] = [];
		const nextOrientation =
			orientation === "horizontal" ? "vertical" : "horizontal";

		for (let i = 0; i < panelsPerLevel; i++) {
			children.push(generateSplit(currentDepth - 1, nextOrientation));
			sizes.push(1 / panelsPerLevel);
		}

		return {
			type: "split-panel",
			orientation,
			children,
			sizes,
		} as SplitLayout;
	}

	return generateSplit(depth, "horizontal");
}

function countPanels(layout: Layout): number {
	if (layout.type === "child-panel") {
		return 1;
	}
	return layout.children.reduce((sum, child) => sum + countPanels(child), 0);
}

function getPanelNames(layout: Layout): string[] {
	if (layout.type === "child-panel") {
		return layout.tabs;
	}
	return layout.children.flatMap((child) => getPanelNames(child));
}

async function getMetrics(cdp: CDPSession): Promise<PerformanceMetrics> {
	const { metrics } = await cdp.send("Performance.getMetrics");
	const result: Record<string, number> = {};
	for (const metric of metrics) {
		result[metric.name] = metric.value;
	}
	return result as unknown as PerformanceMetrics;
}

function calculateDelta(
	start: PerformanceMetrics,
	end: PerformanceMetrics,
): Partial<PerformanceMetrics> {
	return {
		ProcessTime: end.ProcessTime - start.ProcessTime,
		LayoutCount: end.LayoutCount - start.LayoutCount,
		LayoutDuration: end.LayoutDuration - start.LayoutDuration,
		RecalcStyleCount: end.RecalcStyleCount - start.RecalcStyleCount,
		RecalcStyleDuration: end.RecalcStyleDuration - start.RecalcStyleDuration,
		ScriptDuration: end.ScriptDuration - start.ScriptDuration,
		TaskDuration: end.TaskDuration - start.TaskDuration,
	};
}

function printStats(stats: PerformanceStats): void {
	const d = stats.deltaMetrics;
	const scriptMs = ((d.ScriptDuration ?? 0) * 1000).toFixed(1);
	const layoutMs = ((d.LayoutDuration ?? 0) * 1000).toFixed(1);
	const styleMs = ((d.RecalcStyleDuration ?? 0) * 1000).toFixed(1);
	const taskMs = ((d.TaskDuration ?? 0) * 1000).toFixed(1);
	console.log(
		`\n[${stats.testName}]` +
			`\n${stats.iterations} ops in ${stats.durationMs.toFixed(0)}ms ` +
			`(${stats.operationsPerSecond.toFixed(1)} ops/s)` +
			`\nScript: ${scriptMs}ms` +
			`\nLayout: ${layoutMs}ms (${d.LayoutCount}x)` +
			`\nStyle: ${styleMs}ms (${d.RecalcStyleCount}x)` +
			`\nTask: ${taskMs}ms\n`,
	);
}

const PERF_CONFIG = {
	layoutDepth: 4,
	panelsPerLevel: 2,
	resizeIterations: 100,
	dragDropIterations: 100,
	operationDelayMs: 0,
};

test.describe("Performance Tests", () => {
	test.skip("drag resize performance with large layout", async ({ page }) => {
		const largeLayout = generateLargeLayout(
			PERF_CONFIG.layoutDepth,
			PERF_CONFIG.panelsPerLevel,
		);

		const panelCount = countPanels(largeLayout);
		console.log(`\nGenerated layout with ${panelCount} panels`);
		await setupLayout(page);
		await page.evaluate((panelNames: string[]) => {
			const layout = document.querySelector("regular-layout");
			if (!layout) return;
			for (const name of panelNames) {
				const panel = document.createElement("regular-layout-frame");
				panel.setAttribute("name", name);
				panel.textContent = name;
				layout.appendChild(panel);
			}
		}, getPanelNames(largeLayout));

		await restoreLayout(page, largeLayout);
		await page.waitForTimeout(100);
		const bounds = await getLayoutBounds(page);
		const cdp = await page.context().newCDPSession(page);
		await cdp.send("Performance.enable");
		const startMetrics = await getMetrics(cdp);
		const startTime = performance.now();
		for (let i = 0; i < PERF_CONFIG.resizeIterations; i++) {
			const startX = bounds.x + bounds.width * (0.3 + (i % 5) * 0.1);
			const startY = bounds.y + bounds.height * (0.3 + (i % 4) * 0.1);
			const deltaX = i % 2 === 0 ? (i % 10) - 5 : 0;
			const deltaY = i % 2 === 1 ? (i % 10) - 5 : 0;
			await dragMouse(
				page,
				startX,
				startY,
				startX + deltaX * 10,
				startY + deltaY * 10,
			);

			if (PERF_CONFIG.operationDelayMs > 0) {
				await page.waitForTimeout(PERF_CONFIG.operationDelayMs);
			}
		}

		const endTime = performance.now();
		const endMetrics = await getMetrics(cdp);
		const stats: PerformanceStats = {
			testName: `Drag Resize (${panelCount} panels)`,
			iterations: PERF_CONFIG.resizeIterations,
			durationMs: endTime - startTime,
			startMetrics,
			endMetrics,
			deltaMetrics: calculateDelta(startMetrics, endMetrics),
			operationsPerSecond:
				(PERF_CONFIG.resizeIterations / (endTime - startTime)) * 1000,
		};

		printStats(stats);
		await cdp.detach();
	});

	test("drag-drop move performance with large layout", async ({ page }) => {
		const largeLayout = generateLargeLayout(
			PERF_CONFIG.layoutDepth,
			PERF_CONFIG.panelsPerLevel,
		);

		const panelCount = countPanels(largeLayout);
		const panelNames = getPanelNames(largeLayout);
		console.log(`\nGenerated layout with ${panelCount} panels`);
		await setupLayout(page);
		await page.evaluate((names: string[]) => {
			const layout = document.querySelector("regular-layout");
			if (!layout) return;
			for (const name of names) {
				const panel = document.createElement("regular-layout-frame");
				panel.setAttribute("name", name);
				panel.textContent = name;
				layout.appendChild(panel);
			}
		}, panelNames);

		await restoreLayout(page, largeLayout);
		await page.waitForTimeout(100);
		const bounds = await getLayoutBounds(page);
		const cdp = await page.context().newCDPSession(page);
		await cdp.send("Performance.enable");
		const startMetrics = await getMetrics(cdp);
		const startTime = performance.now();
		for (let i = 0; i < PERF_CONFIG.dragDropIterations; i++) {
			const sourceX = bounds.x + bounds.width * (0.2 + (i % 6) * 0.1);
			const sourceY = bounds.y + bounds.height * (0.2 + (i % 5) * 0.12);
			const targetX = bounds.x + bounds.width * (0.8 - (i % 6) * 0.1);
			const targetY = bounds.y + bounds.height * (0.8 - (i % 5) * 0.12);
			await page.evaluate(
				({ sx, sy, tx, ty }) => {
					const layout = document.querySelector("regular-layout");
					if (!layout) return;
					const sourcePath = layout.calculateIntersect({
						clientX: sx,
						clientY: sy,
					});

					if (!sourcePath) return;
					layout.setOverlayState(
						{ clientX: tx, clientY: ty },
						sourcePath,
						"overlay",
						"absolute",
					);

					const targetPath = layout.calculateIntersect({
						clientX: tx,
						clientY: ty,
					});

					if (!targetPath) {
						layout.clearOverlayState(null, sourcePath, "overlay");
						return;
					}

					layout.clearOverlayState(
						{ clientX: tx, clientY: ty },
						sourcePath,
						"overlay",
					);
				},
				{ sx: sourceX, sy: sourceY, tx: targetX, ty: targetY },
			);

			if (PERF_CONFIG.operationDelayMs > 0) {
				await page.waitForTimeout(PERF_CONFIG.operationDelayMs);
			}
		}

		const endTime = performance.now();
		const endMetrics = await getMetrics(cdp);
		const stats: PerformanceStats = {
			testName: `Drag-Drop Move (${panelCount} panels)`,
			iterations: PERF_CONFIG.dragDropIterations,
			durationMs: endTime - startTime,
			startMetrics,
			endMetrics,
			deltaMetrics: calculateDelta(startMetrics, endMetrics),
			operationsPerSecond:
				(PERF_CONFIG.dragDropIterations / (endTime - startTime)) * 1000,
		};

		printStats(stats);
		await cdp.detach();
	});
});
