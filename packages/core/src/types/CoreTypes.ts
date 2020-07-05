import { Readable } from 'stream';

export type File = {
  SourceProvider: Provider;

  /**
   * The path to the File relative to the SourceProvider root
   */
  Key: string;

  /**
   * The File size in bytes
   */
  Size?: number;

  /**
   * The date the File was Last Modified
   */
  LastModified?: Date;

  /**
   * The entity tag is an MD5 hash of the object
   * @remarks ETag reflects only changes to the contents of an S3 object, not its metadata
   */
  ETag?: string;
};

/** @internal */
export type FileWithoutProvider = Omit<File, 'SourceProvider'>;

export type FileMap = Map<string, File>;

export type FileHandler<R = void> = (file: File) => R;

export type FilePairHandler<R = void> = (originFile: File, targetFile: File) => R;

export type FilePredicate = FileHandler<boolean>;

export type Reason = 'ADD' | 'CHANGE';

export type Job = () => Promise<void>;

export type ProviderOperationResult = {
  /**
   * Run time of the operation in milliseconds
   */
  duration: number;
};

export type ProviderOperation = {
  type: 'PUT' | 'COPY' | 'DELETE';

  /**
   * Request parameters
   */
  params: unknown;

  /**
   * File object relevant to operation
   */
  file: File;

  /**
   * Reason for put/copy operation (undefined for delete)
   */
  reason?: Reason;

  /**
   * Function that will be invoked when this operation is performed
   */
  job: Job;
};

export interface Provider {
  /**
   * The protocol this Provider can handle (ex: 's3' or 'file')
   */
  protocol: string;

  /**
   * The root location for this provider (file path or S3 url)
   */
  root: string;

  /**
   * Returns a collection of all provided files
   */
  listFiles(onIgnore?: FileHandler): Promise<FileMap>;

  /**
   * Returns a `Readable` stream of the `File` contents
   * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_readable | Readable}
   */
  getFile(file: File): Promise<Readable>;

  /**
   * Returns a string value that can be interpreted by the `copyFile` method of
   * the implementation to provide the information required by the operation
   */
  getFileCopySource(file: File): Promise<string>;

  /**
   * Returns MD5 hash for file (it is calculated and set if missing)
   */
  getFileETag(file: File): Promise<string>;

  /**
   * Returns the Key that should be used in target contexts
   * @remarks Default implementations return `file.Key` unchanged
   */
  getTargetFileKey(file: File): Promise<string>;

  /**
   * Create an operation that will write contents of a `File` to the target
   */
  putFile(file: File, reason: Reason): Promise<ProviderOperation>;

  /**
   * Create an operation that will copy a `File` to a target with the same provider
   * @remarks This method is an optimization designed to allow S3 objects to be copied
   * to another S3 location without being streamed to and from the machine running this code.
   */
  copyFile(file: File, reason: Reason): Promise<ProviderOperation>;

  /**
   * Create an operation that will delete a `File` from the target
   */
  deleteFile(file: File): Promise<ProviderOperation>;
}

export type SkipEvent = {
  file: File;
  /** Undefined if reason is ADD */
  targetFile?: File;
  reason: Reason;
};

export type PlanOptions = {
  /**
   * Called for each ignored `File`
   * @default undefined
   */
  onIgnore?: FileHandler;

  /**
   * Called for each skipped `File`
   * @default undefined
   */
  onSkip?: (event: SkipEvent) => void;
};

export interface Planner {
  /**
   * Analyze Files and call `onIgnore` and `onSkip` handlers (if defined in options) for each ignored/skipped File
   */
  plan(options?: PlanOptions): Promise<ProviderOperation[]>;
}
