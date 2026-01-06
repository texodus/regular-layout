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

import "./dist/index.js";

const add = document.querySelector("#add");
const save = document.querySelector("#save");
const restore = document.querySelector("#restore");
const clear = document.querySelector("#clear");
add.addEventListener("click", () => {
	// Note: this *demo* implementation leaks `div` elements, because they
	// are not removed from the light DOM by `clear` or `restore`. You must
	// handle the lifecycle of the light DOM objects yourself!
	const chars = "abcdefghijklmnopqrstuvwxyz";
	let name = "";
	for (let i = 0; i < 8; i++) {
		name += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	const COLORS = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF"];
	const elem = document.createElement("regular-layout-frame");
	elem.setAttribute("slot", name);
	elem.classList.add(COLORS[Math.floor(COLORS.length * Math.random())]);
	layout.appendChild(elem);
	layout.insertPanel(name, []);
});

const req = await fetch("./layout.json");
let state = await req.json();

const layout = document.querySelector("regular-layout");
layout.restore(state);
save.addEventListener("click", () => {
	state = layout.save();
});

restore.addEventListener("click", () => {
	if (state) {
		layout.restore(state);
	}
});

clear.addEventListener("click", () => {
	layout.clear();
});
