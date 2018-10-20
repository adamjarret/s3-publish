const path = require('path');
const {LicenseWebpackPlugin} = require('license-webpack-plugin');

const SRC_DIR = path.resolve(__dirname, 'src');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'vendor');

module.exports = {
    entry: {
        'aws-sdk': path.resolve(SRC_DIR, 'aws-sdk.js'),
        'lodash': path.resolve(SRC_DIR, 'lodash.js')
    },
    output: {
        path: OUT_DIR,
        filename: '[name].js',
        libraryTarget: 'commonjs2'
    },
    plugins: [
        new LicenseWebpackPlugin()
    ],
    target: 'node'
};