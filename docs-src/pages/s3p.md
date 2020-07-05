## Help

%%HELP%%

## Options

Options may be specified as {@linkcode Args | command line arguments} or in a {@linkcode ConfigFile | config file}.

## Environment Variables

### `AWS_PROFILE`

Set the AWS profile used by the SDK

See https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html

### `AWS_REGION`

Set the AWS region used by the SDK

See https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html

### `CI`

Set `CI=1` to disable progress animations

Not relevant when output is formatted as JSON. If configured logger `stream` is not TTY, the animations are disabled automatically.

### `DATE_FORMAT`

Date format mask (default: `yyyy-mm-dd HH:MM:ss`)

See [dateformat mask options](https://www.npmjs.com/package/dateformat#mask-options)

### `DEBUG`

Set `DEBUG=1` to show error stack traces

### `FORCE_COLOR`

Set `FORCE_COLOR=0` to disable terminal colors

See [supports-color info](https://github.com/chalk/supports-color#info)

### `MUTE`

Set `MUTE=1` to completely mute output. Any Errors encountered **before** the config file is loaded will still be visible.

### `PORCELAIN`

Set `PORCELAIN=1` to display:

- sizes in bytes
- durations in milliseconds
- dates as ISO 8601
