#!/usr/bin/env node

const { resolve: resolvePath } = require('path');
const { createCli, createConfigLoader } = require('../lib');

createCli({
  templatePath: resolvePath(__dirname, '..', 'config'),
  configLoader: createConfigLoader(require)
});
