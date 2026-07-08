"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { AlertCircle, Download } from "react-feather";
import { ProgressBar } from "@/components/progress-bar";

interface CapturedBlock {
  dataUrl: string;
  width: number;
  height: number;
}

function loadImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error("Failed to load captured image"));
    image.src = dataUrl;
  });
}

const MARGIN = 36; // 0.5in at 72pt/in
const BLOCK_GAP = 12;
// A4 in points, matching the `format: "a4"` the PDF is created with below —
// hardcoded here because the capture pass runs before the jsPDF instance
// exists, so it can't ask the instance for its own page size.
const PAGE_WIDTH_PT = 595.28;
const PAGE_HEIGHT_PT = 841.89;
const USABLE_WIDTH_PT = PAGE_WIDTH_PT - MARGIN * 2;
const USABLE_HEIGHT_PT = PAGE_HEIGHT_PT - MARGIN * 2;

function visibleChildren(element: Element): HTMLElement[] {
  return Array.from(element.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.offsetWidth > 0 && child.offsetHeight > 0,
  );
}

async function captureElement(element: HTMLElement): Promise<CapturedBlock | null> {
  const dataUrl = await toPng(element, { backgroundColor: "#ffffff", pixelRatio: 2 });
  const { width, height } = await loadImageSize(dataUrl);
  // A capture with a degenerate width blows up the page-layout math (a
  // near-zero divisor scales a normal height into thousands of PDF pages)
  // — skip rather than risk it, since a captured block should never
  // legitimately be this narrow.
  if (width < 10 || height < 10) return null;
  return { dataUrl, width, height };
}

/**
 * Captures `element` as one image, unless it's taller than one printed page
 * would hold AND has more than one child to split across — in which case it
 * recurses into its own children instead of capturing itself whole. This is
 * what keeps a page break from landing in the middle of one card/list item:
 * a long section (e.g. "Deeper insights", with several sub-groups) gets
 * split into its natural sub-blocks first, and if even one of those is
 * still too tall, the recursion goes one level deeper again (e.g. into a
 * checklist's individual `<li>` items) until each piece fits.
 */
async function captureBlockOrSplit(element: HTMLElement, maxHeightCss: number): Promise<CapturedBlock[]> {
  const children = visibleChildren(element);
  if (element.offsetHeight > maxHeightCss && children.length > 1) {
    const blocks: CapturedBlock[] = [];
    for (const child of children) {
      blocks.push(...(await captureBlockOrSplit(child, maxHeightCss)));
    }
    return blocks;
  }

  const block = await captureElement(element);
  return block ? [block] : [];
}

/**
 * Captures each direct child of a report/visual-analysis root as its OWN
 * image (recursing further into any child too tall for one page — see
 * `captureBlockOrSplit`), rather than one giant screenshot of the whole
 * thing — this is what lets the PDF later keep each card/section intact on
 * a page instead of mechanically slicing through the middle of one.
 *
 * The root may currently be hidden inside the tabbed view (a `display:none`
 * ancestor — the `hidden` wrapper `ReviewTabs` puts around the inactive tab
 * — makes html-to-image capture a blank, zero-size image), so this briefly
 * un-hides its wrapper, captures, and restores it. Runs one root fully
 * before starting the next (not concurrently) so only one tab's wrapper is
 * ever un-hidden at a time.
 */
/** Waits for the browser to actually paint, not just schedule, a layout change — one rAF only guarantees a frame has been *requested*, not that styles/layout have settled, so this waits two. */
function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Waits for every `<img>` inside `root` to finish DECODING, not just
 * laying out. Browsers commonly defer decoding images inside a
 * `display:none` subtree until it becomes visible again, and that decode
 * is asynchronous and separate from layout/paint — a layout-only wait
 * (`waitForLayout`) can resolve while an image's pixels still aren't ready,
 * which is what produced a mostly-blank capture with only a sliver of the
 * logo visible (whatever few pixels happened to have decoded by the
 * moment the canvas snapshot was taken).
 */
async function waitForImagesDecoded(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((img) =>
      img.decode().catch(() => {
        // A genuinely broken image shouldn't block the whole export.
      }),
    ),
  );
}

/**
 * Hides every element marked `data-pdf-skip` (at any nesting depth) for the
 * duration of the export, returning a function that restores them. Used for
 * the report's logo thumbnail, which repeatedly captured as a
 * garbled/mispositioned fragment despite several rounds of timing fixes —
 * rather than continuing to chase that, it's excluded from the exported PDF
 * entirely. A hide/restore (rather than filtering it out of the capture
 * walk) handles it regardless of how deeply it's nested in the DOM.
 */
function hideSkippedElements(root: HTMLElement): () => void {
  const skipped = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-skip]"));
  const previousDisplay = skipped.map((el) => el.style.display);
  for (const el of skipped) el.style.display = "none";
  return () => {
    skipped.forEach((el, index) => {
      el.style.display = previousDisplay[index];
    });
  };
}

async function captureBlocks(rootId: string): Promise<CapturedBlock[]> {
  const root = document.getElementById(rootId);
  if (!root) return [];

  const wrapper = root.parentElement;
  const wasHidden = wrapper?.hidden ?? false;
  if (wrapper) wrapper.hidden = false;
  const restoreSkipped = hideSkippedElements(root);
  // Un-hiding is synchronous, but the browser hasn't necessarily finished
  // laying out, painting, AND decoding the newly-visible content yet —
  // capturing immediately risked grabbing whichever child happened to be
  // captured first mid-reflow or mid-decode, producing a garbled/mostly-
  // blank image while every later block (captured after several other
  // `await`s had already let the browser catch up) was fine.
  if (wrapper && wasHidden) {
    await waitForLayout();
    await waitForImagesDecoded(root);
  }

  try {
    const topLevelChildren = visibleChildren(root);
    if (topLevelChildren.length === 0) return [];

    // Most sections span the full content column, so the widest child is a
    // reliable stand-in for "how wide is one printed page" in CSS-pixel
    // terms — from there, one page's worth of height (in those same CSS
    // pixels) is just that width scaled by the page's own aspect ratio.
    const referenceWidthCss = Math.max(...topLevelChildren.map((child) => child.offsetWidth));
    const maxHeightCss = referenceWidthCss * (USABLE_HEIGHT_PT / USABLE_WIDTH_PT);

    const blocks: CapturedBlock[] = [];
    for (const child of topLevelChildren) {
      blocks.push(...(await captureBlockOrSplit(child, maxHeightCss)));
    }
    return blocks;
  } finally {
    restoreSkipped();
    if (wrapper) wrapper.hidden = wasHidden;
  }
}

// A hard backstop, not an expected case: even the tallest realistic report
// section shouldn't need more than a handful of pages. If the math ever
// goes wrong again (a degenerate image size slipping past the checks in
// `captureBlocks`), stop instead of silently building a runaway,
// unusable-size PDF like the one this constant was added in response to.
const MAX_SLICES_PER_BLOCK = 20;

/**
 * Crops a horizontal strip out of a source image via an offscreen canvas,
 * returning it as its own PNG data URL. Used instead of jsPDF's usual
 * "redraw the whole image at a negative Y offset per page" pagination trick
 * — that trick only looks right if the viewer strictly clips each page's
 * drawing to its own boundary, which isn't reliable everywhere (especially
 * continuous-scroll PDF viewers), and showed up as duplicated/overlapping
 * content bleeding across page breaks. A real crop has nothing to bleed:
 * each page gets a distinct, non-overlapping slice of pixels.
 */
function cropImageSlice(
  image: HTMLImageElement,
  sourceTopPx: number,
  sourceHeightPx: number,
  imgWidth: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = imgWidth;
  canvas.height = sourceHeightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context for PDF export");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, imgWidth, sourceHeightPx);
  ctx.drawImage(image, 0, sourceTopPx, imgWidth, sourceHeightPx, 0, 0, imgWidth, sourceHeightPx);
  return canvas.toDataURL("image/png");
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load captured image"));
    image.src = dataUrl;
  });
}

/** A single block taller than one whole page — the only case that still needs slicing across pages. */
async function addSlicedImage(
  pdf: jsPDF,
  dataUrl: string,
  imgWidth: number,
  imgHeight: number,
  startY: number,
  scaledWidth: number,
  x: number,
  globalScale: number,
) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ptToPx = 1 / globalScale; // source pixels per PDF point, at this render scale

  const image = await loadImage(dataUrl);
  let sourceY = 0;
  let currentY = startY;
  let remainingPx = imgHeight;
  let slices = 0;

  while (remainingPx > 0 && slices < MAX_SLICES_PER_BLOCK) {
    const availablePt = pageHeight - currentY - MARGIN;
    const sliceHeightPx = Math.min(remainingPx, Math.floor(availablePt * ptToPx));
    if (sliceHeightPx <= 0) break;

    const sliceDataUrl = cropImageSlice(image, sourceY, sliceHeightPx, imgWidth);
    const sliceHeightPt = sliceHeightPx * globalScale;
    pdf.addImage(sliceDataUrl, "PNG", x, currentY, scaledWidth, sliceHeightPt);

    sourceY += sliceHeightPx;
    remainingPx -= sliceHeightPx;
    slices++;

    if (remainingPx > 0) {
      pdf.addPage();
      currentY = MARGIN;
    }
  }
}

/**
 * Lays out blocks top to bottom, starting a fresh page whenever the next
 * block wouldn't fit in the remaining space — never cuts a block in half
 * unless it's taller than a whole page on its own.
 *
 * Every block shares ONE scale factor (derived from the widest block, which
 * stands in for "the full content column width") instead of each block
 * being independently stretched to fill the page — otherwise a
 * legitimately narrow, centered element (e.g. a small logo thumbnail card)
 * gets blown up to full page width along with everything else, distorting
 * the layout even though its own aspect ratio stays correct.
 */
async function layoutBlocks(pdf: jsPDF, blocks: CapturedBlock[]) {
  if (blocks.length === 0) return;

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - MARGIN * 2;
  const usableHeight = pageHeight - MARGIN * 2;

  const referenceWidth = Math.max(...blocks.map((block) => block.width));
  const globalScale = usableWidth / referenceWidth;

  let cursorY: number | null = null;

  for (const block of blocks) {
    const scaledWidth = block.width * globalScale;
    const scaledHeight = block.height * globalScale;
    const x = MARGIN + (usableWidth - scaledWidth) / 2;

    if (cursorY === null) {
      pdf.addPage();
      cursorY = MARGIN;
    } else if (cursorY + scaledHeight > pageHeight - MARGIN) {
      pdf.addPage();
      cursorY = MARGIN;
    }

    if (scaledHeight > usableHeight) {
      await addSlicedImage(pdf, block.dataUrl, block.width, block.height, cursorY, scaledWidth, x, globalScale);
      cursorY = null;
    } else {
      pdf.addImage(block.dataUrl, "PNG", x, cursorY, scaledWidth, scaledHeight);
      cursorY += scaledHeight + BLOCK_GAP;
    }
  }
}

function addDividerPage(pdf: jsPDF, title: string) {
  pdf.addPage();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(20);
  pdf.text(title, pageWidth / 2, pageHeight / 2, { align: "center" });
}

/**
 * One export covering both the Report and Visual Analysis tabs as a single,
 * properly paginated document with a designed cover page — sections stay
 * intact on a page instead of being mechanically sliced through the middle,
 * and the cover logo keeps its real aspect ratio instead of being forced
 * into a square.
 */
export function FullReportExportButton({
  projectName,
  primaryLogoBase64,
  overallScore,
  generatedAt,
}: {
  projectName: string;
  primaryLogoBase64?: string | null;
  overallScore?: number | null;
  generatedAt: string;
}) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");

  const downloadFullReport = async () => {
    setStatus("working");
    try {
      const reportBlocks = await captureBlocks("report-tab-root");
      const visualBlocks = await captureBlocks("visual-analysis-tab-root");

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let cursorY = 130;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(26);
      pdf.setTextColor(20);
      pdf.text(projectName, pageWidth / 2, cursorY, { align: "center" });
      cursorY += 22;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(120);
      pdf.text(`Design review — generated ${generatedAt}`, pageWidth / 2, cursorY, { align: "center" });
      cursorY += 45;

      if (primaryLogoBase64) {
        const logoDataUrl = `data:image/png;base64,${primaryLogoBase64}`;
        const { width, height } = await loadImageSize(logoDataUrl);
        const maxDim = 140;
        const scale = Math.min(maxDim / width, maxDim / height, 1);
        const drawWidth = width * scale;
        const drawHeight = height * scale;
        pdf.addImage(logoDataUrl, "PNG", (pageWidth - drawWidth) / 2, cursorY, drawWidth, drawHeight);
        cursorY += maxDim + 40;
      }

      if (overallScore !== null && overallScore !== undefined) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.setTextColor(20);
        pdf.text(`Overall score: ${Math.round(overallScore)}/100`, pageWidth / 2, cursorY, { align: "center" });
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(170);
      pdf.text("Generated by LogoAI", pageWidth / 2, pageHeight - 40, { align: "center" });

      if (reportBlocks.length > 0) {
        addDividerPage(pdf, "Report");
        await layoutBlocks(pdf, reportBlocks);
      }

      if (visualBlocks.length > 0) {
        addDividerPage(pdf, "Visual Analysis");
        await layoutBlocks(pdf, visualBlocks);
      }

      const filename = projectName.trim().replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "logo-review";
      pdf.save(`${filename}-logo-review.pdf`);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={downloadFullReport}
          disabled={status === "working"}
          className="flex items-center gap-1.5 self-start rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60"
        >
          <Download size={14} />
          {status === "working" ? "Preparing…" : "Download full report (PDF)"}
        </button>
        {status === "error" && (
          <span className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle size={12} />
            Export failed.
          </span>
        )}
      </div>
      <ProgressBar
        active={status === "working"}
        label="Capturing each section and building the PDF — this can take a minute or two for a long report."
      />
    </div>
  );
}
