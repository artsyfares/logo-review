import "server-only";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export {
  ACCEPTED_LOGO_CONTENT_TYPES,
  MAX_LOGO_UPLOAD_BYTES,
} from "./logo-upload-constraints";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — see .env.example`);
  }
  return value;
}

/**
 * Generic S3-compatible client — deliberately provider-agnostic (same
 * "swap via env var" pattern as the AI providers). R2's endpoint is
 * `https://<accountId>.r2.cloudflarestorage.com`; Backblaze B2's is
 * `https://s3.<region>.backblazeb2.com`; any other S3-compatible provider
 * just needs its own STORAGE_ENDPOINT. Nothing here is Cloudflare-specific.
 *
 * `requestChecksumCalculation: "WHEN_REQUIRED"` overrides the SDK's default
 * (`WHEN_SUPPORTED`, since ~v3.729) of always attaching a checksum to
 * PutObject — confirmed live that this breaks presigned-URL uploads to
 * Backblaze B2 (and is a known issue for R2 and other non-AWS S3-compatible
 * providers too): the browser's CORS preflight for the extra checksum
 * header/param fails because the provider doesn't recognize the AWS-only
 * extension, surfacing as an opaque "No Access-Control-Allow-Origin header"
 * error that has nothing to do with the actual CORS rule configured.
 */
export function getStorageClient(): S3Client {
  return new S3Client({
    region: process.env.STORAGE_REGION || "auto",
    endpoint: requireEnv("STORAGE_ENDPOINT"),
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: requireEnv("STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("STORAGE_SECRET_ACCESS_KEY"),
    },
  });
}

export function getStorageBucketName(): string {
  return requireEnv("STORAGE_BUCKET_NAME");
}

export async function fetchStorageObject(
  key: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  const response = await getStorageClient().send(
    new GetObjectCommand({ Bucket: getStorageBucketName(), Key: key }),
  );
  const bytes = Buffer.from(await response.Body!.transformToByteArray());
  return { bytes, contentType: response.ContentType ?? "application/octet-stream" };
}
