# s3-publish Documentation

The s3-publish website is generated with [typedoc](https://typedoc.org) and hosted on GitHub pages.

It makes use of a number of typedoc plugins and a [fork](https://github.com/adamjarret/typedoc-default-themes) of the [official default theme](https://github.com/TypeStrong/typedoc-default-themes).

DO NOT EDIT THE FOLLOWING FILES BY HAND:

- **packages/meta/README.md** (edit **packages/cli/README.md** instead, `yarn bundle` will copy any changes)

REMEMBER TO EDIT THE FOLLOWING FILES BY HAND:

- any new configuration options should be added to the help text

## Setup

    cd docs-src/theme
    npm install

## Build Theme

In project root:

    yarn theme

or, in **docs-src/theme**:

    yarn build

## Generate Documentation

In project root:

    yarn docs

**Pro Tip:** typedoc does not provide a "watch" mode that rebuilds automatically when source files change, but the same effect can be achieved with [watchman](https://facebook.github.io/watchman/).

### Terminalizer

To generate **assets/images/demo.gif**, see **docs-src/terminalizer/README.md**.

## Preview Documentation

In project root:

    yarn serve
