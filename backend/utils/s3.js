const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION || "us-east-1";
const bucket = process.env.AWS_S3_BUCKET;
const isS3Configured = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  bucket
);

const s3Client = isS3Configured
  ? new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

/**
 * Upload a file buffer to S3 and return the public URL
 */
async function uploadToS3(buffer, key, contentType) {
  if (!s3Client) throw new Error("S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Public URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;
  return `${baseUrl}/${key}`;
}

/**
 * Delete a file from S3 by its URL
 */
async function deleteFromS3(url) {
  if (!s3Client) return;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const key = pathname.startsWith("/tickets") ? pathname.slice(1) : pathname;

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
  } catch (err) {
    console.warn("Failed to delete from S3:", err.message);
  }
}

function isS3Enabled() {
  return isS3Configured;
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  isS3Enabled,
};
