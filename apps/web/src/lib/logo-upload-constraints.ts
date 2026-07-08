/**
 * Shared between the client uploader and server routes/actions — kept in its
 * own zero-dependency module so client components never need to import
 * anything from `@/lib/r2` (which pulls in the AWS SDK and reads server-only
 * env vars).
 */
export const ACCEPTED_LOGO_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
] as const;

export const MAX_LOGO_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB
