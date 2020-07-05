import S3, { ClientConfiguration } from 'aws-sdk/clients/s3';
import { S3Bridge } from '../S3Bridge';
import { S3ProviderBridge } from '../types';

/**
 * @returns {@linkcode S3Bridge} instance created using the provided AWS.S3 client configuration options
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property | ClientConfiguration}
 */
export function createS3Bridge(options?: ClientConfiguration): S3ProviderBridge {
  return new S3Bridge(new S3(options));
}
