#!/usr/bin/env node
// @ts-check

const path = require('path');
const { createCli, createConfigLoader } = require('../lib');

createCli({
  templatePath: path.resolve(__dirname, '..', 'config'),
  configLoader: createConfigLoader(require)
});
