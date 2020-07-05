import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';
import { Logger, MessageInitResult } from '@s3-publish/loggers';
import { defaultConfigPath } from '../constants';

/** @category Command Options */
export type InitLogger = Logger<MessageInitResult>;

/** @category Command Options */
export type InitOptions = {
  /**
   * Path to directory containing template files
   */
  templatePath: string;

  /**
   * If false, content will be written to stdout
   * @default .s3p.config.js
   */
  writePath?: string | false;

  logger?: InitLogger;

  /**
   * Overwrite config file if it exists
   */
  force?: boolean;
};

/**
 * Create .s3p.config.js in CWD
 * @category Command
 */
export async function init(options: InitOptions): Promise<void> {
  let ws: Writable;
  let destPath: string | undefined;
  const { writePath = defaultConfigPath, force, logger, templatePath } = options;
  const srcPath = path.resolve(templatePath, `s3p.config.js`);

  if (writePath === false) {
    // Respect --no-config-path (content will be written to stdout)
    ws = process.stdout;
  } else {
    destPath = path.resolve(process.cwd(), writePath);

    if (!force && fs.existsSync(destPath)) {
      throw new Error(`${destPath} exists. Use --force to overwrite.`);
    }

    ws = fs.createWriteStream(destPath);
  }

  await new Promise((resolve, reject) => {
    fs.createReadStream(srcPath, 'utf8')
      .pipe(ws)
      .on('finish', resolve)
      .on('error', reject);
  });

  logger?.log({ type: 'init:result', wrote: destPath });
}

export default init;
