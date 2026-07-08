export function BrandPersonalityTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
