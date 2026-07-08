import { Check, Settings, Trash2 } from "react-feather";
import { deleteProject, updateProject } from "@/app/projects/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SubmitButton } from "@/components/submit-button";

export function ProjectSettings({
  project,
}: {
  project: {
    id: string;
    name: string;
    brandOverview: string | null;
    customerPersona: string | null;
    valueProposition: string | null;
  };
}) {
  return (
    <details className="rounded-md border border-border">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
        <Settings size={14} />
        Project settings
      </summary>

      <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
        <form action={updateProject.bind(null, project.id)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Project name
            <input
              name="name"
              defaultValue={project.name}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Brand overview{" "}
            <span className="text-xs text-muted-foreground">(optional)</span>
            <textarea
              name="brandOverview"
              defaultValue={project.brandOverview ?? ""}
              rows={2}
              placeholder="What is this brand, what does it do, what's its personality?"
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Customer persona{" "}
            <span className="text-xs text-muted-foreground">(optional)</span>
            <textarea
              name="customerPersona"
              defaultValue={project.customerPersona ?? ""}
              rows={2}
              placeholder="Who is this logo for?"
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Value proposition{" "}
            <span className="text-xs text-muted-foreground">(optional)</span>
            <textarea
              name="valueProposition"
              defaultValue={project.valueProposition ?? ""}
              rows={2}
              placeholder="What's the core promise/value this brand delivers?"
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <SubmitButton
            pendingLabel="Saving…"
            className="flex items-center gap-1.5 self-start rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            <Check size={14} />
            Save
          </SubmitButton>
        </form>

        <form action={deleteProject.bind(null, project.id)} className="border-t border-border pt-4">
          <ConfirmSubmitButton
            confirmMessage={`Delete "${project.name}" and everything in it? This can't be undone.`}
            pendingLabel="Deleting…"
            className="flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-60"
          >
            <Trash2 size={14} />
            Delete this project
          </ConfirmSubmitButton>
        </form>
      </div>
    </details>
  );
}
