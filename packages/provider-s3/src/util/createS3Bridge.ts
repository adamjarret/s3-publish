import { S3 } from '@aws-sdk/client-s3';
import { S3Bridge } from '../S3Bridge';
import { S3ProviderBridge, S3ClientConfiguration } from '../types';

/**
 * @returns {@linkcode S3Bridge} instance created using the provided AWS.S3 client configuration options
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property | ClientConfiguration}
 */
export function createS3Bridge(options?: S3ClientConfiguration): S3ProviderBridge {
  return new S3Bridge(new S3(options ?? {}));
}
