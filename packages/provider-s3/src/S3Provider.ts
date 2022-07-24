import { Readable } from 'stream';
import mime from 'mime';
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  paginateListObjectsV2
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
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
  S3CopyParams,
  S3DeleteParams,
  S3GetParams,
  S3PutParams,
  S3ListParams,
  S3ProviderDelegate,
  S3Root,
  S3Object
} from './types';
import { createS3Client } from './util/createS3Client';
import { parseS3Root } from './util/parseS3Root';
import createFileFromS3Object from './util/createFileFromS3Object';

/** @category Constructor Options */
export type S3ProviderOptions = {
  /**
   * File root (ex. "s3://s3p-test/foo")
   */
  root: string;

  /**
   * Calculate the MD5 file hash so that an error is returned if the uploaded file hash does not match
   * @see https://aws.amazon.com/premiumsupport/knowledge-center/data-integrity-s3/
   * @default true
   */
  checksum?: boolean;

  /**
   * AWS.S3Client instance
   * @remarks If not provided, a default client will be created
   */
  client?: S3Client;

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
  protected client: S3Client;
  protected rootParams?: S3Root;
  protected checksum: boolean;
  protected delegate?: S3ProviderDelegate;
  protected ignores?: FilePredicate;

  constructor(options: S3ProviderOptions) {
    const { root, checksum, client, delegate, ignores } = options;

    this.root = root;
    this.client = client ?? createS3Client();
    this.checksum = checksum ?? true;
    this.delegate = delegate;
    this.ignores = ignores;
  }

  //
  // listFiles

  async listFiles(onIgnore?: FileHandler): Promise<FileMap> {
    const fileMap: FileMap = new Map();
    const params = await this.listFilesParams();

    // paginateListObjectsV2 clobbers the MaxKeys input param with the pageSize value from config
    // so the config value is set to params.MaxKeys here to preserve the param value if set
    const config = { client: this.client, pageSize: params.MaxKeys };

    // List objects in batches
    for await (const { Contents } of paginateListObjectsV2(config, params)) {
      if (Contents) {
        // Loop over objects in batch
        for (const obj of Contents) {
          // Create File object from S3Object
          const file = this.createFile(obj);
          // File will be null for "directory" objects (and those with invaid Keys)
          if (file) {
            // If file is ignored, invoke onIngnore handler
            if (this.ignores && this.ignores(file)) {
              onIgnore && onIgnore(file);
            }
            // Otherwise, add file to Map
            else {
              fileMap.set(file.Key, file);
            }
          }
        }
      }
    }

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
   * Get readable stream for an S3 object
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  async getFile(file: File): Promise<Readable> {
    const params = await this.getFileParams(file);

    const { Body } = await this.client.send(new GetObjectCommand(params));
    if (Body instanceof Readable) {
      return Body;
    } else {
      throw new Error('Unknown object stream type');
    }
  }

  protected async getFileParams(file: File): Promise<S3GetParams> {
    const getFileParams = this.delegate?.getFileParams;
    const params: S3GetParams = {
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
    const { multipart, ...params } = await this.putFileParams(file);

    return {
      type,
      reason,
      params,
      file,
      job: async (): Promise<void> => {
        const upload = new Upload({
          ...multipart,
          client: this.client,
          params: {
            ...params,
            // Body is set inside job (instead of in putFileParams)
            //  so the the read stream is not created until needed
            Body: params.Body ?? (await file.SourceProvider.getFile(file))
          }
        });

        // TODO: Support detailed progress updates for large files
        //upload.on('httpUploadProgress', onHttpProgress);

        await upload.done();
      }
    };
  }

  protected async putFileParams(file: File): Promise<S3PutParams> {
    const putFileParams = this.delegate?.putFileParams;
    const targetKey = await this.getTargetFileKey(file);
    const params: S3PutParams = {
      Bucket: this.getRootParams().Bucket,
      Key: this.renderPathForKey(targetKey),
      ContentType: this.renderContentType(targetKey),
      ContentMD5: await this.renderContentMD5(file), // optional
      ContentLength: file.Size,
      multipart: {
        queueSize: 1, // optional concurrency configuration
        partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
        leavePartsOnError: false // optional manually handle dropped parts
      }
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
        await this.client.send(new CopyObjectCommand(params));
      }
    };
  }

  protected async copyFileParams(file: File): Promise<S3CopyParams> {
    const copyFileParams = this.delegate?.copyFileParams;
    const targetKey = await this.getTargetFileKey(file);
    const params: S3CopyParams = {
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
        await this.client.send(new DeleteObjectCommand(params));
      }
    };
  }

  protected async deleteFileParams(file: File): Promise<S3DeleteParams> {
    const deleteFileParams = this.delegate?.deleteFileParams;
    const params: S3DeleteParams = {
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

  protected createFile(obj: S3Object): File | null {
    const { Prefix } = this.getRootParams();
    return createFileFromS3Object(obj, this, Prefix);
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
}

export default S3Provider;
