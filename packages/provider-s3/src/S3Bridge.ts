import { Readable } from 'stream';
import S3 from 'aws-sdk/clients/s3';
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
import { createPromiseCallback } from './util/createPromiseCallback';

export class S3Bridge implements S3ProviderBridge {
  protected s3: S3;

  /**
   * - Use `new S3Bridge(new S3())` to create an `S3Bridge` instance from an AWS.S3 client instance
   * - Use {@link createS3Bridge} to create an `S3Bridge` instance from AWS.S3 client configuration options
   */
  constructor(s3?: S3) {
    this.s3 = s3 ?? new S3();
  }

  /**
   * Send CopyObject request to S3 endpoint
   */
  copyObject(params: S3CopyParams): Promise<S3CopyResult> {
    return new Promise((resolve, reject) =>
      this.s3.copyObject(params, createPromiseCallback(resolve, reject))
    );
  }

  /**
   * Send DeleteObject request to S3 endpoint
   */
  deleteObject(params: S3DeleteParams): Promise<S3DeleteResult> {
    return new Promise((resolve, reject) =>
      this.s3.deleteObject(params, createPromiseCallback(resolve, reject))
    );
  }

  /**
   * Get readable stream for an S3 object
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  getObjectReadStream(params: S3GetParams): Readable {
    return this.s3.getObject(params).createReadStream();
  }

  /**
   * Send ListObjectsV2 request to S3 endpoint
   */
  protected listObjects(params: S3ListParams): Promise<S3ListResult> {
    return new Promise((resolve, reject) =>
      this.s3.listObjectsV2(params, createPromiseCallback(resolve, reject))
    );
  }

  /**
   * Send PutObject request to S3 endpoint
   */
  putObject(params: S3PutParams): Promise<S3PutResult> {
    return new Promise((resolve, reject) =>
      this.s3.putObject(params, createPromiseCallback(resolve, reject))
    );
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
