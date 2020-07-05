> When the root provider and the origin provider support the same protocol (both local or both S3),
> `copyFile` operations will be performed instead of `putFile` operations (to facilitate direct S3 to S3 transfers).

Both {@linkcode FSProvider} and {@linkcode S3Provider} can be configured with a `delegate`
object that allows control over the parameters sent with various requests.

See {@linkcode FSProviderDelegate} and {@linkcode S3ProviderDelegate} for supported parameters.

To provide options that are passed to the AWS S3 client constructor, define the `client` object in {@linkcode S3ProviderOptions}.

## CacheControl Example

The following example will set max age to 900 for HTML files and 777600000 for all other files
when uploaded to the S3 target.

```js
// RegEx pattern that matches file Keys ending in .html
const reHtml = /\.html$/;

module.exports = {
  origin: {
    root: '.'
  },

  target: {
    root: 's3://my-bucket',
    delegate: {
      // Provide a putFileParams implementation to modify the parameters that will be sent with the PUT request.
      // The following implementation will set the CacheControl param to 900 for HTML files and 777600000 for all other files.
      putFileParams: (file, params) => {
        params.CacheControl = file.Key.match(reHtml)
          ? 'max-age=900'
          : 'max-age=777600000';

        return Promise.resolve(params);
      }
    }
  },

  schemaVersion: 2
};
```

## gzip Example

The following example will set the `ContentEncoding` header to 'gzip' for files with the `.gz` extension.

The files will also be "re-named" to remove the `.gz` extension when uploaded to the S3 target.

```js
// RegEx pattern that matches file Keys ending in .gz
const reGzip = /\.gz$/;

module.exports = {
  origin: {
    root: '.'
  },

  target: {
    root: 's3://my-bucket',
    delegate: {
      // Provide a targetFileKey implementation to map origin files to differently named target files.
      // This is used when comparing files and also has the effect of "re-naming" the file when it is uploaded.
      // The following implementation will remove .gz file extension (if present)
      targetFileKey: (originFile) => Promise.resolve(originFile.Key.replace(reGzip, '')),

      // Provide a putFileParams implementation to modify the parameters that will be sent with the PUT request.
      // The following implementation will set the ContentEncoding param if the origin file Key matches,
      // otherwise the default params are returned unchanged.
      putFileParams: (originFile, params) => {
        if (reGzip.exec(originFile.Key)) {
          params.ContentEncoding = 'gzip';
        }

        return Promise.resolve(params);
      }
    }
  },

  schemaVersion: 2
};
```
