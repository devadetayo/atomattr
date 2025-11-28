export const DICTIONARY = {
    // --- LAYOUT ---
    'display': 'display',
    'flex': 'display:flex', 'grid': 'display:grid', 'block': 'display:block',
    'inline-block': 'display:inline-block', 'hidden': 'display:none',
    'relative': 'position:relative', 'absolute': 'position:absolute',
    'fixed': 'position:fixed', 'sticky': 'position:sticky', 'z': 'z-index',
    'isolation': 'isolation',

    // --- FLEX & GRID ---
    'col': 'flex-direction:column', 'row': 'flex-direction:row',
    'wrap': 'flex-wrap:wrap', 'no-wrap': 'flex-wrap:nowrap',
    'gap': 'gap', 'gap-x': 'column-gap', 'gap-y': 'row-gap',
    'items': 'align-items', 'justify': 'justify-content', 'place': 'place-content',
    'grow': 'flex-grow:1', 'shrink': 'flex-shrink:1', 'order': 'order',
    'basis': 'flex-basis',

    // --- GRID SPECIFIC (Critical for your issue) ---
    'grid-cols': 'grid-template-columns',
    'grid-rows': 'grid-template-rows',
    'col-span': 'grid-column',
    'row-span': 'grid-row',
    'col-start': 'grid-column-start', 'col-end': 'grid-column-end',
    'row-start': 'grid-row-start', 'row-end': 'grid-row-end',

    // ... rest of dictionary (same as before)
    // --- SPACING & POSITIONING ---
    'p': 'padding', 'pt': 'padding-top', 'pb': 'padding-bottom',
    'pl': 'padding-left', 'pr': 'padding-right',
    'px': ['padding-left', 'padding-right'], 'py': ['padding-top', 'padding-bottom'],

    'm': 'margin', 'mt': 'margin-top', 'mb': 'margin-bottom',
    'ml': 'margin-left', 'mr': 'margin-right',
    'mx': ['margin-left', 'margin-right'], 'my': ['margin-top', 'margin-bottom'],

    'top': 'top', 'bottom': 'bottom', 'left': 'left', 'right': 'right',
    'inset': ['top', 'bottom', 'left', 'right'],
    'inset-x': ['left', 'right'], 'inset-y': ['top', 'bottom'],

    // --- SIZING ---
    'w': 'width', 'h': 'height',
    'min-w': 'min-width', 'max-w': 'max-width',
    'min-h': 'min-height', 'max-h': 'max-height',
    'object': 'object-fit', 'object-pos': 'object-position',

    // --- VISUALS ---
    'bg': 'background', // CHANGED from background-color to support gradients
    'color': 'color', 'text': 'color',
    'radius': 'border-radius', 'shadow': 'box-shadow', 'opacity': 'opacity',

    'border': 'border-width', 'border-color': 'border-color', 'border-style': 'border-style',
    'border-t': 'border-top-width', 'border-b': 'border-bottom-width',
    'border-l': 'border-left-width', 'border-r': 'border-right-width',
    'outline': 'outline-width', 'outline-color': 'outline-color',
    'outline-style': 'outline-style', 'outline-offset': 'outline-offset',
    'ring': 'box-shadow',

    // --- TYPOGRAPHY ---
    'size': 'font-size', 'weight': 'font-weight', 'align': 'text-align',
    'leading': 'line-height', 'tracking': 'letter-spacing',
    'family': 'font-family',
    'uppercase': 'text-transform:uppercase', 'lowercase': 'text-transform:lowercase',
    'capitalize': 'text-transform:capitalize',
    'decoration': 'text-decoration', 'decoration-color': 'text-decoration-color',
    'decoration-style': 'text-decoration-style', 'underline-offset': 'text-underline-offset',
    'indent': 'text-indent', 'whitespace': 'white-space', 'break': 'word-break',
    'content': 'content',

    // --- BLEND MODES ---
    'mix-blend': 'mix-blend-mode', 'bg-blend': 'background-blend-mode',

    // --- INTERACTIVITY ---
    'cursor': 'cursor', 'pointer': 'pointer-events', 'select': 'user-select',
    'resize': 'resize', 'appearance': 'appearance',
    'scroll': 'scroll-behavior', 'overscroll': 'overscroll-behavior',

    // --- EFFECT & OVERFLOW ---
    'overflow': 'overflow', 'overflow-x': 'overflow-x', 'overflow-y': 'overflow-y',
    'clip': 'overflow:hidden',
    'visible': 'visibility',

    // --- ANIMATION ---
    'transition': 'transition-property',
    'duration': 'transition-duration',
    'timing': 'transition-timing-function',
    'delay': 'transition-delay',
    'animate': 'animation',

    // --- FILTERS ---
    'filter': 'filter', 'backdrop': 'backdrop-filter',

    // --- SVG ---
    'fill': 'fill', 'stroke': 'stroke', 'stroke-w': 'stroke-width',

    // --- TRANSFORMS ---
    'scale': '--aa-scale: scale',
    'rotate': '--aa-rotate: rotate',
    'translate-x': '--aa-x: translateX',
    'translate-y': '--aa-y: translateY',
    'skew-x': '--aa-skew-x: skewX',
    'skew-y': '--aa-skew-y: skewY',
    'origin': 'transform-origin'
};