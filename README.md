# s3-publish

This repository is a monorepo for the [s3-publish](https://adamjarret.github.io/s3-publish) project.

## Packages

- ### [`@s3-publish/cli`](https://github.com/adamjarret/s3-publish/tree/master/packages/cli)

- ### [`@s3-publish/core`](https://github.com/adamjarret/s3-publish/tree/master/packages/core)

- ### [`@s3-publish/loggers`](https://github.com/adamjarret/s3-publish/tree/master/packages/loggers)

- ### [`@s3-publish/provider-fs`](https://github.com/adamjarret/s3-publish/tree/master/packages/provider-fs)

- ### [`@s3-publish/provider-s3`](https://github.com/adamjarret/s3-publish/tree/master/packages/provider-s3)

- ### [`s3-publish`](https://github.com/adamjarret/s3-publish/tree/master/packages/meta)

## Getting Started

See [Getting Started](https://adamjarret.github.io/s3-publish/pages/guides/getting-started.html)

## Documentation

- [API](https://adamjarret.github.io/s3-publish/globals.html)
- [CLI](https://adamjarret.github.io/s3-publish/pages/cli/s3p.html)

## Development

### Requirements

- [git](https://www.git-scm.com)
- [node](https://nodejs.org/) 10.17+
- [yarn](https://yarnpkg.com) (this project uses yarn workspaces)

### Setup

    git clone --recursive https://github.com/adamjarret/s3-publish.git
    cd s3-publish
    yarn install

    # docs
    cd docs-src/theme
    npm install

The [yarn workspaces](https://legacy.yarnpkg.com/en/docs/workspaces/) configuration causes the `yarn install` command to install all dependencies for all packages and the workspace itself.

If you use [VS Code](https://code.visualstudio.com), see **.vscode/settings.sample.json** for recommended project settings.

### Build

    yarn build

or

    yarn build -w

to watch for changes and rebuild automatically when source files are saved.

### Run Tests

    yarn test

or

    yarn test --watchAll

to watch for changes and re-run tests automatically.

See the package script definition below for additional options.

## Package Scripts

### `yarn all`

Runs all the scripts required to format, check, build and package the module.

### `yarn fix`

Runs all the scripts required to format and check the module.

### `yarn lint`

Runs `eslint` (see [eslint](https://eslint.org)) on all javascript and typescript files not ignored in the **.eslintignore** file.

See **.eslintrc.js** for configuration.

### `yarn pretty`

Runs `prettier` (see [prettier](https://prettier.io)) to check source code file format. Files with the extensions **ts**, **js**, **json** or **md** that are not ignored in the **.eslintignore** file are processed.

See **.prettierrc.js** for configuration.

### `yarn spell`

Runs `cspell` (see [cspell](https://www.npmjs.com/package/cspell)) to spell-check source code files.

See **.vscode/cSpell.json** for configuration.

Note: This configuration path is used so the settings can also be honored by the [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) plugin for VS Code.

### `yarn build`

Runs `tsc` to build each package as a commonjs module (with types) to the corresponding **lib/** directory.

Use `-w` flag to watch for changes and rebuild automatically when source files are saved.

See **tsconfig.json** and **tsconfig.settings.json** for configuration.

### `yarn clean`

Deletes generated output:

- **docs**
- package **lib** directories
- **tsconfig.tsbuildinfo** files

### `yarn clean-docs`

Deletes generated **docs** folder.

### `yarn docs`

Runs `typedoc` to generate the API documentation and output it to the **docs/** directory.

See **typedoc.json** for configuration.

### `yarn serve`

Serves the **docs** directory locally.

See **serve.json** for configuration.

### `yarn theme`

Builds typedoc theme.

See **docs-src/README.md** for details.

### `yarn ncu`

Runs `ncu` in each workspace package directory (using [lerna](http://lerna.js.org)) to check for dependency updates.

Use `-u` flag to update version numbers in all **package.json** files.

Any additional arguments will be passed to the `ncu` command for each package. See [npm-check-updates](https://github.com/tjunnone/npm-check-updates) for available options.

Note: `yarn ncu` does not check for updates to dependencies of the workspace itself. To check for these as well, use `npx` to run `ncu`:

    # Check dependencies in all package.json files
    npx ncu && yarn ncu

    # Update versions in all package.json files
    npx ncu -u && yarn ncu -u

### `yarn bundle`

Bundles the **meta** package with webpack.

See **packages/meta/webpack.config.js** for configuration.

### `yarn pak`

Runs `npm pack` in each workspace directory (using [lerna](http://lerna.js.org)) to output the packages as individual .tgz archives.

### `yarn test`

Runs all unit tests with `jest`.

Use `-o` flag to only run tests related to files that have changed in git.

Use `--watch` (implies `-o`) or `--watchAll` flags to watch for changes and re-run tests automatically.

See **jest.config.js** for configuration and [jest docs](https://jestjs.io/docs/en/cli.html) for additional CLI options.

### `yarn cover`

Same as `yarn test` but also collects and outputs test coverage information.

### `yarn spec`

Same as `yarn cover` but also runs **\*.spec.ts** tests (which test S3 integration with a live backend).

## License

[MIT](https://github.com/adamjarret/s3-publish/tree/master/LICENSE.txt)

## Author

[Adam Jarret](https://atj.me)
