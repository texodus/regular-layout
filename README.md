# `<regular-layout>`

[![npm](https://img.shields.io/npm/v/regular-layout.svg?style=for-the-badge)](https://www.npmjs.com/package/regular-layout)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/regular-layout?style=for-the-badge)](https://bundlephobia.com/package/regular-layout)
[![Build Status](https://img.shields.io/github/actions/workflow/status/texodus/regular-layout/build.yaml?event=push&style=for-the-badge)](https://github.com/texodus/regular-layout/actions/workflows/build.yaml)

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