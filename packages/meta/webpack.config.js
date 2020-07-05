const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;

const README_PATH = __dirname;
const OUT_PATH = path.resolve(__dirname, 'lib');
const CONFIG_PATH = path.resolve(__dirname, 'config');

module.exports = {
  entry: {
    index: path.resolve(__dirname, 'src', 'index.js')
  },
  externals: {
    worker_threads: 'worker_threads'
  },
  output: {
    path: OUT_PATH,
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'commonjs2'
  },
  plugins: [
    new LicenseWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: '../cli/config/s3p.config*.js',
          to: CONFIG_PATH,
          flatten: true
        },
        {
          from: '../cli/README.md',
          to: README_PATH,
          flatten: true,
          transform: (content) => {
            const msg =
              '`s3-publish` is a meta package that includes [`@s3-publish/cli`](https://github.com/adamjarret/s3-publish/tree/master/packages/cli) and all dependencies bundled with webpack.';
            const text = content
              .toString()
              .replace(/@s3-publish\/cli/g, 's3-publish')
              .replace('s3-publish/tree/master/packages/cli', 's3-publish')
              .replace('## Features', `> ${msg}\n\n## Features`);
            return Buffer.from(text);
          }
        }
      ]
    })
  ],
  target: 'node'
};
