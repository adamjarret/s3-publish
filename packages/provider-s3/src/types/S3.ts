import type S3 from '@aws-sdk/client-s3';

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property | ClientConfiguration}
 */
export type S3ClientConfiguration = S3.S3ClientConfig;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#copyObject-property | CopyObjectRequest}
 */
export type S3CopyParams = S3.CopyObjectRequest;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#copyObject-property | CopyObjectOutput}
 */
export type S3CopyResult = S3.CopyObjectOutput;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property | DeleteObjectRequest}
 */
export type S3DeleteParams = S3.DeleteObjectRequest;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property | DeleteObjectOutput}
 */
export type S3DeleteResult = S3.DeleteObjectOutput;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property | GetObjectRequest}
 */
export type S3GetParams = S3.GetObjectRequest;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectsV2-property | ListObjectsV2Request}
 */
export type S3ListParams = S3.ListObjectsV2Request;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectsV2-property | ListObjectsV2Output}
 */
export type S3ListResult = S3.ListObjectsV2Output;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property | PutObjectRequest}
 */
export type S3PutParams = S3.PutObjectRequest;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property | PutObjectOutput}
 */
export type S3PutResult = S3.PutObjectOutput;

/**
 * S3 file information returned by `listObjectsV2`
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectsV2-property | Object}
 */
export type S3Object = S3._Object;

export type S3ObjectHandler = (obj: S3Object) => void;

export type S3Root = { Bucket: string; Prefix: string };
