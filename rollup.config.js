import typescript from '@rollup/plugin-typescript'
export default {
    input: './src/index.ts',
    output: [
        // 1. cjs -> commonjs
        // 2. esm -> es-module
        {
            format: 'cjs',
            file: 'lib/guide-mini-vue3.cjs.js'
        },
        {
            format: 'es',
            file: 'lib/guide-mini-vue3.esm.js'
        }
    ],
    // 使用插件处理ts
    plugins: [typescript()]
}
