import { packageVersions } from '../constants';

/** @internal */
export const helpText = `
Usage:
  s3p <command> [options...]

Commands:
  help                        # Show this help information
  init                        # Create .s3p.config.js in CWD
  ls [roots...]               # List files in origin, target, and any specified roots
  sync                        # Upload changed origin files to target
  version                     # Display package versions

Options:
  --config-path, --config     # Path to config file [default: .s3p.config.js]
  --cwd, -C                   # Current working directory [string]
  --json, -j                  # Format output as JSON
  --limit-requests, -l        # Max parallel list/put/copy/delete operations [default: 3]
  --origin, -o                # Origin root [default: CWD]
  --origin-ignore, -i         # Origin ignore glob pattern [string]
  --origin-ignore-path, -g    # Path to origin ignore file [default: .s3p.origin.ignore]
  --target, -t                # Target root [string]
  --target-ignore, -I         # Target ignore glob pattern [string]
  --target-ignore-path, -G    # Path to target ignore file [default: .s3p.target.ignore]
  --show-hashes, -h           # Display MD5 file hashes
  --show-ignored, -x          # Display ignored files

init Options:
  --force, -f                 # Overwrite config file if it exists
  --write-path, --write       # Path to output file

sync Options:
  --change, -c                # Upload non-ignored origin files even if unchanged
  --delete, -d                # Delete target files that do not exist in origin
  --expect, -e                # Only upload origin files that already exist in target
  --go, -y                    # Preview and perform operations without prompting
  --no-go, -n                 # Preview operations without performing them or prompting
  --limit-compares, -s        # Max parallel file compare operations [default: 10]
  --show-params, -p           # Display operation request parameters
  --show-skipped, -v          # Display skipped (unchanged/unexpected) files

Environment Variables:
  AWS_PROFILE                 # AWS credentials profile used by the SDK
  AWS_REGION                  # AWS region used by the SDK
  CI=1                        # Disable progress animations
  DATE_FORMAT                 # Date format mask [default: yyyy-mm-dd HH:MM:ss]
  DEBUG=1                     # Show error stack traces
  FORCE_COLOR=0               # Disable terminal colors
  MUTE=1                      # Prevent all output
  PORCELAIN=1                 # Show sizes in bytes, durations in ms, dates as ISO 8601
`;

/** @internal */
export const helpFooter = `
Documentation:
  https://adamjarret.github.io/s3-publish

Author:
  Adam Jarret (https://atj.me)

Version:
  ${packageVersions['@s3-publish/cli']}
`;

/**
 * Show help information
 * @category Command
 */
export function help(): void {
  process.stdout.write(`${helpText}${helpFooter}\n`);
}

export default help;
