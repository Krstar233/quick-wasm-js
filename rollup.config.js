import npm from 'rollup-plugin-node-resolve';
import typescript from "rollup-plugin-typescript2";
import workerLoader from 'rollup-plugin-web-worker-loader';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

export default [{
    input: "src/index.ts",
    output:{
        file: "dist/index.js",
        name: "QuickWasmJS",
        format: 'umd',
    },
    plugins:[
        workerLoader({
            inline: true,
            targetPlatform: 'browser'
        }),
        resolve({
            extensions: [
                '.js', '.jsx', '.ts', '.tsx',
            ],
            browser: true
        }),
        npm(),
        commonjs({
            namedExports: {
                'chai': ['expect'],
                'quick-wasm-js': ['QuickWebAssemblyFactory'],
                "simp-spec": ["it", "spec", "runTests", "beforeAll", "afterAll", "beforeEach", "afterEach"]
            }
        }),
        typescript({ typescript: require('typescript')}),
    ]
}]