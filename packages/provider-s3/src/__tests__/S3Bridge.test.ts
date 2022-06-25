import { S3Bridge } from '../S3Bridge';

class S3BridgeNoContent extends S3Bridge {
  listObjects() {
    return Promise.resolve({});
  }
}

test('S3Bridge.walkObjects: no content', async () => {
  const handler = jest.fn();
  const bridge = new S3BridgeNoContent();

  await bridge.walkObjects(
    {
      Bucket: 's3p-test',
      Prefix: 'fixtures/root'
    },
    handler
  );

  expect(handler).toHaveBeenCalledTimes(0);
});
