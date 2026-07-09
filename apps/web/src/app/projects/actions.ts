"use server";

import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { asc, and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { logoAssets, projects, reviewMessages, reviews } from "@/db/schema";
import { analyzeLogo } from "@/lib/analysis-service";
import { generateChatReply } from "@/lib/ai/generate-chat-reply";
import type { LogoType } from "@/lib/ai/providers/types";
import { ensureCurrentUser } from "@/lib/current-user";
import {
  ACCEPTED_LOGO_CONTENT_TYPES,
  MAX_LOGO_UPLOAD_BYTES,
} from "@/lib/logo-upload-constraints";
import {
  fetchStorageObject,
  getStorageBucketName,
  getStorageClient,
} from "@/lib/object-storage";
import { isUuid } from "@/lib/is-uuid";
import { generateLogoReview } from "@/lib/ai/generate-review";

const LOGO_TYPES = ["primary", "secondary", "icon"] as const;

function isLogoType(value: unknown): value is LogoType {
  return typeof value === "string" && (LOGO_TYPES as readonly string[]).includes(value);
}

/**
 * Brand context is mandatory from project creation onward (ROADMAP.md
 * 1.9m) — every review needs a real brief to grade `brandAlignment`
 * against, and collecting it upfront beats discovering mid-review that
 * it's missing.
 */
export async function createProject(formData: FormData): Promise<void> {
  const { id: userId } = await ensureCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const brandOverview = String(formData.get("brandOverview") ?? "").trim();
  const customerPersona = String(formData.get("customerPersona") ?? "").trim();
  const valueProposition = String(formData.get("valueProposition") ?? "").trim();
  const brandReferences = String(formData.get("brandReferences") ?? "").trim() || null;

  if (!name) {
    throw new Error("Project name is required");
  }
  if (!brandOverview || !customerPersona || !valueProposition) {
    throw new Error("Brand overview, customer persona, and value proposition are all required");
  }

  const [project] = await db
    .insert(projects)
    .values({ userId, name, brandOverview, customerPersona, valueProposition, brandReferences })
    .returning({ id: projects.id });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

async function requireOwnedProject(projectId: string, userId: string) {
  if (!isUuid(projectId)) {
    throw new Error("Invalid projectId");
  }
  const [project] = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      brandOverview: projects.brandOverview,
      customerPersona: projects.customerPersona,
      valueProposition: projects.valueProposition,
      brandReferences: projects.brandReferences,
    })
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project || project.userId !== userId) {
    throw new Error("Project not found");
  }
  return project;
}

/** Rename a project and/or update its brand context — see ROADMAP.md 1.9c/1.9m/1.9o. */
export async function updateProject(projectId: string, formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  await requireOwnedProject(projectId, userId);

  const name = String(formData.get("name") ?? "").trim();
  const brandOverview = String(formData.get("brandOverview") ?? "").trim();
  const customerPersona = String(formData.get("customerPersona") ?? "").trim();
  const valueProposition = String(formData.get("valueProposition") ?? "").trim();
  const brandReferences = String(formData.get("brandReferences") ?? "").trim() || null;

  if (!name) {
    throw new Error("Project name is required");
  }
  if (!brandOverview || !customerPersona || !valueProposition) {
    throw new Error("Brand overview, customer persona, and value proposition are all required");
  }

  await db
    .update(projects)
    .set({
      name,
      brandOverview,
      customerPersona,
      valueProposition,
      brandReferences,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

/** Deletes the project and every logo/review/message under it — DB rows cascade, storage objects are cleaned up separately. */
export async function deleteProject(projectId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  await requireOwnedProject(projectId, userId);

  const assets = await db
    .select({ storageKey: logoAssets.storageKey })
    .from(logoAssets)
    .where(eq(logoAssets.projectId, projectId));

  await db.delete(projects).where(eq(projects.id, projectId));

  await Promise.all(
    assets.map((asset) =>
      getStorageClient()
        .send(new DeleteObjectCommand({ Bucket: getStorageBucketName(), Key: asset.storageKey }))
        .catch(() => {
          // Best-effort cleanup — the DB rows are already gone, an orphaned
          // storage object isn't worth failing the whole delete over.
        }),
    ),
  );

  revalidatePath("/projects");
  redirect("/projects");
}

/** Deletes a single logo version (and its reviews/messages via cascade) from a project. */
export async function deleteLogoAsset(logoAssetId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  if (!isUuid(logoAssetId)) {
    throw new Error("Invalid logoAssetId");
  }

  const [asset] = await db
    .select({
      id: logoAssets.id,
      storageKey: logoAssets.storageKey,
      projectId: logoAssets.projectId,
      projectUserId: projects.userId,
    })
    .from(logoAssets)
    .innerJoin(projects, eq(logoAssets.projectId, projects.id))
    .where(eq(logoAssets.id, logoAssetId));

  if (!asset || asset.projectUserId !== userId) {
    throw new Error("Logo not found");
  }

  await db.delete(logoAssets).where(eq(logoAssets.id, logoAssetId));

  await getStorageClient()
    .send(new DeleteObjectCommand({ Bucket: getStorageBucketName(), Key: asset.storageKey }))
    .catch(() => {});

  revalidatePath(`/projects/${asset.projectId}`);
}

export async function recordLogoAsset(input: {
  projectId: string;
  storageKey: string;
  originalFilename: string;
  logoType: LogoType;
}): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  const project = await requireOwnedProject(input.projectId, userId);
  if (!isLogoType(input.logoType)) {
    throw new Error("Invalid logo type");
  }

  // The presign route only ever issues keys under this exact prefix for this
  // user+project — a key outside it could not have come from our own upload
  // flow, so refuse it rather than trust client-supplied storage keys.
  const expectedPrefix = `uploads/${userId}/${input.projectId}/`;
  if (!input.storageKey.startsWith(expectedPrefix)) {
    throw new Error("Invalid storage key");
  }

  // Don't trust client-reported size/content-type — read the truth from storage.
  const head = await getStorageClient().send(
    new HeadObjectCommand({
      Bucket: getStorageBucketName(),
      Key: input.storageKey,
    }),
  );
  const contentType = head.ContentType ?? "";
  const sizeBytes = head.ContentLength ?? 0;

  const isAccepted = ACCEPTED_LOGO_CONTENT_TYPES.includes(
    contentType as (typeof ACCEPTED_LOGO_CONTENT_TYPES)[number],
  );
  const isWithinSizeLimit = sizeBytes <= MAX_LOGO_UPLOAD_BYTES;

  if (!isAccepted || !isWithinSizeLimit) {
    // The client-declared type/size only gated the presign step — this is the
    // real, server-verified check. Delete the object rather than leave an
    // invalid upload orphaned in the bucket.
    await getStorageClient().send(
      new DeleteObjectCommand({
        Bucket: getStorageBucketName(),
        Key: input.storageKey,
      }),
    );
    throw new Error(
      !isAccepted
        ? `Unsupported content type: ${contentType}`
        : "File too large",
    );
  }

  const kind = contentType === "image/svg+xml" ? "vector" : "raster";

  // Best-effort sequential versioning, per logo type — a theoretical race
  // between two concurrent uploads of the same type could produce a
  // duplicate version number; acceptable for now, not worth serializing for
  // at this scale.
  const [{ existingCount }] = await db
    .select({ existingCount: count() })
    .from(logoAssets)
    .where(and(eq(logoAssets.projectId, input.projectId), eq(logoAssets.type, input.logoType)));

  await db.insert(logoAssets).values({
    projectId: project.id,
    storageKey: input.storageKey,
    originalFilename: input.originalFilename,
    contentType,
    sizeBytes,
    kind,
    type: input.logoType,
    version: existingCount + 1,
  });

  revalidatePath(`/projects/${input.projectId}`);
}

/**
 * Synchronous for now — a multi-second AI call inside a Server Action is
 * fine for local dev and matches MVP scope (ROADMAP.md Phase 1.4), but
 * should become an async job before this runs on a platform with a request
 * timeout (see docs/PRODUCT_VISION.md "Performance Expectations").
 *
 * One review per PROJECT, not per uploaded asset — primary/secondary/icon
 * are variants of the same logo, so generating a review always centers on
 * the primary mark and folds in whichever of secondary/icon are present as
 * supporting variants (see ROADMAP.md 1.9l).
 */
export async function generateReview(projectId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  const project = await requireOwnedProject(projectId, userId);

  const assetRows = await db
    .select({
      storageKey: logoAssets.storageKey,
      originalFilename: logoAssets.originalFilename,
      contentType: logoAssets.contentType,
      type: logoAssets.type,
      version: logoAssets.version,
    })
    .from(logoAssets)
    .where(eq(logoAssets.projectId, project.id));

  const latestByType = new Map<string, (typeof assetRows)[number]>();
  for (const asset of assetRows) {
    const existing = latestByType.get(asset.type);
    if (!existing || asset.version > existing.version) {
      latestByType.set(asset.type, asset);
    }
  }

  const primaryAsset = latestByType.get("primary");
  if (!primaryAsset) {
    throw new Error("Upload a primary logo before generating a review");
  }
  latestByType.delete("primary");
  const variantAssets = Array.from(latestByType.values());

  const [review] = await db
    .insert(reviews)
    .values({ projectId: project.id, status: "pending" })
    .returning({ id: reviews.id });

  try {
    const { bytes, contentType } = await fetchStorageObject(primaryAsset.storageKey);
    const facts = await analyzeLogo(bytes, primaryAsset.originalFilename, contentType);

    const siblingVariants = await Promise.all(
      variantAssets.map(async (asset) => {
        const object = await fetchStorageObject(asset.storageKey);
        const variantFacts = await analyzeLogo(object.bytes, asset.originalFilename, object.contentType);
        return { type: asset.type, imageBase64: variantFacts.rendered_png_base64, facts: variantFacts };
      }),
    );

    // The analysis service always returns a PNG render regardless of the
    // original format (raster passthrough or rasterized SVG) — see
    // services/analysis/app/analysis/facts.py.
    const reviewData = await generateLogoReview({
      imageBase64: facts.rendered_png_base64,
      imageMediaType: "image/png",
      facts,
      logoType: "primary",
      brandContext: {
        brandOverview: project.brandOverview,
        customerPersona: project.customerPersona,
        valueProposition: project.valueProposition,
        brandReferences: project.brandReferences,
      },
      siblingVariants,
    });

    const siblingFacts = Object.fromEntries(
      siblingVariants.map((variant) => [variant.type, variant.facts]),
    );

    await db
      .update(reviews)
      .set({ status: "complete", reviewData, facts, siblingFacts })
      .where(eq(reviews.id, review.id));
  } catch (err) {
    await db.update(reviews).set({ status: "failed" }).where(eq(reviews.id, review.id));
    // Deliberately not re-thrown: the row above is already marked "failed",
    // and the page's own status-driven UI (a "Review generation failed /
    // Retry" block) is the intended way to surface this — re-throwing here
    // instead crashed the whole page with Next.js's raw error overlay on
    // every transient network hiccup calling the AI provider, hiding the
    // graceful path that already existed for exactly this case.
    console.error("generateReview failed", err);
  }

  revalidatePath(`/projects/${project.id}`);
}

/**
 * Follow-up chat about an already-generated review — see ROADMAP.md 1.6 and
 * docs/PRODUCT_VISION.md "AI Collaboration". Scoped to a single review, and
 * since a project now has exactly one review (covering primary + any
 * secondary/icon variants), this is effectively one thread per project.
 */
export async function sendReviewMessage(reviewId: string, formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  if (!isUuid(reviewId)) {
    throw new Error("Invalid reviewId");
  }

  const content = String(formData.get("content") ?? "").trim();
  if (!content) {
    throw new Error("Message is required");
  }

  const [review] = await db
    .select({
      id: reviews.id,
      reviewData: reviews.reviewData,
      facts: reviews.facts,
      projectId: reviews.projectId,
      projectUserId: projects.userId,
    })
    .from(reviews)
    .innerJoin(projects, eq(reviews.projectId, projects.id))
    .where(eq(reviews.id, reviewId));

  if (!review || review.projectUserId !== userId) {
    throw new Error("Review not found");
  }
  if (!review.reviewData || !review.facts) {
    throw new Error("This review has no stored data to chat about — regenerate it first");
  }

  await db.insert(reviewMessages).values({ reviewId, role: "user", content });

  const history = await db
    .select({ role: reviewMessages.role, content: reviewMessages.content })
    .from(reviewMessages)
    .where(eq(reviewMessages.reviewId, reviewId))
    .orderBy(asc(reviewMessages.createdAt));

  const reply = await generateChatReply({
    review: review.reviewData,
    facts: review.facts,
    messages: history,
  });

  await db.insert(reviewMessages).values({ reviewId, role: "assistant", content: reply });

  revalidatePath(`/projects/${review.projectId}`);
}
