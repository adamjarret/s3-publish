#!/usr/bin/env node

import path from 'path';
import { createCli } from '../util/createCli';
import { createConfigLoader } from '../util/createConfigLoader';

createCli({
  templatePath: path.resolve(__dirname, '..', '..', 'config'),
  configLoader: createConfigLoader(require)
});
