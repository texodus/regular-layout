<br />
<a href="https://perspective-dev.github.io">
<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="./logo.svg">
<img width="260" src="./logo.svg">
</picture>
<br/>
<br/>
<a href="https://www.npmjs.com/package/regular-table"><img alt="NPM Version" src="https://img.shields.io/github/actions/workflow/status/texodus/regular-layout/build.yaml?event=push&style=flat-square"></a>
<a href="https://www.npmjs.com/package/regular-table"><img alt="NPM Version" src="https://img.shields.io/npm/v/regular-layout.svg?color=brightgreen&style=flat-square"></a>
<a href="https://www.npmjs.com/package/regular-table"><img alt="Bundlephobia (Minified)" src="https://img.shields.io/bundlephobia/min/regular-layout?style=flat-square"></a>
<!-- <a href="https://www.npmjs.com/package/regular-table"><img alt="Bundlephobia (Minzipped)" src="https://img.shields.io/bundlephobia/minzip/regular-layout?style=flat-square"></a> -->
<br/>
<br/>
</p>



A library for resizable & repositionable panel layouts, using
[CSS `grid`](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout).

- Zero depedencies, pure TypeScript, tiny.
- Implemented as a [Web Component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components),
  interoperable with any framework and fully customizable.
- Covered in bees.

## Installation

```bash
npm install regular-layout
```

## Usage

Add the `<regular-layout>` custom element to your HTML:

```html
<regular-layout>
    <div slot="main">Main content</div>
    <div slot="sidebar">Sidebar content</div>
</regular-layout>
```

Create and manipulate layouts programmatically:

```javascript
import "regular-layout/dist/index.js";

const layout = document.querySelector('regular-layout');

// Add panels
layout.insertPanel('main');
layout.insertPanel('sidebar');

// Save layout state
const state = layout.save();

// Remove panels (this does not change the DOM, the element is unslotted).
layout.removePanel('sidebar');

// Restore saved state
layout.restore(state);
```

Create repositionable panels using `<regular-layout-frame>`:

```html
<regular-layout>
    <regular-layout-frame slot="main">
        Main content
    </regular-layout-frame>
</regular-layout>
```