import { File } from '@s3-publish/core';
import { FSCopyParams, FSDeleteParams, FSGetParams, FSPutParams } from './FS';

export interface FSProviderDelegate {
  copyFileParams?(file: File, params: FSCopyParams): Promise<FSCopyParams>;

  deleteFileParams?(file: File, params: FSDeleteParams): Promise<FSDeleteParams>;

  getFileParams?(file: File, params: FSGetParams): Promise<FSGetParams>;

  putFileParams?(file: File, params: FSPutParams): Promise<FSPutParams>;

  targetFileKey?(file: File): Promise<string>;
}
