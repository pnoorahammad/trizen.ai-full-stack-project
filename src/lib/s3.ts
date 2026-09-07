import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.STORAGE_ENDPOINT;
const region = process.env.STORAGE_REGION || "ap-south-1";
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY || "";
export const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || "event-photos";

export const s3Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export async function generatePresignedUploadUrl(
  storageKey: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
    ContentType: contentType,
  });

  // Direct client S3 pre-signed upload URL (300 seconds expiry)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  // Public object URL standard construction
  const basePublicEndpoint = endpoint
    ? endpoint.replace(/\/storage\/v1\/s3$/, "")
    : "https://hclspmtuhffbukjgdxsy.supabase.co/storage/v1/object/public";

  const publicUrl = `${basePublicEndpoint}/${BUCKET_NAME}/${storageKey}`;

  return { uploadUrl, publicUrl };
}
