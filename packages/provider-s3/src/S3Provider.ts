import { Readable } from 'stream';
import mime from 'mime';
import {
  File,
  FileMap,
  FileHandler,
  FilePredicate,
  Provider,
  ProviderOperation,
  Reason,
  unixPathJoin
} from '@s3-publish/core';
import {
  S3ClientConfiguration,
  S3CopyParams,
  S3DeleteParams,
  S3GetParams,
  S3PutParams,
  S3ListParams,
  S3ProviderBridge,
  S3ProviderDelegate,
  S3Root,
  S3Object
} from './types';
import { createS3Bridge } from './util/createS3Bridge';
import { parseS3Root } from './util/parseS3Root';

const reQuote = /"/g;
const reLeadingSlashes = /^\/+/;

/** @category Constructor Options */
export type S3ProviderOptions = {
  /**
   * File root (ex. "s3://s3p-test/foo")
   */
  root: string;

  /**
   * The bridge object is responsible for sending requests to the AWS S3 API
   *
   * Providing a custom bridge is considered [advanced usage](https://adamjarret.github.io/s3-publish/pages/guides/advanced.html)
   * (you probably won't need to do it).
   *
   * The recommended way to customize behavior is to define the `client` and/or `delegate` options instead:
   * - Use the `client` option to configure the underlying AWS S3 client instance
   * - Use the `delegate` option to customize request parameters
   */
  bridge?: S3ProviderBridge;

  /**
   * Calculate the MD5 file hash so that an error is returned if the uploaded file hash does not match
   * @see https://aws.amazon.com/premiumsupport/knowledge-center/data-integrity-s3/
   * @default true
   */
  checksum?: boolean;

  /**
   * This object will be passed to the AWS S3 client constructor
   * @remarks Has no effect if a `bridge` object is also defined
   */
  client?: S3ClientConfiguration;

  /**
   * The delegate object provides hooks that allow the various request parameters to be set programmatically
   */
  delegate?: S3ProviderDelegate;

  /**
   * If defined, this function will be called with each listed file
   * - Return true to ignore the file, otherwise return false
   */
  ignores?: FilePredicate;
};

export class S3Provider implements Provider {
  public readonly protocol = 's3';
  public readonly root: string;
  protected rootParams?: S3Root;
  protected bridge: S3ProviderBridge;
  protected checksum: boolean;
  protected delegate?: S3ProviderDelegate;
  protected ignores?: FilePredicate;

  constructor(options: S3ProviderOptions) {
    const { root, bridge, checksum, client, delegate, ignores } = options;

    this.root = root;
    this.bridge = bridge ?? createS3Bridge(client);
    this.checksum = checksum ?? true;
    this.delegate = delegate;
    this.ignores = ignores;
  }

  //
  // listFiles

  async listFiles(onIgnore?: FileHandler): Promise<FileMap> {
    const fileMap: FileMap = new Map();

    await this.bridge.walkObjects(await this.listFilesParams(), (obj) => {
      const file = this.createFile(obj);
      if (file) {
        if (this.ignores && this.ignores(file)) {
          onIgnore && onIgnore(file);
        } else {
          fileMap.set(file.Key, file);
        }
      }
    });

    return fileMap;
  }

  protected async listFilesParams(): Promise<S3ListParams> {
    const listFilesParams = this.delegate?.listFilesParams;
    const params = this.getRootParams();

    return listFilesParams ? await listFilesParams(params) : params;
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

  protected async getFileParams(file: File): Promise<S3GetParams> {
    const getFileParams = this.delegate?.getFileParams;
    const params = {
      Bucket: this.getRootParams().Bucket,
      Key: this.renderPathForKey(file.Key)
    };

    return getFileParams ? await getFileParams(file, params) : params;
  }

  //
  // getFileCopySource

  getFileCopySource(file: File): Promise<string> {
    const { Bucket } = this.getRootParams();

    return Promise.resolve(this.renderPathForKey(file.Key, Bucket));
  }

  //
  // getFileETag

  getFileETag(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.ETag) {
        resolve(file.ETag);
      } else {
        reject(new Error('Missing ETag'));
      }
    });
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
          Body: params.Body ?? (await file.SourceProvider.getFile(file))
        });
      }
    };
  }

  protected async putFileParams(file: File): Promise<S3PutParams> {
    const putFileParams = this.delegate?.putFileParams;
    const targetKey = await this.getTargetFileKey(file);
    const params = {
      Bucket: this.getRootParams().Bucket,
      Key: this.renderPathForKey(targetKey),
      ContentType: this.renderContentType(targetKey),
      ContentMD5: await this.renderContentMD5(file), // optional
      ContentLength: file.Size
    };

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

  protected async copyFileParams(file: File): Promise<S3CopyParams> {
    const copyFileParams = this.delegate?.copyFileParams;
    const targetKey = await this.getTargetFileKey(file);
    const params = {
      Bucket: this.getRootParams().Bucket,
      Key: this.renderPathForKey(targetKey),
      CopySource: await file.SourceProvider.getFileCopySource(file)
    };

    return copyFileParams ? await copyFileParams(file, params) : params;
  }

  //
  // deleteFile

  async deleteFile(file: File): Promise<ProviderOperation> {
    const type = 'DELETE';
    const params = await this.deleteFileParams(file);

    return {
      type,
      params,
      file,
      job: async (): Promise<void> => {
        await this.bridge.deleteObject(params);
      }
    };
  }

  protected async deleteFileParams(file: File): Promise<S3DeleteParams> {
    const deleteFileParams = this.delegate?.deleteFileParams;
    const params = {
      Bucket: this.getRootParams().Bucket,
      // getTargetFileKey is not used here because the delete operation is only relevant
      //  to objects that already exist at a provider location (like getFile), and so
      //  would never be renamed on the fly.
      Key: this.renderPathForKey(file.Key)
    };

    return deleteFileParams ? await deleteFileParams(file, params) : params;
  }

  //
  // Util

  protected async calculateChecksum(file: File): Promise<string | undefined> {
    return !this.checksum ? undefined : await file.SourceProvider.getFileETag(file);
  }

  protected async renderContentMD5(file: File): Promise<string | undefined> {
    const ETag = file.ETag ?? (await this.calculateChecksum(file));

    return ETag ? Buffer.from(ETag, 'hex').toString('base64') : undefined;
  }

  protected renderContentType(Key: string): string | undefined {
    return mime.getType(Key) ?? undefined;
  }

  protected renderPathForKey(Key: string, Bucket = ''): string {
    return unixPathJoin(Bucket, this.getRootParams().Prefix, Key);
  }

  protected createFile(obj: S3Object): File | null {
    if (!obj.Key) {
      return null;
    }

    // Key is relative to SourceProvider root and should not begin with a slash
    const Key = obj.Key.replace(this.getRootParams().Prefix, '').replace(
      reLeadingSlashes,
      ''
    );

    // file.Key will be '' for root, do not process "directories"
    if (!Key || Key.endsWith('/')) {
      return null;
    }

    return {
      SourceProvider: this,
      Key,
      Size: obj.Size,
      LastModified: obj.LastModified,
      // Remove quotes from ETag (if defined)
      ETag: !obj.ETag ? undefined : obj.ETag.replace(reQuote, '')
    };
  }

  protected getRootParams(): S3Root {
    if (!this.rootParams) {
      const rootParams = parseS3Root(this.root);
      if (!rootParams) {
        throw new Error('Invalid S3 URL');
      }
      this.rootParams = rootParams;
    }
    return this.rootParams;
  }
}

export default S3Provider;
