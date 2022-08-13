import path from 'path';
import { promises as fs, createReadStream, createWriteStream } from 'fs';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';
import {
  Provider,
  File,
  FileMap,
  FileHandler,
  FilePredicate,
  ProviderOperation,
  Reason,
  normalizeSeparators
} from '@s3-publish/core';
import {
  FSProviderDelegate,
  FSCopyParams,
  FSDeleteParams,
  FSGetParams,
  FSPutParams,
  Stats
} from './types';
import { md5FromStream } from './util';

const pipelineAsync = promisify(pipeline);

/** @category Constructor Options */
export type FSProviderOptions = {
  root: string;
  delegate?: FSProviderDelegate;
  ignores?: FilePredicate;
};

/**
 * Provider for files on the local filesystem
 */
export class FSProvider implements Provider {
  public readonly protocol = 'file';
  public readonly root: string;
  protected delegate?: FSProviderDelegate;
  protected ignores?: FilePredicate;

  constructor(options: FSProviderOptions) {
    this.root = options.root;
    this.delegate = options.delegate;
    this.ignores = options.ignores;
  }

  //
  // listFiles

  /**
   * Returns a collection of all provided files
   */
  public async listFiles(onIgnore?: FileHandler): Promise<FileMap> {
    const fileMap: FileMap = new Map();

    const walk = async (filePath: string): Promise<void> => {
      // Get file info (size/lastModified/isDirectory)
      const stats = await fs.stat(filePath);

      // Create File object from path/stats
      const file = this.createFile(filePath, stats);

      // Check if file/directory is ignored
      //  file.Key will be '' for root
      if (file.Key && this.ignores && this.ignores(file)) {
        onIgnore && onIgnore(file);
        return;
      }

      if (stats.isDirectory()) {
        // Walk directory files
        const subPaths = await fs.readdir(filePath);
        for (let i = 0; i < subPaths.length; i++) {
          await walk(path.join(filePath, subPaths[i]));
        }
      } else {
        fileMap.set(file.Key, file);
      }
    };

    if (!this.root) {
      throw new Error('Missing root');
    }

    if (!(await this.objectExists(this.root))) {
      throw new Error(`${this.root} not found`);
    }

    await walk(this.root);

    return fileMap;
  }

  //
  // copyFile

  /**
   * Returns a `Readable` stream of the `File` contents
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  public async getFile(file: File): Promise<Readable> {
    const params = await this.getFileParams(file);

    return createReadStream(params.filePath, params.readStreamOptions);
  }

  /**
   * Returns a `FSGetParams` object for the given `File`
   */
  protected async getFileParams(file: File): Promise<FSGetParams> {
    const getFileParams = this.delegate?.getFileParams;
    const filePath = this.renderPathForKey(file.Key);
    const params: FSGetParams = { filePath };

    return getFileParams ? await getFileParams(file, params) : params;
  }

  //
  // getFileCopySource

  /**
   * Returns a string value that can be interpreted by the `copyFile` method of
   * the implementation to provide the information required by the operation
   */
  public getFileCopySource(file: File): Promise<string> {
    return Promise.resolve(this.renderPathForKey(file.Key));
  }

  //
  // getFileETag

  /**
   * Returns MD5 hash for file (it is calculated and set if missing)
   */
  public async getFileETag(file: File): Promise<string> {
    if (file.ETag) {
      return file.ETag;
    }

    const eTag = await this.getMD5FromReadStream(await this.getFile(file));

    if (!eTag) {
      throw new Error('Missing ETag');
    }

    file.ETag = eTag;

    return eTag;
  }

  //
  // getTargetFileKey

  /**
   * Returns the Key that should be used in target contexts
   * @remarks Default implementations return `file.Key` unchanged
   */
  public async getTargetFileKey(file: File): Promise<string> {
    const targetFileKey = this.delegate?.targetFileKey;

    return targetFileKey ? await targetFileKey(file) : file.Key;
  }

  //
  // putFile

  /**
   * Create an operation that will write contents of a `File` to the target
   */
  public async putFile(file: File, reason: Reason): Promise<ProviderOperation> {
    const type = 'PUT';
    const params = await this.putFileParams(file);

    return {
      type,
      reason,
      params,
      file,
      job: async (): Promise<void> => {
        await this.putObject({
          ...params,
          // Body is set inside job (instead of in putFileParams)
          //  so the the read stream is not created until needed
          body: params.body ?? (await file.SourceProvider.getFile(file))
        });
      }
    };
  }

  /**
   * Returns a `FSPutParams` object for the given `File`
   */
  protected async putFileParams(file: File): Promise<FSPutParams> {
    const putFileParams = this.delegate?.putFileParams;
    const targetKey = await this.getTargetFileKey(file);
    const filePath = this.renderPathForKey(targetKey);
    const params: FSPutParams = { filePath };

    return putFileParams ? await putFileParams(file, params) : params;
  }

  //
  // copyFile

  /**
   * Create an operation that will copy a `File` to a target with the same provider
   * @remarks This method is an optimization designed to allow S3 objects to be copied
   * to another S3 location without being streamed to and from the machine running this code.
   */
  public async copyFile(file: File, reason: Reason): Promise<ProviderOperation> {
    const type = 'COPY';
    const params = await this.copyFileParams(file);

    return {
      type,
      reason,
      params,
      file,
      job: async (): Promise<void> => {
        await this.copyObject(params);
      }
    };
  }

  /**
   * Returns a `FSCopyParams` object for the given `File`
   */
  protected async copyFileParams(file: File): Promise<FSCopyParams> {
    const copyFileParams = this.delegate?.copyFileParams;
    const targetKey = await this.getTargetFileKey(file);
    const toPath = this.renderPathForKey(targetKey);
    const fromPath = await file.SourceProvider.getFileCopySource(file);
    const params: FSCopyParams = { fromPath, toPath, flags: 0 };

    return copyFileParams ? await copyFileParams(file, params) : params;
  }

  //
  // deleteFile

  /**
   * Create an operation that will delete a `File` from the target
   */
  public async deleteFile(file: File): Promise<ProviderOperation> {
    const type = 'DELETE';
    const params = await this.deleteFileParams(file);

    return Promise.resolve({
      type,
      params,
      file,
      root: this.root,
      job: async (): Promise<void> => {
        await this.deleteObject(params);
      }
    });
  }

  /**
   * Returns a `FSDeleteParams` object for the given `File`
   */
  protected async deleteFileParams(file: File): Promise<FSDeleteParams> {
    const deleteFileParams = this.delegate?.deleteFileParams;
    const params: FSDeleteParams = {
      // Target key is not used here because the delete operation is only relevant
      //  to objects that already exist at a provider location (like getFile), and as such
      //  would never be renamed on the fly.
      filePath: this.renderPathForKey(file.Key)
    };

    return deleteFileParams ? await deleteFileParams(file, params) : params;
  }

  //
  // Util

  /**
   * Resolve key relative to root
   */
  protected renderPathForKey(key: string): string {
    return path.resolve(this.root, key);
  }

  /**
   * Calculate MD5 hash from readable stream
   */
  protected getMD5FromReadStream(stream: Readable): Promise<string> {
    return md5FromStream(stream);
  }

  /**
   * Create File object from relative file path and stats
   * @remarks ETag is not calculated here for performance
   */
  protected createFile(filePath: string, stats: Stats): File {
    return {
      SourceProvider: this,
      Key: normalizeSeparators(path.relative(this.root, filePath)),
      Size: stats.size,
      LastModified: stats.mtime
    };
  }

  /**
   * Copy file from one path to another (creates parent directories if needed)
   */
  protected async copyObject(params: FSCopyParams): Promise<void> {
    const { dirMode, flags, fromPath, toPath } = params;

    await fs.mkdir(path.dirname(toPath), { recursive: true, mode: dirMode });

    return fs.copyFile(fromPath, toPath, flags);
  }

  /**
   * Delete file from filesystem
   */
  protected async deleteObject(params: FSDeleteParams): Promise<void> {
    const { filePath } = params;

    try {
      await fs.unlink(filePath);
    } catch (err) {
      // If file already does not exist, consider operation successful
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  /**
   * Write file from stream (creates parent directories if needed)
   */
  protected async putObject(params: FSPutParams): Promise<void> {
    const { body, dirMode, filePath, writeStreamOptions } = params;
    if (!body) {
      throw new Error('Missing body');
    }

    await fs.mkdir(path.dirname(filePath), { recursive: true, mode: dirMode });

    return pipelineAsync(body, createWriteStream(filePath, writeStreamOptions));
  }

  /**
   * If the provided file path exists, the method returns a promise that resolves to true (otherwise false)
   *
   * Warning from https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_fspromises_access_path_mode:
   * > Using fsPromises.access() to check for the accessibility of a file before calling
   * > fsPromises.open() is not recommended. Doing so introduces a race condition, since
   * > other processes may change the file's state between the two calls.
   * > Instead, user code should open/read/write the file directly and handle the error raised if
   * > the file is not accessible.
   *
   * @param filePath Path to check
   */
  protected async objectExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export default FSProvider;
