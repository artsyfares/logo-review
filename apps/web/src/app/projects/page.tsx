import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { ChevronRight, Plus } from "react-feather";
import { db } from "@/db";
import { logoAssets, projects } from "@/db/schema";
import { SubmitButton } from "@/components/submit-button";
import { createProject } from "./actions";

export default async function ProjectsPage() {
  const { userId } = await auth();

  const userProjects = userId
    ? await db
        .select({
          id: projects.id,
          name: projects.name,
          createdAt: projects.createdAt,
          logoCount: count(logoAssets.id),
        })
        .from(projects)
        .leftJoin(logoAssets, eq(logoAssets.projectId, projects.id))
        .where(eq(projects.userId, userId))
        .groupBy(projects.id)
        .orderBy(desc(projects.createdAt))
    : [];

  // Primary-logo thumbnail per project — latest version only, so a
  // re-uploaded primary swaps the preview instead of stacking previews.
  const primaryAssets = userId
    ? await db
        .select({ projectId: logoAssets.projectId, id: logoAssets.id, version: logoAssets.version })
        .from(logoAssets)
        .innerJoin(projects, eq(logoAssets.projectId, projects.id))
        .where(and(eq(projects.userId, userId), eq(logoAssets.type, "primary")))
    : [];

  const primaryAssetIdByProject = new Map<string, string>();
  const latestVersionByProject = new Map<string, number>();
  for (const asset of primaryAssets) {
    const existingVersion = latestVersionByProject.get(asset.projectId) ?? 0;
    if (asset.version > existingVersion) {
      latestVersionByProject.set(asset.projectId, asset.version);
      primaryAssetIdByProject.set(asset.projectId, asset.id);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>

      <form action={createProject} className="flex gap-2">
        <input
          name="name"
          placeholder="New project name"
          required
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <SubmitButton
          pendingLabel="Creating…"
          className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          <Plus size={16} />
          Create
        </SubmitButton>
      </form>

      <ul className="flex flex-col gap-2">
        {userProjects.map((project) => {
          const primaryAssetId = primaryAssetIdByProject.get(project.id);
          return (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white">
                    {primaryAssetId && (
                      // eslint-disable-next-line @next/next/no-img-element -- served from our own API route, not an optimizable static asset
                      <img
                        src={`/api/logo-assets/${primaryAssetId}`}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </span>
                  <span>{project.name}</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {project.logoCount} {project.logoCount === 1 ? "logo" : "logos"} ·{" "}
                  {project.createdAt.toLocaleDateString()}
                  <ChevronRight size={16} className="text-muted-foreground" />
                </span>
              </Link>
            </li>
          );
        })}
        {userProjects.length === 0 && (
          <li className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No projects yet — name your first one above to upload and review a logo.
          </li>
        )}
      </ul>
    </div>
  );
}
