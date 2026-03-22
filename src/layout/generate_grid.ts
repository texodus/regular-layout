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

import { DEFAULT_PHYSICS, type Physics } from "../core/constants.ts";
import type { Layout } from "../core/types.ts";

interface GridCell {
	child: string;
	colStart: number;
	colEnd: number;
	rowStart: number;
	rowEnd: number;
}

function dedupe_sort(physics: Physics, result: number[], pos: number) {
	if (
		result.length === 0 ||
		Math.abs(pos - result[result.length - 1]) >
			physics.GRID_TRACK_COLLAPSE_TOLERANCE
	) {
		result.push(pos);
	}

	return result;
}

function dedupe_positions(physics: Physics, positions: number[]): number[] {
	const sorted = positions.sort((a, b) => a - b);
	return sorted.reduce(dedupe_sort.bind(undefined, physics), []);
}

function collect_track_positions(
	panel: Layout,
	orientation: "horizontal" | "vertical",
	start: number,
	end: number,
	physics: Physics,
): number[] {
	if (panel.type === "tab-layout") {
		return [start, end];
	}

	const positions: number[] = [start, end];
	if (panel.orientation === orientation) {
		let current = start;
		const range = end - start;
		for (let i = 0; i < panel.children.length; i++) {
			const size = panel.sizes[i];
			const next = current + size * range;
			positions.push(
				...collect_track_positions(
					panel.children[i],
					orientation,
					current,
					next,
					physics,
				),
			);

			current = next;
		}
	} else {
		for (const child of panel.children) {
			positions.push(
				...collect_track_positions(child, orientation, start, end, physics),
			);
		}
	}

	return dedupe_positions(physics, positions);
}

function find_track_index(
	physics: Physics,
	positions: number[],
	value: number,
): number {
	const index = positions.findIndex(
		(pos) => Math.abs(pos - value) < physics.GRID_TRACK_COLLAPSE_TOLERANCE,
	);

	return index === -1 ? 0 : index;
}

function build_cells(
	panel: Layout,
	colPositions: number[],
	rowPositions: number[],
	colStart: number,
	colEnd: number,
	rowStart: number,
	rowEnd: number,
	physics: Physics,
): GridCell[] {
	if (panel.type === "tab-layout") {
		const selected = panel.selected ?? 0;
		return [
			{
				child: panel.tabs[selected],
				colStart: find_track_index(physics, colPositions, colStart),
				colEnd: find_track_index(physics, colPositions, colEnd),
				rowStart: find_track_index(physics, rowPositions, rowStart),
				rowEnd: find_track_index(physics, rowPositions, rowEnd),
			},
		];
	}

	const { children, sizes, orientation } = panel;
	const isHorizontal = orientation === "horizontal";
	let current = isHorizontal ? colStart : rowStart;
	const range = isHorizontal ? colEnd - colStart : rowEnd - rowStart;
	const cells: GridCell[] = [];
	for (let i = 0; i < children.length; i++) {
		const next = current + sizes[i] * range;
		if (isHorizontal) {
			cells.push(
				...build_cells(
					children[i],
					colPositions,
					rowPositions,
					current,
					next,
					rowStart,
					rowEnd,
					physics,
				),
			);
		} else {
			cells.push(
				...build_cells(
					children[i],
					colPositions,
					rowPositions,
					colStart,
					colEnd,
					current,
					next,
					physics,
				),
			);
		}

		current = next;
	}

	return cells;
}

const host_template = (rowTemplate: string, colTemplate: string) =>
	`:host ::slotted(*){display:none}:host{display:grid;grid-template-rows:${rowTemplate};grid-template-columns:${colTemplate}}`;

const child_template = (
	physics: Physics,
	slot: string,
	rowPart: string,
	colPart: string,
) =>
	`:host ::slotted([${physics.CHILD_ATTRIBUTE_NAME}="${slot}"]){display:flex;grid-column:${colPart};grid-row:${rowPart}}`;

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
 *   type: "split-layout",
 *   orientation: "horizontal",
 *   children: [
 *     { type: "tab-layout", tabs: "sidebar" },
 *     { type: "tab-layout", tabs: "main" }
 *   ],
 *   sizes: [0.25, 0.75]
 * };
 *
 * const css = create_css_grid_layout(layout);
 * // Returns CSS like:
 * // :host { display: grid; grid-template-columns: 25% 75%; ... }
 * // :host ::slotted([name=sidebar]) { grid-column: 1; grid-row: 1; }
 * // :host ::slotted([name=main]) { grid-column: 2; grid-row: 1; }
 * ```
 */
export function create_css_grid_layout(
	layout: Layout,
	overlay?: [string, string],
	physics: Physics = DEFAULT_PHYSICS,
): string {
	if (layout.type === "tab-layout") {
		const selected = layout.selected ?? 0;
		return [
			host_template("100%", "100%"),
			child_template(physics, layout.tabs[selected], "1", "1"),
		].join("\n");
	}

	const createTemplate = (positions: number[]) => {
		const sizes = positions
			.slice(0, -1)
			.map((pos, i) => positions[i + 1] - pos);
		return sizes
			.map((s) => `${physics.SHOULD_ROUND ? Math.round(s * 100) : s * 100}fr`)
			.join(" ");
	};

	const colPositions = collect_track_positions(
		layout,
		"horizontal",
		0,
		1,
		physics,
	);

	const colTemplate = createTemplate(colPositions);
	const rowPositions = collect_track_positions(
		layout,
		"vertical",
		0,
		1,
		physics,
	);

	const rowTemplate = createTemplate(rowPositions);
	const formatGridLine = (start: number, end: number) =>
		end - start === 1 ? `${start + 1}` : `${start + 1} / ${end + 1}`;

	const cells = build_cells(
		layout,
		colPositions,
		rowPositions,
		0,
		1,
		0,
		1,
		physics,
	);

	const css = [host_template(rowTemplate, colTemplate)];
	for (const cell of cells) {
		const colPart = formatGridLine(cell.colStart, cell.colEnd);
		const rowPart = formatGridLine(cell.rowStart, cell.rowEnd);
		css.push(child_template(physics, cell.child, rowPart, colPart));
		if (cell.child === overlay?.[1]) {
			css.push(child_template(physics, overlay[0], rowPart, colPart));
			css.push(
				`:host ::slotted([${physics.CHILD_ATTRIBUTE_NAME}=${overlay[0]}]){z-index:1}`,
			);
		}
	}

	return css.join("\n");
}
