import path from 'path';
import { Readable } from 'stream';
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
import { FSBridge } from './FSBridge';
import {
  FSProviderBridge,
  FSProviderDelegate,
  FSCopyParams,
  FSDeleteParams,
  FSGetParams,
  FSPutParams,
  Stats
} from './types';

/** @category Constructor Options */
export type FSProviderOptions = {
  root: string;
  bridge?: FSProviderBridge;
  delegate?: FSProviderDelegate;
  ignores?: FilePredicate;
};

export class FSProvider implements Provider {
  public readonly protocol = 'file';
  public readonly root: string;
  protected bridge: FSProviderBridge;
  protected delegate?: FSProviderDelegate;
  protected ignores?: FilePredicate;

  constructor(options: FSProviderOptions) {
    this.root = options.root;
    this.bridge = options.bridge ?? new FSBridge();
    this.delegate = options.delegate;
    this.ignores = options.ignores;
  }

  //
  // listFiles

  async listFiles(onIgnore?: FileHandler): Promise<FileMap> {
    const fileMap: FileMap = new Map();

    const walk = async (filePath: string): Promise<void> => {
      // Get file info (size/lastModified/isDirectory)
      const stats = await this.bridge.objectStats(filePath);

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
        const subPaths = await this.bridge.listObjects(filePath);
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

    if (!(await this.bridge.objectExists(this.root))) {
      throw new Error(`${this.root} not found`);
    }

    await walk(this.root);

    return fileMap;
  }

  //
  // getFile

  /**
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  async getFile(file: File): Promise<Readable> {
    const params = await this.getFileParams(file);

    return this.bridge.getObjectReadStream(params);
  }

  protected async getFileParams(file: File): Promise<FSGetParams> {
    const getFileParams = this.delegate?.getFileParams;
    const filePath = this.renderPathForKey(file.Key);
    const params: FSGetParams = { filePath };

    return getFileParams ? await getFileParams(file, params) : params;
  }

  //
  // getFileCopySource

  getFileCopySource(file: File): Promise<string> {
    return Promise.resolve(this.renderPathForKey(file.Key));
  }

  //
  // getFileETag

  async getFileETag(file: File): Promise<string> {
    if (file.ETag) {
      return file.ETag;
    }

    const eTag = await this.bridge.getMD5FromReadStream(await this.getFile(file));

    if (!eTag) {
      throw new Error('Missing ETag');
    }

    file.ETag = eTag;

    return eTag;
  }

  //
  // getTargetFileKey

  async getTargetFileKey(file: File): Promise<string> {
    const targetFileKey = this.delegate?.targetFileKey;

    return targetFileKey ? await targetFileKey(file) : file.Key;
  }

  //
  // putFile

  async putFile(file: File, reason: Reason): Promise<ProviderOperation> {
    const type = 'PUT';
    const params = await this.putFileParams(file);

    return {
      type,
      reason,
      params,
      file,
      job: async (): Promise<void> => {
        await this.bridge.putObject({
          ...params,
          // Body is set inside job (instead of in putFileParams)
          //  so the the read stream is not created until needed
          body: params.body ?? (await file.SourceProvider.getFile(file))
        });
      }
    };
  }

  protected async putFileParams(file: File): Promise<FSPutParams> {
    const putFileParams = this.delegate?.putFileParams;
    const targetKey = await this.getTargetFileKey(file);
    const filePath = this.renderPathForKey(targetKey);
    const params: FSPutParams = { filePath };

    return putFileParams ? await putFileParams(file, params) : params;
  }

  //
  // copyFile

  async copyFile(file: File, reason: Reason): Promise<ProviderOperation> {
    const type = 'COPY';
    const params = await this.copyFileParams(file);

    return {
      type,
      reason,
      params,
      file,
      job: async (): Promise<void> => {
        await this.bridge.copyObject(params);
      }
    };
  }

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

  async deleteFile(file: File): Promise<ProviderOperation> {
    const type = 'DELETE';
    const params = await this.deleteFileParams(file);

    return Promise.resolve({
      type,
      params,
      file,
      root: this.root,
      job: async (): Promise<void> => {
        await this.bridge.deleteObject(params);
      }
    });
  }

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

  protected renderPathForKey(Key: string): string {
    return path.resolve(this.root, Key);
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
}

export default FSProvider;
