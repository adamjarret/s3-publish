import { dirname, resolve as resolvePath, sep } from 'path';
import { fileURLToPath } from 'url';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { LicenseWebpackPlugin } from 'license-webpack-plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = {
  entry: {
    index: resolvePath(__dirname, 'src', 'index.js')
  },
  externals: {
    worker_threads: 'worker_threads'
  },
  output: {
    path: resolvePath(__dirname, 'lib'),
    filename: '[name].js',
    library: {
      type: 'commonjs2'
    }
  },
  plugins: [
    new LicenseWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolvePath(__dirname, '../cli/config'),
          to: resolvePath(__dirname, 'config'),
          filter: async (resourcePath) =>
            resourcePath.includes(`${sep}s3p.config`) && resourcePath.endsWith('.js')
        },
        {
          from: '../cli/README.md',
          to: __dirname,
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

export default config;
