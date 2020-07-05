import fs from 'fs';
import path from 'path';
import { Readable, Writable } from 'stream';
import { promisify } from 'util';
import {
  FSProviderBridge,
  Stats,
  FSCopyParams,
  FSDeleteParams,
  FSGetParams,
  FSPutParams
} from './types';
import { md5FromStream } from './util';

const fsExistsAsync = (p: string): Promise<boolean> =>
  new Promise((resolve) => fs.exists(p, resolve));

const fsReaddirAsync = promisify<string, string[]>(fs.readdir);

const fsMkdirAsync = promisify<string, fs.MakeDirectoryOptions>(fs.mkdir);

const fsStatAsync = promisify<string, Stats>(fs.stat);

const fsUnlinkAsync = promisify<string>(fs.unlink);

const fsCopyFileAsync = promisify<string, string, number>(fs.copyFile);

const pipe = (input: Readable, output: Writable): Promise<void> => {
  return new Promise((resolve, reject) => {
    input.pipe(output).on('finish', resolve).on('error', reject);
  });
};

export class FSBridge implements FSProviderBridge {
  async putObject(params: FSPutParams): Promise<void> {
    const { body, dirMode, filePath, writeStreamOptions } = params;
    if (!body) {
      throw new Error('Missing body');
    }

    await fsMkdirAsync(path.dirname(filePath), { recursive: true, mode: dirMode });

    return pipe(body, fs.createWriteStream(filePath, writeStreamOptions));
  }

  async copyObject(params: FSCopyParams): Promise<void> {
    const { dirMode, flags, fromPath, toPath } = params;

    await fsMkdirAsync(path.dirname(toPath), { recursive: true, mode: dirMode });

    return fsCopyFileAsync(fromPath, toPath, flags ?? 0);
  }

  async deleteObject(params: FSDeleteParams): Promise<void> {
    const { filePath } = params;
    if (!(await fsExistsAsync(filePath))) {
      return;
    }

    return fsUnlinkAsync(filePath);
  }

  /**
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  getObjectReadStream(params: FSGetParams): Readable {
    return fs.createReadStream(params.filePath, params.readStreamOptions);
  }

  getMD5FromReadStream(stream: Readable): Promise<string | null> {
    return md5FromStream(stream);
  }

  listObjects(directoryPath: string): Promise<string[]> {
    return fsReaddirAsync(directoryPath);
  }

  objectExists(filePath: string): Promise<boolean> {
    return fsExistsAsync(filePath);
  }

  objectStats(filePath: string): Promise<Stats> {
    return fsStatAsync(filePath);
  }
}
