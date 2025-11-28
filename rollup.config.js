// NOTICE THE CHANGE HERE: using '@rollup/plugin-terser'
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/atomattr.min.js',
        format: 'iife',
        name: 'AtomAttr',
        sourcemap: false,
    },
    plugins: [
        resolve(),
        commonjs(),
        terser() // No arguments needed for default minification
    ]
};