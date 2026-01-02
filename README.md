# `<regular-layout>`

A library for resizable panel layouts using CSS `grid`.

- 7kb, zero dependencies
- Web Component
- 

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