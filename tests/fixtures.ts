import type { Layout } from "../src/common/layout_config.ts";

export const TEST_PANEL: Layout = {
	type: "split-panel",
	children: [
		{
			type: "split-panel",
			children: [
				{
					type: "child-panel",
					child: ["AAA"],
				},
				{
					type: "child-panel",
					child: ["BBB"],
				},
			],
			sizes: [0.3, 0.7],
			orientation: "vertical",
		},
		{
			type: "child-panel",
			child: ["CCC"],
		},
	],
	sizes: [0.6, 0.4],
	orientation: "horizontal",
};
