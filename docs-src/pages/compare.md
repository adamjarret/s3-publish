By default, files are compared by their MD5 hashes.

Optionally, a custom `compare` function can be defined in the config file.

It should accept two {@linkcode File} parameters (`originFile` and `targetFile`)
and return a Promise that resolves to false if `originFile` has changed and
otherwise resolves to true.

## Compare by Size

```js
module.exports = {
  // Compare by file size
  compare: (originFile, targetFile) =>
    Promise.resolve(originFile.Size === targetFile.Size),

  origin: {
    root: '.'
  },

  target: {
    root: 's3://my-bucket'
  },

  schemaVersion: 2
};
```

## Fallback to MD5

In this example, the MD5 hash is checked only if the file is less than or equal to 50MB in size.

Note: The {@linkcode File} `ETag` is not calculated until needed for performance reasons.
Call `SourceProvider.getFileETag` to ensure the ETag is available to the
compare function (`originFile.ETag === targetFile.ETag` will NOT work if one or both roots is local).

```js
module.exports = {
  compare: async (originFile, targetFile) => {
    // If file size is greater than 50 MB, compare by file size
    if(originFile.size > 50000000) {
      return Promise.resolve(originFile.Size === targetFile.Size)
    }

    // Otherwise, compare by ETag
    const originETag = await originFile.SourceProvider.getFileETag(originFile);
    const targetETag = await targetFile.SourceProvider.getFileETag(targetFile);

    return originETag === targetETag;
  }

  origin: {
    root: '.'
  },

  target: {
    root: 's3://my-bucket'
  },

  schemaVersion: 2
};
```
