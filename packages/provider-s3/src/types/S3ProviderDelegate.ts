import { File } from '@s3-publish/core';
import {
  S3ListParams,
  S3CopyParams,
  S3DeleteParams,
  S3GetParams,
  S3PutParams
} from './S3';

export interface S3ProviderDelegate {
  /**
   * Customize parameters sent with list requests
   * @remarks The provider will always list all files in the root.
   * The `MaxKeys` option determines how many objects are returned PER BATCH, NOT TOTAL.
   */
  listFilesParams?(params: S3ListParams): Promise<S3ListParams>;

  /**
   * Customize parameters sent with COPY requests
   */
  copyFileParams?(file: File, params: S3CopyParams): Promise<S3CopyParams>;

  /**
   * Customize parameters sent with DELETE requests
   */
  deleteFileParams?(file: File, params: S3DeleteParams): Promise<S3DeleteParams>;

  /**
   * Customize parameters sent with GET requests
   */
  getFileParams?(file: File, params: S3GetParams): Promise<S3GetParams>;

  /**
   * Customize parameters sent with PUT requests
   */
  putFileParams?(file: File, params: S3PutParams): Promise<S3PutParams>;

  /**
   * Return an alternate Key to compare origin file with differently named target file
   */
  targetFileKey?(file: File): Promise<string>;
}
