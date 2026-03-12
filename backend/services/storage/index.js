'use strict';

/**
 * services/storage/index.js
 * AWS S3 storage service — file upload, download, presigned URLs, and metadata.
 */

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { createLogger } = require('../../core/logger');

const logger = createLogger('services:storage');

const REGION           = process.env.AWS_REGION           || 'ap-south-1';
const KYC_BUCKET       = process.env.S3_KYC_BUCKET        || 'smartbankai-kyc-documents';
const LOAN_DOCS_BUCKET = process.env.S3_LOAN_DOCS_BUCKET  || 'smartbankai-loan-documents';
const USER_FILES_BUCKET= process.env.S3_USER_FILES_BUCKET || 'smartbankai-user-files';

const s3Client = new S3Client({ region: REGION });

// Bucket registry for validation
const VALID_BUCKETS = new Set([KYC_BUCKET, LOAN_DOCS_BUCKET, USER_FILES_BUCKET]);

function assertValidBucket(bucket) {
  if (!VALID_BUCKETS.has(bucket)) {
    throw new Error(`Invalid bucket: ${bucket}. Must be one of: ${[...VALID_BUCKETS].join(', ')}`);
  }
}

/**
 * Upload a file to S3
 * @param {{ bucket: string, key: string, body: Buffer | string | ReadableStream, contentType?: string, metadata?: object }} params
 * @returns {Promise<object>} Upload result
 */
async function uploadFile({ bucket, key, body, contentType = 'application/octet-stream', metadata = {} }) {
  assertValidBucket(bucket);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: Object.fromEntries(
      Object.entries(metadata).map(([k, v]) => [k, String(v)])
    ),
    ServerSideEncryption: 'AES256',
  });

  const result = await s3Client.send(command);
  logger.info('File uploaded to S3', { bucket, key, contentType });
  return { bucket, key, etag: result.ETag, location: `https://${bucket}.s3.${REGION}.amazonaws.com/${key}` };
}

/**
 * Download a file from S3
 * @param {{ bucket: string, key: string }} params
 * @returns {Promise<{ body: ReadableStream, contentType: string, contentLength: number }>}
 */
async function getFile({ bucket, key }) {
  assertValidBucket(bucket);
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const result = await s3Client.send(command);
  logger.info('File retrieved from S3', { bucket, key });
  return {
    body: result.Body,
    contentType: result.ContentType,
    contentLength: result.ContentLength,
    metadata: result.Metadata,
  };
}

/**
 * Delete a file from S3
 * @param {{ bucket: string, key: string }} params
 */
async function deleteFile({ bucket, key }) {
  assertValidBucket(bucket);
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  logger.info('File deleted from S3', { bucket, key });
}

/**
 * Generate a presigned URL for file UPLOAD (PUT)
 * @param {{ bucket: string, key: string, contentType?: string, expiresIn?: number }} params
 * @returns {Promise<string>} Presigned URL valid for expiresIn seconds
 */
async function generatePresignedUploadUrl({ bucket, key, contentType = 'application/octet-stream', expiresIn = 3600 }) {
  assertValidBucket(bucket);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  logger.info('Presigned upload URL generated', { bucket, key, expiresIn });
  return url;
}

/**
 * Generate a presigned URL for file DOWNLOAD (GET)
 * @param {{ bucket: string, key: string, expiresIn?: number }} params
 * @returns {Promise<string>} Presigned GET URL
 */
async function generatePresignedDownloadUrl({ bucket, key, expiresIn = 3600 }) {
  assertValidBucket(bucket);
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  logger.info('Presigned download URL generated', { bucket, key, expiresIn });
  return url;
}

/**
 * List files in a bucket under a prefix
 * @param {{ bucket: string, prefix?: string, maxKeys?: number }} params
 * @returns {Promise<Array<{ key: string, size: number, lastModified: Date }>>}
 */
async function listFiles({ bucket, prefix = '', maxKeys = 1000 }) {
  assertValidBucket(bucket);
  const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: maxKeys });
  const result = await s3Client.send(command);
  const files = (result.Contents || []).map((obj) => ({
    key: obj.Key,
    size: obj.Size,
    lastModified: obj.LastModified,
    etag: obj.ETag,
  }));
  logger.info('S3 files listed', { bucket, prefix, count: files.length });
  return files;
}

/**
 * Copy a file between S3 locations
 * @param {{ sourceBucket: string, sourceKey: string, destBucket: string, destKey: string }} params
 */
async function copyFile({ sourceBucket, sourceKey, destBucket, destKey }) {
  assertValidBucket(destBucket);
  const command = new CopyObjectCommand({
    CopySource: `${sourceBucket}/${sourceKey}`,
    Bucket: destBucket,
    Key: destKey,
    ServerSideEncryption: 'AES256',
  });
  await s3Client.send(command);
  logger.info('File copied in S3', { sourceBucket, sourceKey, destBucket, destKey });
}

/**
 * Get file metadata (HEAD request — no download)
 * @param {{ bucket: string, key: string }} params
 * @returns {Promise<object>}
 */
async function getFileMetadata({ bucket, key }) {
  assertValidBucket(bucket);
  const result = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return {
    contentType: result.ContentType,
    contentLength: result.ContentLength,
    lastModified: result.LastModified,
    metadata: result.Metadata,
    etag: result.ETag,
  };
}

// ─── Domain-Specific Helpers ──────────────────────────────────────────────────

/**
 * Generate presigned URL for KYC document upload
 * @param {{ userId: string, documentType: string, expiresIn?: number }} params
 */
async function getKYCUploadUrl({ userId, documentType, expiresIn = 900 }) {
  const key = `kyc/${userId}/${documentType}-${Date.now()}.pdf`;
  return generatePresignedUploadUrl({ bucket: KYC_BUCKET, key, contentType: 'application/pdf', expiresIn });
}

/**
 * Generate presigned URL for loan document upload
 * @param {{ loanId: string, documentType: string }} params
 */
async function getLoanDocUploadUrl({ loanId, documentType }) {
  const key = `loans/${loanId}/${documentType}-${Date.now()}.pdf`;
  return generatePresignedUploadUrl({ bucket: LOAN_DOCS_BUCKET, key, contentType: 'application/pdf', expiresIn: 900 });
}

module.exports = {
  uploadFile,
  getFile,
  deleteFile,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  listFiles,
  copyFile,
  getFileMetadata,
  getKYCUploadUrl,
  getLoanDocUploadUrl,
  BUCKETS: { KYC_BUCKET, LOAN_DOCS_BUCKET, USER_FILES_BUCKET },
};
