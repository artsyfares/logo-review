export function ReportSection({
  title,
  id,
  emphasis = "secondary",
  children,
}: {
  title: string;
  id?: string;
  emphasis?: "primary" | "secondary";
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 flex flex-col gap-3 border-t border-border pt-5">
      <h3
        className={
          emphasis === "primary"
            ? "text-base font-bold tracking-tight"
            : "text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        }
      >
        {title}
      </h3>
      {children}
    </section>
  );
}
