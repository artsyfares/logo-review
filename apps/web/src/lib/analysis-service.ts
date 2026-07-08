import "server-only";
import { analysisFactsSchema, type AnalysisFacts } from "@logoai/shared";

export async function analyzeLogo(
  bytes: Buffer,
  filename: string,
  contentType: string,
): Promise<AnalysisFacts> {
  const baseUrl = process.env.ANALYSIS_SERVICE_URL;
  if (!baseUrl) {
    throw new Error("ANALYSIS_SERVICE_URL is not set — see .env.example");
  }

  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(bytes)], { type: contentType }), filename);

  const response = await fetch(`${baseUrl}/analyze`, { method: "POST", body: formData });
  if (!response.ok) {
    throw new Error(`Analysis service returned ${response.status}: ${await response.text()}`);
  }

  const parsed = analysisFactsSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(
      `Analysis service response did not match the expected schema: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
