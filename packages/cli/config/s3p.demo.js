// @ts-check

const { checkConfig } = require('../lib/util/checkConfig');
const { MockProvider } = require('@s3-publish/core/lib/__mock__/MockProvider');
const { sleep } = require('@s3-publish/core/lib/__mock__/__util__/sleep');

const A = {
  Key: 'A.jpg',
  Size: 483726,
  LastModified: new Date('2020-01-01T03:42:17'),
  ETag: '5f3ff7cf4b4d6583f0746df07ff80cf5'
};

const B = {
  Key: 'B.html',
  Size: 11486,
  LastModified: new Date('2020-01-01T03:42:17'),
  ETag: '924e9a7d8fed38b36fc59c4dc3ca678c'
};

const B2 = {
  Key: 'B.html',
  Size: 11401,
  LastModified: new Date('2020-01-01T03:42:17'),
  ETag: 'd41d8cd98f00b204e9800998ecf8427e'
};

const C = {
  Key: 'C.pdf',
  Size: 693834,
  LastModified: new Date('2020-01-01T03:42:17'),
  ETag: '2271f3a73fd9ecf6881bbe4cbbee9803'
};

const originRoot = './public';
const targetRoot = 's3://s3p-demo';

module.exports = checkConfig({
  origin: { root: originRoot },
  target: { root: targetRoot },
  delete: true,
  delegate: {
    createProvider: (options) => {
      if (options.root === originRoot) {
        return new MockProvider({
          root: options.root,
          ignores: options.ignores,
          files: [A, B],
          sleepMs: 242
        });
      }

      return new MockProvider({
        protocol: 's3',
        root: options.root,
        ignores: options.ignores,
        files: [B2, C],
        sleepMs: 492,
        onDeleteFile: async () => {
          await sleep(144);
        },
        onPutFile: async (file) => {
          await sleep(file.Size / 1000 + 386);
        }
      });
    }
  },
  schemaVersion: 2
});
