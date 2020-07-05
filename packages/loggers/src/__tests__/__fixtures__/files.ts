import { LoggableFile } from '../../types';

export const A: LoggableFile = {
  SourceProvider: {
    root: './public'
  },
  Key: 'A.txt',
  Size: 122,
  LastModified: new Date('2020-01-01T03:42:17'),
  ETag: 'd41d8cd98f00b204e9800998ecf8427e'
};

export const B: LoggableFile = {
  SourceProvider: {
    root: './public'
  },
  Key: 'B.txt',
  Size: 1024 * 1024,
  LastModified: new Date('2020-04-01T09:42:17'),
  ETag: 'e4995362f4cbc0c00bea8c662b891e42'
};

export const renderedFiles = {
  [A.Key]: {
    SourceProvider: {
      root: './public'
    },
    Key: A.Key,
    Size: '122 B',
    LastModified: '2020-01-01 03:42:17'
  },
  [B.Key]: {
    SourceProvider: {
      root: './public'
    },
    Key: B.Key,
    Size: '1 MB',
    LastModified: '2020-04-01 09:42:17'
  }
};

export const renderedFilesWithETag = {
  [A.Key]: {
    ...renderedFiles[A.Key],
    ETag: 'd41d8cd98f00b204e9800998ecf8427e' // ContentMD5: '1B2M2Y8AsgTpgAmY7PhCfg==',
  },
  [B.Key]: {
    ...renderedFiles[B.Key],
    ETag: 'e4995362f4cbc0c00bea8c662b891e42'
  }
};

export const params = {
  [A.Key]: {
    Bucket: 's3p-test',
    Key: A.Key,
    ContentType: 'text/plain',
    ContentMD5: '1B2M2Y8AsgTpgAmY7PhCfg==',
    ContentLength: A.Size
  },
  [B.Key]: {
    Bucket: 's3p-test',
    Key: B.Key,
    ContentType: 'text/plain',
    ContentMD5: '1B2M2Y8AsgTpgAmY7PhCfg==',
    ContentLength: B.Size
  }
};
