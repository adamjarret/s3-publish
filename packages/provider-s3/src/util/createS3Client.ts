import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

/**
 * @remarks If not provided in options, region value is taken from AWS_REGION env var.
 * If neither are set, region defaults to us-east-1
 * @returns `S3Client` instance created using the provided client configuration options
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/s3client.html | S3Client}
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html | S3ClientConfig}
 */
export function createS3Client(options?: S3ClientConfig): S3Client {
  const { AWS_REGION = 'us-east-1' } = process.env;

  return new S3Client({ region: AWS_REGION, ...options });
}

export default createS3Client;
