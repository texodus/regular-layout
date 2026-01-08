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

import { GRID_TRACK_COLLAPSE_TOLERANCE } from "./constants.ts";
import type { Layout } from "./layout_config.ts";
import { remove_child } from "./remove_child.ts";

interface GridCell {
	child: string;
	colStart: number;
	colEnd: number;
	rowStart: number;
	rowEnd: number;
}

function dedupePositions(positions: number[]): number[] {
	if (positions.length === 0) {
		return [];
	}

	const sorted = positions.sort((a, b) => a - b);
	const result = [sorted[0]];
	for (let i = 1; i < sorted.length; i++) {
		if (
			Math.abs(sorted[i] - result[result.length - 1]) >
			GRID_TRACK_COLLAPSE_TOLERANCE
		) {
			result.push(sorted[i]);
		}
	}

	return result;
}

function collectTrackPositions(
	panel: Layout,
	orientation: "horizontal" | "vertical",
	start: number,
	end: number,
): number[] {
	if (panel.type === "child-panel") {
		return [start, end];
	}

	if (panel.orientation === orientation) {
		const positions: number[] = [start, end];
		let current = start;
		for (let i = 0; i < panel.children.length; i++) {
			const size = panel.sizes[i];
			const childPositions = collectTrackPositions(
				panel.children[i],
				orientation,
				current,
				current + size * (end - start),
			);

			positions.push(...childPositions);
			current = current + size * (end - start);
		}

		return dedupePositions(positions);
	} else {
		const allPositions: number[] = [start, end];
		for (const child of panel.children) {
			const childPositions = collectTrackPositions(
				child,
				orientation,
				start,
				end,
			);

			allPositions.push(...childPositions);
		}

		return dedupePositions(allPositions);
	}
}

function findTrackIndex(positions: number[], value: number): number {
	for (let i = 0; i < positions.length; i++) {
		if (Math.abs(positions[i] - value) < GRID_TRACK_COLLAPSE_TOLERANCE) {
			return i;
		}
	}

	throw new Error(`Position ${value} not found in ${positions}`);
}

function buildCells(
	panel: Layout,
	colPositions: number[],
	rowPositions: number[],
	colStart: number,
	colEnd: number,
	rowStart: number,
	rowEnd: number,
): GridCell[] {
	if (panel.type === "child-panel") {
		const selected = panel.selected ?? 0;
		return [
			{
				child: panel.child[selected],
				colStart: findTrackIndex(colPositions, colStart),
				colEnd: findTrackIndex(colPositions, colEnd),
				rowStart: findTrackIndex(rowPositions, rowStart),
				rowEnd: findTrackIndex(rowPositions, rowEnd),
			},
		];
	}

	const cells: GridCell[] = [];
	const { children, sizes, orientation } = panel;
	if (orientation === "horizontal") {
		let current = colStart;
		for (let i = 0; i < children.length; i++) {
			const next = current + sizes[i] * (colEnd - colStart);
			cells.push(
				...buildCells(
					children[i],
					colPositions,
					rowPositions,
					current,
					next,
					rowStart,
					rowEnd,
				),
			);

			current = next;
		}
	} else {
		let current = rowStart;
		for (let i = 0; i < children.length; i++) {
			const next = current + sizes[i] * (rowEnd - rowStart);
			cells.push(
				...buildCells(
					children[i],
					colPositions,
					rowPositions,
					colStart,
					colEnd,
					current,
					next,
				),
			);

			current = next;
		}
	}

	return cells;
}

const host_template = (rowTemplate: string, colTemplate: string) =>
	`:host { display: grid; gap: 0px; grid-template-rows: ${rowTemplate}; grid-template-columns: ${colTemplate}; }`;

const child_template = (slot: string, rowPart: string, colPart: string) =>
	`:host ::slotted([slot=${slot}]) { grid-column: ${colPart}; grid-row: ${rowPart}; }`;

/**
 * Generates CSS Grid styles to render a layout tree.
 * Creates grid-template-rows, grid-template-columns, and positioning rules for
 * all child panels.
 *
 * @param layout - The layout tree to convert to CSS
 * @param round - If true, rounds percentages to whole numbers. Useful for
 * avoiding sub-pixel rendering issues. Defaults to false.
 * @returns CSS string containing :host and ::slotted rules implementing the
 * layout.
 *
 * @example
 * ```typescript
 * const layout = {
 *   type: "split-panel",
 *   orientation: "horizontal",
 *   children: [
 *     { type: "child-panel", child: "sidebar" },
 *     { type: "child-panel", child: "main" }
 *   ],
 *   sizes: [0.25, 0.75]
 * };
 *
 * const css = create_css_grid_layout(layout);
 * // Returns CSS like:
 * // :host { display: grid; grid-template-columns: 25% 75%; ... }
 * // :host ::slotted([slot=sidebar]) { grid-column: 1; grid-row: 1; }
 * // :host ::slotted([slot=main]) { grid-column: 2; grid-row: 1; }
 * ```
 */
export function create_css_grid_layout(
	layout: Layout,
	round: boolean = false,
	overlay?: [string, string],
): string {
	if (overlay) {
		layout = remove_child(layout, overlay[0]);
	}

	if (layout.type === "child-panel") {
		const selected = layout.selected ?? 0;
		return `${host_template("100%", "100%")}\n${child_template(layout.child[selected], "1", "1")}`;
	}

	const colPositions = collectTrackPositions(layout, "horizontal", 0, 1);
	const colSizes: number[] = [];
	for (let i = 0; i < colPositions.length - 1; i++) {
		colSizes.push(colPositions[i + 1] - colPositions[i]);
	}

	const colTemplate = colSizes
		.map((s) => `${round ? Math.round(s * 100) : s * 100}%`)
		.join(" ");

	const rowPositions = collectTrackPositions(layout, "vertical", 0, 1);
	const rowSizes: number[] = [];
	for (let i = 0; i < rowPositions.length - 1; i++) {
		rowSizes.push(rowPositions[i + 1] - rowPositions[i]);
	}

	const rowTemplate = rowSizes
		.map((s) => `${round ? Math.round(s * 100) : s * 100}%`)
		.join(" ");

	const cells = buildCells(layout, colPositions, rowPositions, 0, 1, 0, 1);
	const css = [host_template(rowTemplate, colTemplate)];
	for (const cell of cells) {
		const colPart =
			cell.colEnd - cell.colStart === 1
				? `${cell.colStart + 1}`
				: `${cell.colStart + 1} / ${cell.colEnd + 1}`;
		const rowPart =
			cell.rowEnd - cell.rowStart === 1
				? `${cell.rowStart + 1}`
				: `${cell.rowStart + 1} / ${cell.rowEnd + 1}`;

		css.push(`${child_template(cell.child, rowPart, colPart)}`);
		if (cell.child === overlay?.[1]) {
			css.push(`${child_template(overlay[0], rowPart, colPart)}`);
			css.push(`:host ::slotted([slot=${overlay[0]}]) { z-index: 1; }`);
		}
	}

	return css.join("\n");
}
