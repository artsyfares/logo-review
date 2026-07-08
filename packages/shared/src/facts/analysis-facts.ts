import { z } from "zod";

/**
 * Mirrors services/analysis/app/models.py's AnalysisFacts response exactly,
 * including its snake_case field names — this is the wire format of an
 * external (Python) service, not app-internal state, so it intentionally
 * doesn't follow the rest of this codebase's camelCase convention. Keeping
 * it byte-for-byte matched to the actual JSON avoids a translation layer
 * that could silently drift from what the service actually returns.
 */

export const paletteColorSchema = z.object({
  hex: z.string(),
  rgb: z.tuple([z.number(), z.number(), z.number()]),
  coverage: z.number(),
});

export const contrastCheckSchema = z.object({
  hex: z.string(),
  rgb: z.tuple([z.number(), z.number(), z.number()]),
  coverage: z.number(),
  contrast_vs_white: z.number(),
  contrast_vs_black: z.number(),
  meets_aa_normal_text_vs_white: z.boolean(),
  meets_aa_normal_text_vs_black: z.boolean(),
  contrast_vs_own_background: z.number().nullable(),
  meets_aa_normal_text_vs_own_background: z.boolean().nullable(),
});

export const scalabilitySizeResultSchema = z.object({
  edge_density: z.number(),
  detail_retention_ratio: z.number(),
});

export const scalabilitySignalSchema = z.object({
  full_resolution_edge_density: z.number(),
  by_size: z.record(z.string(), scalabilitySizeResultSchema),
});

export const compositionMetricsSchema = z.object({
  whitespace_ratio: z.number(),
  vertical_symmetry_score: z.number().nullable(),
});

export const centerOfMassSchema = z.object({
  centroid_x_ratio: z.number(),
  centroid_y_ratio: z.number(),
  x_offset_pct: z.number(),
  y_offset_pct: z.number(),
});

export const quadrantComplexitySchema = z.object({
  top_left: z.number(),
  top_right: z.number(),
  bottom_left: z.number(),
  bottom_right: z.number(),
});

export const balanceMetricsSchema = z.object({
  center_of_mass: centerOfMassSchema.nullable(),
  quadrant_complexity: quadrantComplexitySchema.nullable(),
});

export const vectorStructureSchema = z.object({
  path_count: z.number(),
  group_count: z.number(),
  has_embedded_text: z.boolean(),
  has_embedded_raster_image: z.boolean(),
});

export const analysisFactsSchema = z.object({
  filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  kind: z.enum(["raster", "vector"]),
  width: z.number(),
  height: z.number(),
  has_transparency: z.boolean(),
  background_color: paletteColorSchema.nullable(),
  palette: z.array(paletteColorSchema),
  contrast_checks: z.array(contrastCheckSchema),
  composition: compositionMetricsSchema,
  balance: balanceMetricsSchema,
  scalability: scalabilitySignalSchema,
  vector_structure: vectorStructureSchema.nullable(),
  rendered_png_base64: z.string(),
});

export type AnalysisFacts = z.infer<typeof analysisFactsSchema>;
export type ContrastCheck = z.infer<typeof contrastCheckSchema>;
