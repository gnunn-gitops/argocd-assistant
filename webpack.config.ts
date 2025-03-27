/* eslint-env node */

import { Configuration as WebpackConfiguration } from "webpack";
import * as path from "path";

const extName = "lightspeed";

const config: WebpackConfiguration = {
    mode: "development",
    entry: {
        extension: './src/index.tsx',
    },
    output: {
        filename: `extensions-${extName}.js`,
        path: __dirname + `/dist/resources/extensions-${extName}`,
        libraryTarget: 'window',
        library: ['extensions', 'resources'],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.ttf', '.scss']
    },
    externals: {
        react: 'React',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    allowTsInNodeModules: true,
                    configFile: path.resolve('./tsconfig.json')
                },
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'raw-loader', 'sass-loader'],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};

if (process.env.NODE_ENV === "production") {
    config.mode = "production";
    if (config.output) {
        config.output.filename = '[name]-bundle-[hash].min.js';
        config.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
    }
    if (config.optimization) {
        config.optimization.chunkIds = 'deterministic';
        config.optimization.minimize = true;
    }
    config.devtool = false;
}

export default config;
