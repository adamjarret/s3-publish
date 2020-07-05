// Each provider root should be a local path or S3 URL (ex. "./public" or "s3p://s3p-test")

// If provider ignores (function) is defined, ignorePatterns (array of glob strings) has no effect
// Note: Any ignore patterns passed as command line arguments and/or loaded from an ignores file
// also have no effect by default if a custom ignored function is defined.

// The provider delegate is an optional object of functions that override request parameters
// Supported functions/params are determined by the provider (see FSProviderDelegate and S3ProviderDelegate)

module.exports = {
  // If compare is undefined, the default comparator (ETag equality) is used
  //compare: (originFile, targetFile) => Promise.resolve(originFile.Size === targetFile.Size),

  // Ignored origin files will not be listed or synced
  origin: {
    //delegate: { getFileParams: (file, params) => Promise.resolve(params) },
    //ignores: (file) => file.Key.endsWith('.zip'),
    //ignorePatterns: ['*.zip'],
    root: '.'
  },

  // Ignored target files will not be listed or deleted (relevant when --delete argument is used)
  // IMPORTANT: Ignoring a target file DOES NOT prevent it from being overwritten
  target: {
    //delegate: { putFileParams: (file, params) => Promise.resolve(params) },
    //ignores: (file) => file.Key.endsWith('.zip'),
    //ignorePatterns: ['*.zip'],
    root: ''
  },

  // Config file schema (always 2)
  schemaVersion: 2
};
