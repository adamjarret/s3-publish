import { Readable } from 'stream';
import {
  S3CopyParams,
  S3CopyResult,
  S3DeleteParams,
  S3DeleteResult,
  S3GetParams,
  S3ListParams,
  S3PutParams,
  S3PutResult,
  S3ObjectHandler
} from './S3';

export interface S3ProviderBridge {
  /**
   * Send CopyObject request to S3 endpoint
   */
  copyObject(params: S3CopyParams): Promise<S3CopyResult>;

  /**
   * Send DeleteObject request to S3 endpoint
   */
  deleteObject(params: S3DeleteParams): Promise<S3DeleteResult>;

  /**
   * Get readable stream for an S3 object
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  getObjectReadStream(params: S3GetParams): Promise<Readable>;

  /**
   * Send PutObject request to S3 endpoint
   */
  putObject(params: S3PutParams): Promise<S3PutResult>;

  /**
   * Recursively walk objects in a given S3 bucket (with optional prefix)
   */
  walkObjects(params: S3ListParams, handler: S3ObjectHandler): Promise<void>;
}
