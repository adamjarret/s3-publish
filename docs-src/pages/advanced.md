## Index

- [Type Checking Config Files](#type-checking-config-files)
- [Custom Logger](#custom-logger)
- [Custom Planner](#custom-planner)
- [Custom Providers](#custom-providers)
- [Custom Bridges](#custom-bridges)

## Type Checking Config Files

A {@linkcode checkConfig} function is provided to enable type checking **.s3p.config.js** files.

```js
// @ts-check
const { checkConfig } = require('@s3-publish/cli');

module.exports = checkConfig({
  origin: {
    root: '.'
  },

  target: {
    root: 's3://my-bucket'
  },

  schemaVersion: 2
});
```

Note: This is only useful when `@s3-publish/cli` is installed (not `s3-publish`).
You must [install the bundled modules individually](getting-started.html#individual-modules)
to gain access to the exported types.

## Custom Logger

A {@linkcode CliDelegate | createLogger} function can be defined in **.s3p.config.js** to control how log messages are handled.

The function accepts a {@linkcode LoggerOptionsWithMode} parameter and should return an object that implements the {@linkcode Logger} interface.

For reference logger implementations, see {@linkcode JsonLogger} and {@linkcode TextLogger}.

```js
// Optionally import the default implementation for fallback
const { createLogger } = require('s3-publish');
// or const { createLogger } = require('@s3-publish/cli');

module.exports = {
  origin: {
    root: '.'
  },

  target: {
    root: 's3://my-bucket'
  },

  delegate: {
    createLogger: (options) => {
      // return an object that implements the Logger interface

      // optionally fallback to the default implementation
      return createLogger(options);
    }
  },

  schemaVersion: 2
};
```

The default implementation of `createLogger` behaves as follows:

```js
const { JsonLogger, TextLogger } = require('@s3-publish/loggers');

function createLogger(options) {
  const { mode, ...opts } = options;

  if (mode === 'json') {
    return new JsonLogger(opts);
  }

  return new TextLogger(opts);
}
```

Note: `JsonLogger` and `TextLogger` are not exported by the `s3-publish` meta package. To use them directly, you must [install the bundled modules individually](getting-started.html#individual-modules).

## Custom Planner

A {@linkcode CliDelegate | createPlanner} function can be defined in **.s3p.config.js** to control how planner instances are created
from the configured options.

The function accepts a {@linkcode SyncPlannerOptions} parameter and should return an object that implements the {@linkcode Planner} interface.

For reference planner implementation, see {@linkcode SyncPlanner}.

```js
// Optionally import the default implementation for fallback
const { createPlanner } = require('s3-publish');
// or const { createPlanner } = require('@s3-publish/cli');

module.exports = {
  origin: {
    root: '.'
  },

  target: {
    root: 's3://my-bucket'
  },

  delegate: {
    createPlanner: (options) => {
      // return an object that implements the Planner interface

      // optionally fallback to the default implementation
      return createPlanner(options);
    }
  },

  schemaVersion: 2
};
```

The default implementation of `createPlanner` behaves as follows:

```js
const { SyncPlanner } = require('@s3-publish/core');

function createPlanner(options) {
  return new SyncPlanner(options);
}
```

Note: `SyncPlanner` is not exported by the `s3-publish` meta package. To use it directly, you must [install the bundled modules individually](getting-started.html#individual-modules).

## Custom Providers

A {@linkcode CliDelegate | createProvider} function can be defined in **.s3p.config.js** to control how provider instances are created
from the configured options.

The function accepts a {@linkcode ProviderOptions} parameter and should return an object that implements the {@linkcode Provider} interface.

For reference provider implementations, see {@linkcode FSProvider} and {@linkcode S3Provider}.

```js
// Optionally import the default implementation for fallback
const { createProvider } = require('s3-publish');
// or const { createProvider } = require('@s3-publish/cli');

module.exports = {
  origin: {
    root: '.'
  },

  target: {
    root: 's3://my-bucket'
  },

  delegate: {
    createProvider: (options) => {
      // return an object that implements the Provider interface

      // optionally fallback to the default implementation
      return createProvider(options);
    }
  },

  schemaVersion: 2
};
```

The default implementation of `createProvider` behaves as follows:

```js
const { FSProvider } = require('@s3-publish/provider-fs');
const { S3Provider, parseS3Root } = require('@s3-publish/provider-s3');

function createProvider(options) {
  if (parseS3Root(options.root)) {
    return new S3Provider(options);
  }

  return new FSProvider(options);
}
```

Note: `FSProvider` and `S3Provider` are not exported by the `s3-publish` meta package. To use them directly, you must [install the bundled modules individually](getting-started.html#individual-modules).

## Custom Bridges

A `bridge` object can be defined as a provider option in **.s3p.config.js** to control fundamental interactions with the underlying API.

Both {@linkcode FSProviderOptions} and {@linkcode S3ProviderOptions} support custom bridges.

> This option is primarily used for testing and is not typically needed by end users.
>
> - The recommended way to customize request parameters is to use the `delegate` option.
> - `S3ProviderOptions` also supports a `client` option that can be used to configure the AWS S3 client.

```js
// Optionally import the default implementation to subclass
const { FSBridge } = require('@s3-publish/provider-fs');
const { Readable } = require('stream');

class FSBridgeCustom extends FSBridge {
  getObjectReadStream(params) {
    // Return the file path as the file content
    return Readable.from([params.filePath]);
  }
}

module.exports = {
  origin: {
    root: '.'
    bridge: new FSBridgeCustom()
  },

  target: {
    root: 's3://my-bucket'
  },

  schemaVersion: 2
};
```

Note: `FSBridge` and `S3Bridge` are not exported by the `s3-publish` meta package. To use them directly, you must [install the bundled modules individually](getting-started.html#individual-modules).
