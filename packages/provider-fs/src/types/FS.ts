import { Readable } from 'stream';

export type Stats = {
  isDirectory: () => boolean;
  /**
   * Size in bytes
   */
  size: number;
  /**
   * Last modified date
   */
  mtime: Date;
};

export type StreamOptions = {
  /**
   * File system flags
   * @default "w"
   * @see {@link https://nodejs.org/api/fs.html#fs_file_system_flags}
   */
  flags?: string;

  /**
   * Character encoding
   * @default "utf8"
   * @see {@link https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings}
   */
  encoding?:
    | 'ascii'
    | 'utf8'
    | 'utf-8'
    | 'utf16le'
    | 'ucs2'
    | 'ucs-2'
    | 'base64'
    | 'latin1'
    | 'binary'
    | 'hex'
    | undefined;

  /**
   * File mode
   * @default 0o666
   * @see {@link https://nodejs.org/api/fs.html#fs_file_modes}
   */
  mode?: number;
};

export type FSCopyParams = {
  fromPath: string;
  toPath: string;
  /**
   * Integer that specifies the behavior of the copy operation.
   * @default 0
   * @see {@link https://nodejs.org/api/fs.html#fs_fs_copyfile_src_dest_mode_callback | fs.copyFile}
   */
  flags?: number;
  /**
   * The file mode for created directories.
   * @remarks The parent path is recursively created if it does not exist.
   * @default 0o777
   */
  dirMode?: number;
};

export type FSDeleteParams = {
  filePath: string;
};

export type FSGetParams = {
  filePath: string;
  readStreamOptions?: StreamOptions;
};

export type FSPutParams = {
  filePath: string;
  writeStreamOptions?: StreamOptions;

  /**
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  body?: Readable;

  /**
   * The file mode for created directories.
   * @remarks The parent path is recursively created if it does not exist.
   * @default 0o777
   */
  dirMode?: number;
};
