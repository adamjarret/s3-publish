import { Readable } from 'stream';
import {
  S3CopyParams,
  S3CopyResult,
  S3DeleteParams,
  S3DeleteResult,
  S3GetParams,
  S3PutParams,
  S3PutResult,
  S3ListParams,
  S3ProviderBridge,
  S3Object,
  S3ObjectHandler
} from '../types';

/** @internal */
export type MockS3BridgeOptions = {
  files: S3Object[];
  onGetObject?(params: S3GetParams): Readable;
  onCopyObject?(params: S3CopyParams): Promise<S3CopyResult>;
  onPutObject?(params: S3PutParams): Promise<S3PutResult>;
  onDeleteObject?(params: S3DeleteParams): Promise<S3DeleteResult>;
  onWalkObjects?(params: S3ListParams): Promise<S3ListParams>;
};

/** @internal */
export class MockS3Bridge implements S3ProviderBridge {
  protected options: MockS3BridgeOptions;

  constructor(options?: Partial<MockS3BridgeOptions>) {
    this.options = { files: [], ...options };
  }

  copyObject(params: S3CopyParams): Promise<S3CopyResult> {
    const { onCopyObject } = this.options;
    return onCopyObject ? onCopyObject(params) : Promise.resolve({});
  }

  deleteObject(params: S3DeleteParams): Promise<S3DeleteResult> {
    const { onDeleteObject } = this.options;
    return onDeleteObject ? onDeleteObject(params) : Promise.resolve({});
  }

  putObject(params: S3PutParams): Promise<S3PutResult> {
    const { onPutObject } = this.options;
    return onPutObject ? onPutObject(params) : Promise.resolve({});
  }

  getObjectReadStream(params: S3GetParams): Readable {
    const { onGetObject } = this.options;
    return onGetObject ? onGetObject(params) : Readable.from([params.Key]);
  }

  walkObjects(params: S3ListParams, handler: S3ObjectHandler): Promise<void> {
    const { onWalkObjects } = this.options;
    onWalkObjects && onWalkObjects(params);

    this.options.files.forEach(handler);

    return Promise.resolve();
  }
}
