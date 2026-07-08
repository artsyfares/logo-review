"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle, RefreshCw, Trash2, Upload, X } from "react-feather";
import { deleteLogoAsset, recordLogoAsset } from "@/app/projects/actions";
import { ACCEPTED_LOGO_CONTENT_TYPES } from "@/lib/logo-upload-constraints";
import type { LogoType } from "@/lib/ai/providers/types";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const ACCEPTED_TYPES: readonly string[] = ACCEPTED_LOGO_CONTENT_TYPES;

export function LogoUploader({
  projectId,
  type,
  label,
  required,
  existingAsset,
}: {
  projectId: string;
  type: LogoType;
  label: string;
  required?: boolean;
  existingAsset?: { id: string; originalFilename: string; version: number } | null;
}) {
  const [isReplacing, setIsReplacing] = useState(false);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "uploading" } | { kind: "error"; message: string } | { kind: "done" }
  >({ kind: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isUploading = status.kind === "uploading";

  const upload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setStatus({ kind: "error", message: `Unsupported file type: ${file.type || "unknown"}` });
        return;
      }

      setStatus({ kind: "uploading" });
      try {
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            filename: file.name,
            contentType: file.type,
            sizeBytes: file.size,
          }),
        });

        if (!presignRes.ok) {
          const { error } = await presignRes.json();
          throw new Error(error ?? "Failed to get upload URL");
        }

        const { url, key } = await presignRes.json();

        const putRes = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) {
          throw new Error("Upload to storage failed");
        }

        await recordLogoAsset({
          projectId,
          storageKey: key,
          originalFilename: file.name,
          logoType: type,
        });

        setStatus({ kind: "done" });
        setIsReplacing(false);
      } catch (err) {
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Upload failed",
        });
      }
    },
    [projectId, type],
  );

  const showDropzone = !existingAsset || isReplacing;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <span className="text-sm font-medium">
        {label} {required ? <span className="text-red-500">*</span> : <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
      </span>

      {existingAsset && !isReplacing && (
        <>
          <p className="break-all text-xs text-muted-foreground">
            {existingAsset.originalFilename}
            {existingAsset.version > 1 ? ` · v${existingAsset.version}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsReplacing(true)}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              <RefreshCw size={12} />
              Replace
            </button>
            {!required && (
              <form action={deleteLogoAsset.bind(null, existingAsset.id)}>
                <ConfirmSubmitButton
                  confirmMessage={`Remove "${existingAsset.originalFilename}"?`}
                  pendingLabel="Removing…"
                  className="flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-60"
                >
                  <Trash2 size={12} />
                  Remove
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        </>
      )}

      {showDropzone && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (isUploading) return;
            const file = e.dataTransfer.files[0];
            if (file) void upload(file);
          }}
          onPaste={(e) => {
            if (isUploading) return;
            const file = Array.from(e.clipboardData.items)
              .find((item) => item.kind === "file")
              ?.getAsFile();
            if (file) void upload(file);
          }}
          tabIndex={0}
          className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-3 py-6 text-center text-xs transition-colors ${
            isDragging ? "border-accent bg-muted" : "border-border"
          }`}
        >
          <p className="text-muted-foreground">Drag &amp; drop or paste a logo here</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60"
          >
            <Upload size={12} />
            Browse files
          </button>
          <p className="text-[10px] text-muted-foreground">PNG, JPG, or SVG — up to 15MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          {existingAsset && isReplacing && (
            <button
              type="button"
              onClick={() => {
                setIsReplacing(false);
                setStatus({ kind: "idle" });
              }}
              disabled={isUploading}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60"
            >
              <X size={10} />
              Cancel
            </button>
          )}
          {status.kind === "uploading" && (
            <p className="flex items-center gap-1 text-xs text-accent">
              <RefreshCw size={12} className="animate-spin" />
              Uploading…
            </p>
          )}
          {status.kind === "error" && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle size={12} />
              {status.message}
            </p>
          )}
          {status.kind === "done" && (
            <p className="flex items-center gap-1 text-xs text-accent">
              <CheckCircle size={12} />
              Uploaded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
