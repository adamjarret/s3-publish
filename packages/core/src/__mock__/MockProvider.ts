import { Readable } from 'stream';
import {
  Provider,
  File,
  FileHandler,
  FileMap,
  FilePredicate,
  ProviderOperation,
  Reason,
  FileWithoutProvider
} from '../types';
import { sleep } from './__util__/sleep';

/** @internal */
export type MockProviderOptions = {
  protocol?: string;
  root: string;
  files: FileWithoutProvider[];
  sleepMs?: number;
  ignores?: FilePredicate;
  onGetFileETag?: (file: File) => Promise<void>;
  onCopyFile?: (file: File, reason: Reason) => Promise<void>;
  onDeleteFile?: (file: File) => Promise<void>;
  onPutFile?: (file: File, reason: Reason) => Promise<void>;
};

/** @internal */
export class MockProvider implements Provider {
  protocol: string;
  root: string;
  files: FileMap;
  private sleepMs: number;
  private ignores?: FilePredicate;
  private onGetFileETag: (file: File) => Promise<void>;
  private onCopyFile: (file: File, reason: Reason) => Promise<void>;
  private onDeleteFile: (file: File) => Promise<void>;
  private onPutFile: (file: File, reason: Reason) => Promise<void>;

  constructor(options: MockProviderOptions) {
    this.protocol = options.protocol ?? 'mock';
    this.root = options.root;
    this.sleepMs = options.sleepMs ?? 0;
    this.files = options.files.reduce<FileMap>((agg, file) => {
      agg.set(file.Key, { ...file, SourceProvider: this });
      return agg;
    }, new Map());
    this.ignores = options.ignores;
    this.onGetFileETag = options.onGetFileETag ?? (() => Promise.resolve());
    this.onCopyFile = options.onCopyFile ?? (() => Promise.resolve());
    this.onDeleteFile = options.onDeleteFile ?? (() => Promise.resolve());
    this.onPutFile = options.onPutFile ?? (() => Promise.resolve());
  }

  protected sleep(): Promise<void> {
    return this.sleepMs ? sleep(this.sleepMs) : Promise.resolve();
  }

  async listFiles(onIgnore?: FileHandler): Promise<FileMap> {
    await this.sleep();
    const ignores = this.ignores;
    if (!ignores) {
      return this.files;
    }
    const files: FileMap = new Map();
    this.files.forEach((file) => {
      if (ignores(file)) {
        onIgnore && onIgnore(file);
      } else {
        files.set(file.Key, file);
      }
    });
    return files;
  }

  getFile(file: File): Promise<Readable> {
    return Promise.resolve(Readable.from([file.Key]));
  }

  getFileCopySource(file: File): Promise<string> {
    return Promise.resolve(file.Key);
  }

  async getFileETag(file: File): Promise<string> {
    await this.onGetFileETag(file);
    if (!file.ETag) {
      throw new Error('Missing ETag');
    }
    return file.ETag;
  }

  getTargetFileKey(file: File): Promise<string> {
    return Promise.resolve(file.Key);
  }

  copyFile(file: File, reason: Reason): Promise<ProviderOperation> {
    return Promise.resolve({
      reason,
      type: 'COPY',
      params: {},
      file: file,
      job: () => this.onCopyFile(file, reason)
    });
  }

  deleteFile(file: File): Promise<ProviderOperation> {
    return Promise.resolve({
      type: 'DELETE',
      params: {},
      file: file,
      job: () => this.onDeleteFile(file)
    });
  }

  putFile(file: File, reason: Reason): Promise<ProviderOperation> {
    return Promise.resolve({
      reason,
      type: 'PUT',
      params: {},
      file: file,
      job: () => this.onPutFile(file, reason)
    });
  }
}
