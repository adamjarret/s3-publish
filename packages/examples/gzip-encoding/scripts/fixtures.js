#!/usr/bin/env node

const { randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { deflate } = require('zlib');

const compress = promisify(deflate);
const writeFile = promisify(fs.writeFile);

(async () => {
  const filePath = path.resolve(__dirname, '..', 'fixtures', 'A.txt.gz');
  const text = randomBytes(1000000).toString('base64');
  const data = await compress(text);

  await writeFile(filePath, data);
})();
