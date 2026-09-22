<div align="center">
<img src="./assets/images/logo.png" alt="AtomAttr Logo" width="120" height="120">

<h1>AtomAttr</h1>

<p><strong>The Runtime CSS Engine. Atomic styling at the speed of light.</strong></p>

<p>
<a href="https://www.google.com/search?q=https://www.npmjs.com/package/atomattr">
<img src="https://www.google.com/search?q=https://img.shields.io/npm/v/atomattr%3Fstyle%3Dflat-square%26color%3D8b5cf6" alt="NPM Version" />
</a>
<a href="https://www.google.com/search?q=https://github.com/devadetayo/atomattr/blob/main/LICENSE">
<img src="https://www.google.com/search?q=https://img.shields.io/npm/l/atomattr%3Fstyle%3Dflat-square%26color%3D3b82f6" alt="License" />
</a>
<img src="https://www.google.com/search?q=https://img.shields.io/bundlephobia/minzip/atomattr%3Fstyle%3Dflat-square%26color%3Dec4899" alt="Size" />
</p>

<h3>
<a href="https://www.google.com/search?q=https://devadetayo.github.io/atomattr/">Website</a>
<span> | </span>
<a href="https://www.google.com/search?q=https://devadetayo.github.io/atomattr/docs.html">Documentation</a>
<span> | </span>
<a href="https://www.google.com/search?q=https://devadetayo.github.io/atomattr/playground.html">Playground</a>
</h3>
</div>

AtomAttr is a zero-config, runtime CSS engine. It scans your HTML for utility attributes and compiles optimized CSS instantly in the browser.

No Build Step: Forget Webpack, PostCSS, and config files.

No Context Switching: Style directly in your markup.

Tiny Footprint: The engine is lightweight (<10kb) and fast.

🚀 Quick Start

Method 1: CDN (Zero Setup)

Add these two lines to your <head>. Perfect for prototyping, static sites, and legacy apps.

<!-- 1. Base Styles (Variables & Reset) -->
<link rel="stylesheet" href="[https://unpkg.com/atomattr/dist/defaults.css](https://unpkg.com/atomattr/dist/defaults.css)">

<!-- 2. The Engine -->
<script src="[https://unpkg.com/atomattr/dist/atomattr.min.js](https://unpkg.com/atomattr/dist/atomattr.min.js)" defer></script>


Method 2: NPM

npm install atomattr


⚡ Usage

AtomAttr uses Attributes instead of classes. The syntax is [modifier]-[property]="[value]".

<!-- Layout & Spacing -->
<div flex col gap="4" p="8" bg="surface">
    
    <!-- Typography & Colors -->
    <h1 size="2rem" weight="800" text="primary">Hello World</h1>
    
    <!-- Responsiveness (md-, lg-) -->
    <div w="full" md-w="50%" bg="surface-alt" p="4" radius="md">
        Responsive Card
    </div>

    <!-- States (hover-, focus-) -->
    <button bg="primary" text="white" px="6" py="2" radius="lg" 
            hover-bg="accent" hover-scale="105" transition="all">
        Hover Me
    </button>

</div>


🎨 Customization

AtomAttr is built on CSS Variables. To customize your theme, simply override the variables in your own stylesheet. No JavaScript configuration is required.

:root {
    /* Brand Colors */
    --primary: #6366f1;
    --surface: #ffffff;
    
    /* Custom Spacing */
    --s-4: 1rem; /* used by p="4" */
}


📦 Features

Runtime Engine: Observes the DOM and generates CSS on the fly.

Attribute Syntax: Cleaner markup (p="4" vs class="p-4").

Responsive: Mobile-first breakpoint support (sm-, md-, lg-, xl-).

Stateful: Built-in interaction modifiers (hover-, focus-, active-, group-hover-).

Dark Mode: Native support via html.dark class and dark- attributes.

Transforms: Automatic composition for scale, rotate, and translate.

📄 License

MIT © Quanta Labs