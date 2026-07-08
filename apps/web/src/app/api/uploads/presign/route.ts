import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getStorageBucketName, getStorageClient } from "@/lib/object-storage";
import {
  ACCEPTED_LOGO_CONTENT_TYPES,
  MAX_LOGO_UPLOAD_BYTES,
} from "@/lib/logo-upload-constraints";
import { isUuid } from "@/lib/is-uuid";

interface PresignRequestBody {
  projectId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<PresignRequestBody>;
  const { projectId, filename, contentType, sizeBytes } = body;

  if (
    !projectId ||
    !filename ||
    !contentType ||
    sizeBytes === undefined ||
    sizeBytes === null
  ) {
    return NextResponse.json(
      { error: "projectId, filename, contentType, and sizeBytes are required" },
      { status: 400 },
    );
  }

  if (!isUuid(projectId)) {
    return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
  }

  const [project] = await db
    .select({ id: projects.id, userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (
    !ACCEPTED_LOGO_CONTENT_TYPES.includes(
      contentType as (typeof ACCEPTED_LOGO_CONTENT_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { error: `Unsupported content type: ${contentType}` },
      { status: 400 },
    );
  }

  if (sizeBytes > MAX_LOGO_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  // `filename` is client-controlled and only used for a human-readable
  // suffix in the storage console — strip it to a safe charset before it
  // becomes part of the object key (the real filename is preserved
  // separately in logo_assets.original_filename).
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const storageKey = `uploads/${userId}/${projectId}/${randomUUID()}-${safeFilename}`;

  const url = await getSignedUrl(
    getStorageClient(),
    new PutObjectCommand({
      Bucket: getStorageBucketName(),
      Key: storageKey,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );

  return NextResponse.json({ url, key: storageKey });
}
