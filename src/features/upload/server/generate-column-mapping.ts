import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

import { PRODUCT_FIELDS } from "@/features/mapping/fields";
import { autoMapFields } from "@/features/mapping/utils/auto-map";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const mappingSchema = z.object(
  Object.fromEntries(
    PRODUCT_FIELDS.map((field) => {
      const description = field.description
        ? `${field.label}: ${field.description}`
        : `${field.label}: Provide the matching column name or null if unknown.`;
      return [
        field.key,
        z
          .string()
          .nullable()
          .optional()
          .describe(description),
      ];
    })
  )
);

function formatFieldGuide() {
  return PRODUCT_FIELDS.map((field) => {
    const synonyms = field.synonyms?.length
      ? field.synonyms.join(", ")
      : "(no common synonyms)";
    const description = field.description
      ? `  Description: ${field.description}\n`
      : "";
    return `- ${field.label} (key: ${field.key})\n${description}  Synonyms: ${synonyms}`;
  }).join("\n\n");
}

function formatSampleRows(rows: Record<string, unknown>[]) {
  if (!rows.length) return "(No sample rows provided)";
  return rows
    .map((row, index) => `Row ${index + 1}: ${JSON.stringify(row)}`)
    .join("\n");
}

export async function generateAiColumnMapping(
  headers: string[],
  sampleRows: Record<string, unknown>[]
): Promise<Record<string, string | null>> {
  const fallback = autoMapFields(headers, PRODUCT_FIELDS);

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn(
      "generateAiColumnMapping: OPENROUTER_API_KEY is missing. Falling back to deterministic mapping."
    );
    return fallback;
  }

  try {
    const { object } = await generateObject({
      model: openrouter.chat("x-ai/grok-4-fast"),
      schema: mappingSchema,
      prompt: `You are helping align the columns of an uploaded spreadsheet to a fixed product schema.\n\nReturn a JSON object where each key is one of our schema field keys and each value is either the best matching column header from the provided CSV headers or null if you are unsure.\n\nOnly respond with JSON.\n\nOur target fields:\n${formatFieldGuide()}\n\nCSV columns:\n${headers.join(", ")}\n\nSample rows:\n${formatSampleRows(sampleRows)}`,
    });

    const aiMap: Record<string, string | null> = { ...fallback };

    for (const field of PRODUCT_FIELDS) {
      const value = object?.[field.key];
      if (typeof value === "string" && headers.includes(value)) {
        aiMap[field.key] = value;
      } else if (value === null) {
        aiMap[field.key] = null;
      }
    }

    return aiMap;
  } catch (error) {
    console.error("generateAiColumnMapping error", error);
    return fallback;
  }
}
