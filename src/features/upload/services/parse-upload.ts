import type { ParsedUpload } from "../types";

export async function parseUpload(file: File): Promise<ParsedUpload> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/parse", {
    method: "POST",
    body: formData,
  });

  const json = await res.json();

  if (!res.ok || !json?.success) {
    throw new Error(json?.error ?? "Failed to parse uploaded file.");
  }

  return json.data as ParsedUpload;
}
