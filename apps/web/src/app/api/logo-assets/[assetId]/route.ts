import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { logoAssets, projects } from "@/db/schema";
import { fetchStorageObject } from "@/lib/object-storage";
import { isUuid } from "@/lib/is-uuid";

/** Streams a logo asset's raw uploaded bytes — used for list-page thumbnails, where no review (and thus no cached rendered_png_base64) may exist yet. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isUuid(assetId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [asset] = await db
    .select({
      storageKey: logoAssets.storageKey,
      contentType: logoAssets.contentType,
      projectUserId: projects.userId,
    })
    .from(logoAssets)
    .innerJoin(projects, eq(logoAssets.projectId, projects.id))
    .where(eq(logoAssets.id, assetId));

  if (!asset || asset.projectUserId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { bytes, contentType } = await fetchStorageObject(asset.storageKey);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType || asset.contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
