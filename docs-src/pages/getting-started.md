Let's assume you have a static web site project that you would like to publish to
an S3 bucket named **my-bucket**.

## Requirements

- [node](https://nodejs.org/) 10.17+ (includes `npm` and `npx` commands)

## Setup

If you do not already have a **package.json** file in your project root, create one:

```text
npm init -y
```

## Installation

Install `s3-publish` as a development dependency:

```text
npm install -D s3-publish
```

or

```text
yarn add -D s3-publish
```

> At this point, you should be able to run `npx s3p` and see the help information.

### <a id="individual-modules"></a> Individual Modules

`s3-publish` is a meta package that includes
`@s3-publish/cli` and all dependencies bundled with webpack.

Alternately, the bundled modules can be installed individually:

```text
npm install -D @s3-publish/cli @s3-publish/loggers @s3-publish/core @s3-publish/provider-fs @s3-publish/provider-s3
```

Returned values from `require('s3-publish')` and `require('@s3-publish/cli')` are functionally equivalent
and both provide the `s3p` command.

Note: The individual modules in the `@s3-publish` namespace export TypeScript types
but `s3-publish` DOES NOT re-export them.

## Create Config File (Optional)

A config file can be defined to specify options and implement various handler and delegate functions.
If a **.s3p.config.js** file exists in the CWD, it is loaded automatically.

> Options specified in the config file are overridden by command line arguments.

Use the `s3p init` command to create a **.s3p.config.js** file in the CWD:

```text
npx s3p init
```

Edit this file and set (at a minimum) the `target` root to `'s3://my-bucket'`.

See {@linkcode ConfigFile} for all configurable options
and the **Guides** ({@page Ignoring Files}, {@page Comparing Files}, etc) for examples.

## List Files

The `s3p ls` command will list files in origin and target by default.

```text
npx s3p ls
```

- If no origin root is defined in the config file or specified using `--origin` (`-o`), the CWD is listed
  - Use `--no-origin` to prevent origin from being listed
- If no target root is defined in the config file or specified using `--target` (`-t`), the target is not listed
  - Use `--no-target` to prevent target from being listed

Additional roots may be specified as positional (unnamed) command line arguments:

```text
s3p ls s3://s3p-test
```

See {@linkcode ConfigFile} for all configurable options and {@page s3p Command} for all
command line arguments.

## Publish Files

The `s3p sync` command will analyze the origin and target roots to determine what
operations are needed to make the target match the origin.

```text
npx s3p sync
```

or, without a config file:

```text
npx s3p sync -t s3://my-bucket
```

- If no origin root is defined in the config file or specified using `--origin` (`-o`), the CWD is used
- If no target root is defined in the config file or specified using `--target` (`-t`), an error is thrown

You will be prompted before any operations are performed by default.

- To skip the prompt and perform the operations, use `--go` (`-y`) or set the `go` option to true in the config file
- To skip the prompt and NOT perform the operations, use `--no-go` (`-n`) or set the `go` option to false in the config file

Target files not present in the origin are not processed by default.

- To delete target files not present in the origin, use `--delete` (`-d`) or set the `delete` option to true in the config file

See {@linkcode ConfigFile} for all configurable options and {@page s3p Command} for all
command line arguments.

## Next Steps

You'll probably want to ignore things like **.git** or **node_modules** directories.

See the {@page Ignoring Files} guide for details on how to do that.
