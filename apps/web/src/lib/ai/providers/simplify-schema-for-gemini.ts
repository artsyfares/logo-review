/**
 * Gemini's structured-output engine rejects schemas above a complexity
 * threshold ("too many states for serving"). Confirmed by live testing
 * (not assumed from docs) that the dominant cost here is the 9-value
 * `principles` enum used *inside an array* — appearing once per array
 * position multiplies combinatorially, and $ref deduplication doesn't
 * help because Gemini resolves refs before measuring complexity. Flat
 * (non-array) enums like `confidence` and `implementationComplexity` are
 * cheap by comparison and are kept, since they meaningfully improve output
 * quality. Numeric/length bounds are also stripped per Gemini's own error
 * message listing them as contributors — Zod still enforces everything
 * (bounds and enum values alike) on the parsed response either way.
 */
export function simplifySchemaForGemini(schema: unknown): unknown {
  return stripBounds(dropArrayItemEnums(schema));
}

const BOUND_KEYS = ["minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems"];

function dropArrayItemEnums(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map(dropArrayItemEnums);
  }
  if (schema === null || typeof schema !== "object") {
    return schema;
  }
  const result: Record<string, unknown> = { ...(schema as Record<string, unknown>) };
  if ("items" in result && result.items !== null && typeof result.items === "object") {
    const items = { ...(result.items as Record<string, unknown>) };
    delete items.enum;
    result.items = items;
  }
  for (const [key, value] of Object.entries(result)) {
    result[key] = dropArrayItemEnums(value);
  }
  return result;
}

function stripBounds(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map(stripBounds);
  }
  if (schema === null || typeof schema !== "object") {
    return schema;
  }
  const result: Record<string, unknown> = { ...(schema as Record<string, unknown>) };
  for (const key of BOUND_KEYS) {
    delete result[key];
  }
  for (const [key, value] of Object.entries(result)) {
    result[key] = stripBounds(value);
  }
  return result;
}
