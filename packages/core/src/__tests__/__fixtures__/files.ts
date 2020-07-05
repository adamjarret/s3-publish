import { FileWithoutProvider } from '../../types';

export const A: FileWithoutProvider = {
  Key: 'A.txt',
  Size: 122,
  LastModified: new Date('2020-01-01T03:42:17'),
  ETag: 'd41d8cd98f00b204e9800998ecf8427e'
};

export const B: FileWithoutProvider = {
  Key: 'B.txt',
  Size: 1024 * 1024,
  LastModified: new Date('2020-04-01T09:42:17'),
  ETag: 'e4995362f4cbc0c00bea8c662b891e42'
};

export const C: FileWithoutProvider = {
  Key: 'C.md',
  Size: 1024,
  LastModified: new Date('2020-04-01T09:42:17'),
  ETag: 'e4995362f4cbc0c00bea8c662b891e42'
};
