import { Readable } from 'stream';
import { S3 } from '@aws-sdk/client-s3';
import { Upload, Progress } from '@aws-sdk/lib-storage';
import {
  S3ProviderBridge,
  S3CopyParams,
  S3CopyResult,
  S3DeleteParams,
  S3DeleteResult,
  S3GetParams,
  S3ListParams,
  S3ListResult,
  S3PutParams,
  S3PutResult,
  S3ObjectHandler
} from './types';

export class S3Bridge implements S3ProviderBridge {
  protected s3: S3;

  /**
   * - Use `new S3Bridge(new S3())` to create an `S3Bridge` instance from an AWS.S3 client instance
   * - Use {@link createS3Bridge} to create an `S3Bridge` instance from AWS.S3 client configuration options
   */
  constructor(s3?: S3) {
    this.s3 = s3 ?? new S3({});
  }

  /**
   * Send CopyObject request to S3 endpoint
   */
  copyObject(params: S3CopyParams): Promise<S3CopyResult> {
    return this.s3.copyObject(params);
  }

  /**
   * Send DeleteObject request to S3 endpoint
   */
  deleteObject(params: S3DeleteParams): Promise<S3DeleteResult> {
    return this.s3.deleteObject(params);
  }

  /**
   * Get readable stream for an S3 object
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  async getObjectReadStream(params: S3GetParams): Promise<Readable> {
    const { Body } = await this.s3.getObject(params);
    if (Body instanceof Readable) {
      return Body;
    } else {
      throw new Error('Unknown object stream type');
    }
  }

  /**
   * Send ListObjectsV2 request to S3 endpoint
   */
  protected listObjects(params: S3ListParams): Promise<S3ListResult> {
    return this.s3.listObjectsV2(params);
  }

  /**
   * Send PutObject request to S3 endpoint
   */
  putObject(
    params: S3PutParams,
    onHttpProgress?: (progress: Progress) => void
  ): Promise<S3PutResult> {
    const upload = new Upload({
      client: this.s3,
      params,
      queueSize: 1, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false // optional manually handle dropped parts
    });

    if (onHttpProgress) {
      upload.on('httpUploadProgress', onHttpProgress);
    }

    return upload.done();
  }

  /**
   * Recursively walk objects in a given S3 bucket (with optional prefix)
   */
  async walkObjects(params: S3ListParams, handler: S3ObjectHandler): Promise<void> {
    // Thanks https://derickbailey.com/2016/04/13/paging-the-results-of-an-aws-s3-bucket/
    const walk = async (token?: string): Promise<void> => {
      // Set continuation token
      params.ContinuationToken = token;

      // Fetch list of S3Objects
      const data = await this.listObjects(params);

      // Invoke handler for each S3Object
      data.Contents?.forEach(handler);

      // If data is paged, fetch next page
      if (data.IsTruncated) {
        await walk(data.NextContinuationToken);
      }
    };

    await walk();
  }
}
