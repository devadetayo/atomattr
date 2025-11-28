export const BREAKPOINTS = {
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px'
};

export const PSEUDO_STATES = [
    'hover', 'focus', 'active', 'disabled', 'checked', 'visited', 'group-hover', 'focus-within'
];

export const VAR_PREFIXES = {
    'p': '--s-', 'pt': '--s-', 'pb': '--s-', 'pl': '--s-', 'pr': '--s-', 'px': '--s-', 'py': '--s-',
    'm': '--s-', 'mt': '--s-', 'mb': '--s-', 'ml': '--s-', 'mr': '--s-', 'mx': '--s-', 'my': '--s-',
    'gap': '--s-', 'gap-x': '--s-', 'gap-y': '--s-',
    'w': '--s-', 'h': '--s-',
    'min-w': '--s-', 'max-w': '--s-', 'min-h': '--s-', 'max-h': '--s-',
    'bg': '--', 'text': '--', 'color': '--',
    'border-color': '--', 'outline-color': '--', 'decoration-color': '--',
    'shadow': '--shadow-',
    'radius': '--radius-',
    'family': '--font-' // Added font family support
};

export const VALUE_ALIASES = {
    'fit': 'fit-content',
    'min': 'min-content',
    'max': 'max-content',
    'full': '100%',
    'screen': '100vh',
    'auto': 'auto',
    'none': 'none',
    'inherit': 'inherit',
    'initial': 'initial',
    'between': 'space-between',
    'around': 'space-around',
    'evenly': 'space-evenly',
    'start': 'flex-start',
    'end': 'flex-end',
    'center': 'center',
    'stretch': 'stretch',
    'baseline': 'baseline',
    'col': 'column',
    'row': 'row'
};

export const DEFAULT_UNIT = 'rem';

export const IGNORED_ATTRS = [
    'class', 'id', 'style', 'src', 'href', 'alt', 'type', 'placeholder', 'name', 'value', 'role', 'aria-label', 'target'
];