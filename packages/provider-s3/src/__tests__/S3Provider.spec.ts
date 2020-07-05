import { S3Provider } from '../S3Provider';

test('S3Provider.listFiles', async (done) => {
  const provider = new S3Provider({
    root: 's3://s3p-test/fixtures/root'
  });
  const files = await provider.listFiles();

  expect(files.size).toBe(7);

  done();
});

test('S3Provider.listFiles: delegate', async (done) => {
  const provider = new S3Provider({
    root: 's3://s3p-test-b',
    delegate: {
      listFilesParams: (params) => Promise.resolve({ ...params, MaxKeys: 5 })
    }
  });

  let i = 1;
  const handler = jest.fn((obj) => {
    switch (i) {
      case 1:
        expect(obj).toMatchObject({
          Key: 'Apple.txt',
          ETag: '0a5353a3c313e216080c06097286c52f',
          Size: 9
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 2:
        expect(obj).toMatchObject({
          Key: 'ace.txt',
          ETag: '353274e173aabffd4138c8db40c6fdec',
          Size: 7
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 3:
        expect(obj).toMatchObject({
          Key: 'docs/about.md',
          ETag: 'd41d8cd98f00b204e9800998ecf8427e',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 4:
        expect(obj).toMatchObject({
          Key: 'docs/assets/image.jpg',
          ETag: '1fb5f004af66ba389b9d0d320cb14cea',
          Size: 220399
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 5:
        expect(obj).toMatchObject({
          Key: 'docs/assets/styles.css',
          ETag: 'd41d8cd98f00b204e9800998ecf8427e',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 6:
        expect(obj).toMatchObject({
          Key: 'docs/getting-started.md',
          ETag: 'd41d8cd98f00b204e9800998ecf8427e',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;

      case 7:
        expect(obj).toMatchObject({
          Key: 'docs/tmp/out.bak',
          ETag: 'd41d8cd98f00b204e9800998ecf8427e',
          Size: 0
        });
        expect(obj.LastModified).toBeDefined();
        break;
    }
    i++;
  });

  const files = await provider.listFiles();

  files.forEach(handler);

  expect(handler).toHaveBeenCalledTimes(7);

  done();
});
