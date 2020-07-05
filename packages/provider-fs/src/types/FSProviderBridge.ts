import { Readable } from 'stream';
import { FSCopyParams, FSDeleteParams, FSGetParams, FSPutParams, Stats } from './FS';

export interface FSProviderBridge {
  /**
   * Copy local file to destination path
   */
  copyObject(params: FSCopyParams): Promise<void>;

  /**
   * Permanently delete local file
   */
  deleteObject(params: FSDeleteParams): Promise<void>;

  /**
   * Get readable stream for a local file
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  getObjectReadStream(params: FSGetParams): Readable;

  /**
   * Get MD5 hash from Readable stream
   * @see {@linkcode md5FromStream}
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  getMD5FromReadStream(stream: Readable): Promise<string | null>;

  /**
   * Non-recursively list files in directory and return found paths as an array of strings
   */
  listObjects(filePath: string): Promise<string[]>;

  /**
   * @returns true if file/directory exists at path, otherwise false
   */
  objectExists(filePath: string): Promise<boolean>;

  /**
   * Get file status
   */
  objectStats(filePath: string): Promise<Stats>;

  /**
   * Write content to output stream
   */
  putObject(params: FSPutParams): Promise<void>;
}
