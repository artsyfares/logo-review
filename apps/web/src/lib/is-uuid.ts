const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate at the boundary before a value reaches a `uuid` column — an
 * invalid format would otherwise surface as an unhandled Postgres error. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
