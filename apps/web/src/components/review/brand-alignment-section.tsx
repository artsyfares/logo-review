import type { BrandAlignment } from "@logoai/shared";
import { ScoreRing } from "./score-ring";
import { ScoredParagraph } from "./scored-paragraph";
import { TextList } from "./text-list";
import { ReportSection as Section } from "./report-section";
import { PRINCIPLE_LABELS } from "./principle-labels";

/**
 * Its own dedicated tab (ROADMAP.md 1.9n), not a section buried in the main
 * report — a brief-mismatch is exactly the kind of finding that gets lost
 * in a long report otherwise. Breaks the brief into its three components
 * (overview/persona/value proposition) since a logo can nail one and miss
 * another; the overall score below is a holistic judgment, not their average.
 */
export function BrandAlignmentTab({ brandAlignment }: { brandAlignment: BrandAlignment }) {
  return (
    <article id="brand-alignment-tab-root" className="flex flex-col gap-5">
      <div className="flex items-center gap-4 rounded-md border border-border p-5">
        <ScoreRing score={brandAlignment.score} size={64} />
        <div>
          <p className="text-sm font-semibold">Overall brand fit</p>
          <p className="mt-1 text-sm leading-relaxed">{brandAlignment.summary}</p>
          <p className="mt-1 text-xs italic text-muted-foreground">
            Confidence: {brandAlignment.confidence}. Principles considered:{" "}
            {brandAlignment.principles.map((p) => PRINCIPLE_LABELS[p]).join(", ")}.
          </p>
        </div>
      </div>

      <Section title="Brand overview fit" emphasis="primary">
        <p className="text-xs text-muted-foreground">
          Does the mark&rsquo;s look and personality match what the brand says it is?
        </p>
        <ScoredParagraph label="Brand overview fit" dimension={brandAlignment.brandOverviewFit} />
      </Section>

      <Section title="Customer persona fit" emphasis="primary">
        <p className="text-xs text-muted-foreground">
          Would the stated target customer actually respond to this mark the way the brand needs
          them to?
        </p>
        <ScoredParagraph label="Customer persona fit" dimension={brandAlignment.customerPersonaFit} />
      </Section>

      <Section title="Value proposition fit" emphasis="primary">
        <p className="text-xs text-muted-foreground">
          Does the mark communicate — or at least not undercut — the brand&rsquo;s core promise?
        </p>
        <ScoredParagraph
          label="Value proposition fit"
          dimension={brandAlignment.valuePropositionFit}
        />
      </Section>

      <Section title="What's working">
        <TextList items={brandAlignment.whatToKeep} />
      </Section>

      <Section title="What to improve">
        <TextList items={brandAlignment.whatToModify} />
      </Section>
    </article>
  );
}
