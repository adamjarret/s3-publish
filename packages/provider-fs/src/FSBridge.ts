import { promises as fs, createReadStream, createWriteStream, existsSync } from 'fs';
import path from 'path';
import { Readable, pipeline } from 'stream';
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

const pipelineAsync = promisify(pipeline);

export class FSBridge implements FSProviderBridge {
  async putObject(params: FSPutParams): Promise<void> {
    const { body, dirMode, filePath, writeStreamOptions } = params;
    if (!body) {
      throw new Error('Missing body');
    }

    await fs.mkdir(path.dirname(filePath), { recursive: true, mode: dirMode });

    return pipelineAsync(body, createWriteStream(filePath, writeStreamOptions));
  }

  async copyObject(params: FSCopyParams): Promise<void> {
    const { dirMode, flags, fromPath, toPath } = params;

    await fs.mkdir(path.dirname(toPath), { recursive: true, mode: dirMode });

    return fs.copyFile(fromPath, toPath, flags ?? 0);
  }

  async deleteObject(params: FSDeleteParams): Promise<void> {
    const { filePath } = params;
    if (!(await this.objectExists(filePath))) {
      return;
    }

    return fs.unlink(filePath);
  }

  /**
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  getObjectReadStream(params: FSGetParams): Readable {
    return createReadStream(params.filePath, params.readStreamOptions);
  }

  getMD5FromReadStream(stream: Readable): Promise<string | null> {
    return md5FromStream(stream);
  }

  listObjects(directoryPath: string): Promise<string[]> {
    return fs.readdir(directoryPath);
  }

  /**
   * Warning from https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_fspromises_access_path_mode:
   * > Using fsPromises.access() to check for the accessibility of a file before calling
   * > fsPromises.open() is not recommended. Doing so introduces a race condition, since
   * > other processes may change the file's state between the two calls.
   * > Instead, user code should open/read/write the file directly and handle the error raised if
   * > the file is not accessible.
   */
  async objectExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  objectStats(filePath: string): Promise<Stats> {
    return fs.stat(filePath);
  }
}
