> **IMPORTANT**: Ignoring a target file DOES NOT prevent it from being overwritten.
> Corresponding non-ignored origin files will always be uploaded if they exist.

- Ignored origin files will not be listed/compared/uploaded

- Ignored target files will not be listed/compared (or deleted when `--delete` is used)

- Use `--show-ignored` (`-x`) or set `showIgnored` to true in the config file to
  display ignored files in command output

### Glob Patterns

Glob patterns should adhere to the [gitignore spec](https://git-scm.com/docs/gitignore)
and will be matched against the {@linkcode File} `Key`.

Patterns are applied in the following order (this is significant because the gitignore
spec allows subsequent patterns to negate previous ones):

1. [Patterns loaded from **.ignore File**](#-ignore-file)
2. [Patterns loaded from **Config File**](#config-file)
3. [Patterns provided as **Arguments**](#arguments)

### Custom Function

Optionally, a custom `ignores` function can be defined for each provider (origin/target) in the config file.

It should accept a {@linkcode File} parameter and return true if the file should be ignored,
otherwise false. See [below](#config-file) for an example.

Note: If an `ignores` function is defined for a provider, glob patterns
(including any specified as command line arguments and/or loaded fom the related .ignore file)
will have NO EFFECT on that provider.

## .ignore File

By default, `s3p` automatically loads glob patterns from **.s3p.origin.ignore**
and **.s3p.target.ignore** if they exist in the CWD.

- Use `--origin-ignore-path` (`-g`) and/or `--target-ignore-path` (`-G`)
  or set `ignorePath` for the provider in the config file
  to load patterns from a different path .

- Use `--no-origin-ignore-path` and/or `--no-target-ignore-path`
  or set `ignorePath` to false for the provider in the config file
  to prevent the corresponding ignore file from being loaded at all.

## Config File

Optionally specify glob patterns or define a custom `ignores` function for each provider.
If an `ignores` function is defined, patterns have no effect.

### Example

```js
module.exports = {
  origin: {
    // Function: Ignore files with the extension '.zip'
    ignores: (file) => file.Key.endsWith('.zip'),
    root: '.'
  },

  target: {
    // Patterns: Ignore files with the extension '.zip'
    ignorePatterns: ['*.zip'],
    // Path: Ignore files that match patterns loaded from this path
    ignorePath: '.s3p.ignore',
    root: 's3://my-bucket'
  },

  schemaVersion: 2
};
```

## Arguments

Glob patterns may be specified on the command line:

- Use `--origin-ignore` (`-i`) and/or `--target-ignore` (`-I`)
  to specify a pattern to ignore

- Use `--no-origin-ignore` and/or `--no-target-ignore`
  to disregard all patterns for the provider that were specified as arguments

### Example

Ignore files with extension `.tgz` and the `node_modules` folder in origin
and ignore files with extension `.tmp` in target:

```text
npx s3p ls -t s3://my-bucket -I '*.tmp' -i '*.tgz' -i 'node_modules'
```
