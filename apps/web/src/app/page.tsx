import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckSquare,
  Download,
  Info,
  Layers,
  MessageCircle,
} from "react-feather";
import { AnimatedScoreRing } from "@/components/animated-score-ring";
import { Reveal } from "@/components/reveal";

const FEATURES = [
  {
    icon: Activity,
    title: "Measured, not eyeballed",
    body: "Contrast ratios, symmetry, whitespace balance, and scalability at six sizes — computed by a dedicated analysis engine, not guessed by a language model.",
  },
  {
    icon: Info,
    title: "Every score explains itself",
    body: "No bare numbers. Every verdict ships with the reasoning behind it, the design principles it's grounded in, and a confidence level.",
  },
  {
    icon: CheckSquare,
    title: "A plan, not a wall of text",
    body: "Fixes ranked by impact, plus redesign directions with real trade-offs — so you know what to change first, not just that something's off.",
  },
  {
    icon: Layers,
    title: "One logo, every variant",
    body: "Primary, secondary, and icon are treated as one family. The report tells you which file to reach for — favicon, app icon, letterhead.",
  },
  {
    icon: Download,
    title: "Client-ready in one click",
    body: "Export a properly paginated PDF report you can hand straight to a client — not a screenshot of a webpage stretched onto a page.",
  },
  {
    icon: MessageCircle,
    title: "Keep the conversation going",
    body: "Ask “why does this feel unbalanced” or “suggest three modern directions” and keep iterating without starting a new review.",
  },
];

const STEPS = [
  {
    title: "Upload your primary logo",
    body: "That's the only requirement. Add a secondary lockup or icon too, and the report treats all three as one logo family.",
  },
  {
    title: "Deterministic analysis runs instantly",
    body: "Contrast, symmetry, whitespace, and scalability across six render sizes — measured with real algorithms.",
  },
  {
    title: "AI reasons over the real data",
    body: "A structured report: overview, action plan, detailed category scores, risk flags, and a full visual breakdown.",
  },
  {
    title: "Iterate until it's ready",
    body: "Ask follow-up questions, regenerate after changes, and export a client-ready PDF when it's actually done.",
  },
];

const PRINCIPLES = [
  {
    title: "Explanation over prediction",
    body: "Every score ships with reasoning and a confidence level. A number with nothing behind it is a bug, not a feature.",
  },
  {
    title: "Designer control, always",
    body: "LogoAI proposes redesign directions with trade-offs. It never auto-applies a fix or silently edits your file.",
  },
  {
    title: "Collaboration, not generation",
    body: "A critique partner for the logo you already made — not a machine that hands you fifty options to pick from.",
  },
];

const FAQS = [
  {
    q: "Does LogoAI generate logos for me?",
    a: "No. It reviews and critiques logos you or your team have already designed — it never proposes finished logos of its own.",
  },
  {
    q: "What if I only have a primary logo?",
    a: "That's fine — only the primary logo is required. Add a secondary lockup or icon later and the report treats them as one family.",
  },
  {
    q: "How long does a review take?",
    a: "Usually 20–40 seconds for the full AI-reasoned report. The deterministic measurements — contrast, symmetry, scalability — are close to instant.",
  },
  {
    q: "What file types are supported?",
    a: "PNG, JPG, or SVG, up to 15MB.",
  },
  {
    q: "Can I keep talking to it after the report comes back?",
    a: "Yes — every report has a follow-up chat scoped to that specific logo, so you can ask about a specific concern or request redesign directions.",
  },
];

function HeroCta({ label }: { label: string }) {
  return (
    <>
      <Show when="signed-in">
        <Link
          href="/projects"
          className="flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/20 active:translate-y-0"
        >
          Go to your projects
          <ArrowRight size={16} />
        </Link>
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/20 active:translate-y-0"
          >
            {label}
            <ArrowRight size={16} />
          </button>
        </SignInButton>
      </Show>
    </>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      {/* Hero */}
      <section className="relative flex flex-col items-center gap-6 px-6 pb-20 pt-24 text-center sm:pt-32">
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-[60%] rounded-full bg-accent/20 blur-3xl"
        />
        <div
          aria-hidden
          className="animate-drift-slow pointer-events-none absolute -top-10 left-1/2 h-[360px] w-[360px] translate-x-[10%] rounded-full bg-accent/10 blur-3xl"
        />

        <span className="relative flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          For branding professionals — not another logo generator
        </span>
        <h1 className="relative max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Stress-test your logo before your client does.
        </h1>
        <p className="relative max-w-xl text-balance text-muted-foreground">
          Upload a finished logo and get a structured critique grounded in real measurements —
          contrast ratios, symmetry, scalability at six sizes — plus AI reasoning that explains
          every score instead of handing you a bare number.
        </p>
        <div className="relative mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <HeroCta label="Review your first logo" />
          <a
            href="#how-it-works"
            className="flex items-center gap-1.5 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            See how it works
          </a>
        </div>
        <p className="relative text-xs text-muted-foreground">
          Free to try · No credit card · Never generates a logo for you
        </p>
      </section>

      {/* Differentiation strip */}
      <Reveal>
        <section className="border-y border-border bg-muted/40 px-6 py-14">
          <div className="mx-auto flex max-w-4xl flex-col gap-8 sm:flex-row">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Generators</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Give you fifty logos and hope one sticks. You still don&rsquo;t know why any of
                them work, or how to defend the one you pick.
              </p>
            </div>
            <div className="flex-1 border-t border-border pt-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
              <h2 className="text-lg font-semibold text-accent">LogoAI</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Takes the logo you already designed and tells you, with evidence, whether
                it&rsquo;s ready — and exactly what to fix if it&rsquo;s not.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Report preview */}
      <section className="px-6 py-20">
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            A report you can actually act on
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            Not a single score. A full breakdown, grounded in real measurements, explained in
            plain language.
          </p>
        </Reveal>

        <Reveal delayMs={150} className="mx-auto mt-10 max-w-lg">
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center gap-4">
              <AnimatedScoreRing score={78} size={56} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Close — needs targeted fixes before presenting
                </p>
                <p className="text-xs text-muted-foreground">
                  Top priority: Refine the wordmark contrast on white backgrounds
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm leading-relaxed text-foreground">
                The primary mark scales cleanly down to 32px, but the secondary wordmark drops
                below 75% detail retention at 16px, risking legibility in favicon-sized contexts.
              </p>
              <p className="mt-2 text-xs italic text-muted-foreground">
                Confidence: high. Principles considered: Scalability over temporary solutions,
                Designer control over AI control.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              What you get
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delayMs={(index % 3) * 80}>
                <div className="group flex h-full flex-col gap-3 rounded-lg border border-transparent p-4 transition-all hover:-translate-y-1 hover:border-border hover:bg-card hover:shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent transition-transform group-hover:scale-110">
                    <feature.icon size={18} />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-6 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              How it works
            </h2>
          </Reveal>
          <ol className="relative mt-12 flex flex-col gap-8">
            <div
              aria-hidden
              className="absolute bottom-4 left-4 top-4 w-px bg-border sm:left-4"
            />
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delayMs={index * 100}>
                <li className="relative flex gap-4">
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Principles */}
      <section className="border-y border-border bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              The AI never grades in the dark
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {PRINCIPLES.map((principle, index) => (
              <Reveal key={principle.title} delayMs={index * 100}>
                <div className="h-full rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {principle.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Questions
            </h2>
          </Reveal>
          <div className="mt-10 flex flex-col divide-y divide-border border-t border-border">
            {FAQS.map((faq, index) => (
              <Reveal key={faq.q} delayMs={index * 60}>
                <div className="py-5">
                  <h3 className="text-sm font-semibold text-foreground">{faq.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <Reveal>
        <section className="relative overflow-hidden border-t border-border px-6 py-20 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
          />
          <h2 className="relative text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            See what your logo is actually doing.
          </h2>
          <div className="relative mt-6 flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <HeroCta label="Review your first logo" />
            </div>
            <p className="text-xs text-muted-foreground">
              Free to try · No credit card · Never generates a logo for you
            </p>
          </div>
        </section>
      </Reveal>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <span>LogoAI — a design partner, not a generator.</span>
          <span>&copy; {new Date().getFullYear()} LogoAI</span>
        </div>
      </footer>
    </div>
  );
}
