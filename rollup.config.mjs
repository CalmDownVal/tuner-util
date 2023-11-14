/* eslint-env node */
/* eslint-disable import/no-default-export */

import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import deleteBeforeBuild from 'rollup-plugin-delete';
import serve from 'rollup-plugin-serve';

const isDev = /^dev/i.test(process.env.ENV ?? '');
const outDir = isDev
	? './build/dev'
	: './build/prod';

const config = {
	input: {
		app: './src/app/index.js',
		worklet: './src/worklet/index.js'
	},
	output: {
		dir: outDir,
		entryFileNames: '[name].min.js',
		format: 'cjs',
		sourcemap: isDev
	},
	plugins: [
		deleteBeforeBuild({
			runOnce: true,
			targets: `${outDir}/*`
		}),
		commonjs(),
		nodeResolve({
			browser: true,
			preferBuiltins: false
		}),
		terser({
			output: {
				comments: false
			}
		})
	]
};

if (/^true$/i.test(process.env.SERVER)) {
	config.plugins.push(
		serve({
			contentBase: [
				outDir,
				'./static'
			],
			host: 'localhost',
			open: true,
			port: 8080
		})
	);
}

export default config;
