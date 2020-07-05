# Terminalizer Usage

Run commands from **project root**.

## Prerequisites

- [terminalizer](https://terminalizer.com/install) (`npm install -g terminalizer`)

## Record

    terminalizer record ./docs-src/terminalizer/rec/demo.yml -d 'node ./packages/cli/lib/bin/cli.js sync --config packages/cli/config/s3p.demo.js' -c ./docs-src/terminalizer/config.yml

Then, manually edit **./docs-src/terminalizer/rec/demo.yml**:

- Remove items from start of `records` that cause a blank frames
- Add items from **type_sync.yaml** to the beginning of `records`
- Remove everything after "Finished in 1.4s" from last record
- Add item to the end of `records`:

        - delay: 1000
          content: " "

## Render

    terminalizer render ./docs-src/terminalizer/rec/demo.yml -o ./docs-src/theme/src/default/assets/images/demo.gif

Remember to run `yarn theme && yarn docs` after rendering a new gif.
