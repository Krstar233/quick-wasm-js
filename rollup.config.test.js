import { liveServer } from 'rollup-plugin-live-server';
import requireContext from 'rollup-plugin-require-context';
import DefaultConfig from "./rollup.config";
import cleanup from 'rollup-plugin-cleanup';

const config = DefaultConfig[0];

config.input = "test/index.ts"
config.output = {
    ...config.output,
    file: "test/assets/test_build_cache/index.js",
    format: 'umd',
    sourcemap: false
}
config.plugins = [
    ...config.plugins,
    requireContext(),
    cleanup(),
    liveServer({
        port: 8090,
        host: '0.0.0.0',
        root: 'test',
        file: 'index.html',
        open: true
    })
];

export default [config];