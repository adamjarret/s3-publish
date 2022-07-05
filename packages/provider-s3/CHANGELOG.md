# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- CHANGELOG.md

### Changed

- **BREAKING** Minimum node version is now >= v12.17
- **BREAKING** `S3ProviderBridge.getObjectReadStream` method now returns `Promise<Readable>` instead of `Readable`
- Upgraded to modular [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html) from v2
- Automatically send multipart uploads for large (or unknown size) streams using [@aws-sdk/lib-storage](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_lib_storage.html)

### Removed

- Internal `createPromiseCallback` util

## [1.0.1] - 2020-07-19

### Changed

- Updated dependencies

## [1.0.0] - 2020-07-05

### Added

- Initial release

[unreleased]: https://github.com/adamjarret/s3-publish/compare/provider-s3-1.0.1...HEAD
[1.0.1]: https://github.com/adamjarret/s3-publish/releases/tag/provider-s3-1.0.1
[1.0.0]: https://github.com/adamjarret/s3-publish/releases/tag/provider-s3-1.0.0
