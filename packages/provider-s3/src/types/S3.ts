import type {
  _Object,
  CopyObjectCommandInput,
  CopyObjectCommandOutput,
  DeleteObjectCommandInput,
  DeleteObjectCommandOutput,
  GetObjectCommandInput,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  PutObjectCommandInput,
  PutObjectCommandOutput
} from '@aws-sdk/client-s3';
import { Configuration } from '@aws-sdk/lib-storage';

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/copyobjectcommandinput.html | CopyObjectCommandInput}
 */
export type S3CopyParams = CopyObjectCommandInput;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/copyobjectcommandoutput.html | CopyObjectCommandOutput}
 */
export type S3CopyResult = CopyObjectCommandOutput;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/deleteobjectcommandinput.html | DeleteObjectCommandInput}
 */
export type S3DeleteParams = DeleteObjectCommandInput;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/deleteobjectcommandoutput.html | DeleteObjectCommandOutput}
 */
export type S3DeleteResult = DeleteObjectCommandOutput;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/getobjectcommandinput.html | GetObjectCommandInput}
 */
export type S3GetParams = GetObjectCommandInput;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/listobjectsv2commandoutput.html | ListObjectsV2CommandInput}
 */
export type S3ListParams = ListObjectsV2CommandInput;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/listobjectsv2commandoutput.html | ListObjectsV2CommandOutput}
 */
export type S3ListResult = ListObjectsV2CommandOutput;

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/putobjectcommandinput.html | PutObjectCommandInput}
 * @see {@link https://www.npmjs.com/package/@aws-sdk/lib-storage | Upload}
 */
export type S3PutParams = PutObjectCommandInput & { multipart?: Partial<Configuration> };

/**
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/putobjectcommandoutput.html | PutObjectCommandOutput}
 */
export type S3PutResult = PutObjectCommandOutput;

/**
 * S3 file information returned by `listObjectsV2`
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/modules/_object.html | _Object}
 */
export type S3Object = _Object;

export type S3Root = { Bucket: string; Prefix: string };
