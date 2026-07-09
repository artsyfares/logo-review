import "server-only";

const TRANSIENT_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ENETUNREACH",
  "EAI_AGAIN",
  "ECONNREFUSED",
]);

function isTransientNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }
  const code = (err as NodeJS.ErrnoException).code ?? (err.cause as NodeJS.ErrnoException)?.code;
  return typeof code === "string" && TRANSIENT_ERROR_CODES.has(code);
}

/**
 * A single mid-response connection reset otherwise wastes an entire 20-100s
 * review-generation attempt on a failure a fresh TCP connection would often
 * sail through — confirmed live: three consecutive attempts each ran 65-100s
 * before an `ECONNRESET`, with no retry to fall back on. Only retries errors
 * that are genuinely transient at the network layer; schema/validation
 * failures from the provider itself are never retried since a repeat call
 * won't fix a response that didn't match the expected shape.
 */
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, delayMs = 1500 }: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === attempts || !isTransientNetworkError(err)) {
        throw err;
      }
      console.error(
        `Transient network error on attempt ${attempt}/${attempts}, retrying:`,
        err instanceof Error ? err.message : err,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastErr;
}
