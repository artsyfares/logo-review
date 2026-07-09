import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, RefreshCw, Zap } from "react-feather";
import { db } from "@/db";
import { logoAssets, projects, reviewMessages, reviews } from "@/db/schema";
import { LogoUploader } from "@/components/logo-uploader";
import { LogoReviewDisplay } from "@/components/review/logo-review-display";
import { VisualAnalysisTab } from "@/components/review/visual-analysis-tab";
import { ExecutiveSummarySection } from "@/components/review/executive-summary-section";
import { BrandAlignmentTab } from "@/components/review/brand-alignment-section";
import { StuckPendingNotice } from "@/components/review/stuck-pending-notice";
import { ReviewTabs } from "@/components/review/review-tabs";
import { ChatSidePanel } from "@/components/review/chat-side-panel";
import { FullReportExportButton } from "@/components/review/full-report-export-button";
import { ProjectSettings } from "@/components/project-settings";
import { SubmitButton } from "@/components/submit-button";
import { PendingProgressBar } from "@/components/pending-progress-bar";
import { isUuid } from "@/lib/is-uuid";
import type { LogoType } from "@/lib/ai/providers/types";
import { generateReview } from "../actions";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { userId } = await auth();
  if (!userId) {
    notFound();
  }
  if (!isUuid(projectId)) {
    notFound();
  }

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      brandOverview: projects.brandOverview,
      customerPersona: projects.customerPersona,
      valueProposition: projects.valueProposition,
      brandReferences: projects.brandReferences,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  if (!project) {
    notFound();
  }

  const assets = await db
    .select({
      id: logoAssets.id,
      originalFilename: logoAssets.originalFilename,
      type: logoAssets.type,
      version: logoAssets.version,
      createdAt: logoAssets.createdAt,
    })
    .from(logoAssets)
    .where(eq(logoAssets.projectId, project.id))
    .orderBy(desc(logoAssets.version));

  // "Latest" per type — a slot's current file is whichever version of that
  // type was uploaded most recently, since primary/secondary/icon are one
  // logo family with at most one active file per role.
  const latestAssetByType = new Map<LogoType, (typeof assets)[number]>();
  for (const asset of assets) {
    if (!latestAssetByType.has(asset.type)) {
      latestAssetByType.set(asset.type, asset);
    }
  }
  const primaryAsset = latestAssetByType.get("primary") ?? null;
  const secondaryAsset = latestAssetByType.get("secondary") ?? null;
  const iconAsset = latestAssetByType.get("icon") ?? null;

  const projectReviews = await db
    .select({
      id: reviews.id,
      status: reviews.status,
      reviewData: reviews.reviewData,
      facts: reviews.facts,
      siblingFacts: reviews.siblingFacts,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(eq(reviews.projectId, project.id))
    .orderBy(desc(reviews.createdAt));

  const review = projectReviews[0] ?? null;
  // The most recent *complete* review before the one being displayed —
  // powers the "since your last review" diff. Skipped if the currently
  // displayed review is itself not complete (nothing meaningful to diff
  // against yet) or predates the current report shape.
  const previousReview =
    review?.status === "complete"
      ? (projectReviews.slice(1).find((r) => r.status === "complete" && r.reviewData) ?? null)
      : null;

  const messages = review
    ? await db
        .select({ role: reviewMessages.role, content: reviewMessages.content })
        .from(reviewMessages)
        .where(eq(reviewMessages.reviewId, review.id))
        .orderBy(asc(reviewMessages.createdAt))
    : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link
          href="/projects"
          className="flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={12} />
          All projects
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
      </div>

      <ProjectSettings project={project} />

      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Primary, secondary, and icon are variants of the same logo — upload whichever you have.
          The report treats them as one family (e.g. it recommends the icon for favicons).
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <LogoUploader
            projectId={project.id}
            type="primary"
            label="Primary logo"
            required
            existingAsset={primaryAsset}
          />
          <LogoUploader
            projectId={project.id}
            type="secondary"
            label="Secondary logo"
            existingAsset={secondaryAsset}
          />
          <LogoUploader
            projectId={project.id}
            type="icon"
            label="Icon"
            existingAsset={iconAsset}
          />
        </div>
      </div>

      {!primaryAsset && (
        <p className="text-sm text-muted-foreground">
          Upload a primary logo above to generate a review.
        </p>
      )}

      {primaryAsset && !review && (
        <form action={generateReview.bind(null, project.id)} className="flex flex-col gap-2">
          <SubmitButton
            pendingLabel="Analyzing… (usually 20-40s)"
            className="flex items-center gap-1.5 self-start rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            <Zap size={14} />
            Generate review
          </SubmitButton>
          <PendingProgressBar label="Uploading, analyzing, and writing the review — usually 20-40 seconds." />
        </form>
      )}

      {review?.status === "pending" && (
        <div className="flex flex-col items-start gap-2">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw size={12} className="animate-spin" />
            Generating review…
          </p>
          <StuckPendingNotice
            createdAt={review.createdAt}
            action={generateReview.bind(null, project.id)}
          />
        </div>
      )}

      {review?.status === "failed" && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-xs text-red-500">Review generation failed.</p>
          <form action={generateReview.bind(null, project.id)}>
            <SubmitButton
              pendingLabel="Retrying…"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={12} />
              Retry
            </SubmitButton>
          </form>
        </div>
      )}

      {review?.status === "complete" && review.reviewData && (
        <div className="flex flex-col gap-5 border-t border-border pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <FullReportExportButton
              projectName={project.name}
              primaryLogoBase64={review.facts?.rendered_png_base64}
              overallScore={review.reviewData.overallQuality?.score}
              generatedAt={review.createdAt.toLocaleDateString()}
            />
            <form action={generateReview.bind(null, project.id)} className="flex flex-col items-end gap-2">
              <SubmitButton
                pendingLabel="Regenerating… (usually 20-40s)"
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw size={12} />
                Regenerate review
              </SubmitButton>
              <PendingProgressBar label="Regenerating this review — usually 20-40 seconds." />
            </form>
          </div>
          <ReviewTabs
            summaryTab={
              <ExecutiveSummarySection
                review={review.reviewData}
                facts={review.facts}
                siblingFacts={review.siblingFacts}
                previousReview={previousReview?.reviewData}
                previousCreatedAt={previousReview?.createdAt}
              />
            }
            brandAlignmentTab={
              // The three per-aspect fits are newer than `brandAlignment`
              // itself — a review generated between those two additions
              // would have the field but not its sub-fits, so check for the
              // sub-fit specifically rather than crashing on it being absent.
              review.reviewData.brandAlignment?.brandOverviewFit ? (
                <BrandAlignmentTab brandAlignment={review.reviewData.brandAlignment} />
              ) : undefined
            }
            reportTab={
              <LogoReviewDisplay
                review={review.reviewData}
                facts={review.facts}
                logoType="primary"
                siblingFacts={review.siblingFacts}
              />
            }
            visualAnalysisTab={
              <VisualAnalysisTab
                review={review.reviewData}
                facts={review.facts}
                siblingFacts={review.siblingFacts}
                assetName={primaryAsset?.originalFilename ?? project.name}
                assetDate={review.createdAt}
              />
            }
          />
          {review.facts ? (
            <ChatSidePanel reviewId={review.id} messages={messages} />
          ) : (
            <p className="border-t border-border pt-5 text-xs text-muted-foreground">
              Regenerate this review to enable follow-up chat.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
