// app/api/generate-suggestions/route.ts

import { generateObject } from 'ai';
import { z } from 'zod';
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const runtime = 'edge';

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

// Schema for a single suggestion
const suggestionSchema = z.object({
  title: z.string().describe("A short, user-friendly title for the suggestion button (e.g., 'Trim Whitespace')."),
  prompt: z.string().describe("The full, ready-to-execute prompt that will be sent to the chat AI if the user clicks this suggestion."),
});

export async function POST(req: Request) {
  const { schema, sampleData } = await req.json();

  // Validate that we have something to work with
  if (!schema || schema.length === 0) {
    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { object: suggestionObject } = await generateObject({
    model: openrouter.chat('x-ai/grok-4-fast'),
    schema: z.object({
      suggestions: z.array(suggestionSchema),
    }),
    prompt: `Based on the provided table schema and sample data, generate 3-5 diverse and actionable suggestions for data cleaning or transformation. The suggestions should be common data hygiene tasks that are relevant to the given data.

For each suggestion, provide a short 'title' for a button and a full 'prompt' that a user would type to the main AI assistant.

Table Schema (Column Names): ${JSON.stringify(schema)}

Sample Data (First 3 Rows):
${JSON.stringify(sampleData, null, 2)}

Example suggestions you might generate:
- Title: "Standardize Country Names", Prompt: "For all rows, standardize the 'country_of_origin' to its full name."
- Title: "Fill Empty Group IDs", Prompt: "Set 'group_id' to 'Uncategorized' for all rows where 'group_id' is empty."
- Title: "Trim All Text Fields", Prompt: "Trim whitespace from the 'product_name' and 'supplier' fields for all rows."
- Title: "Translate Certifications", Prompt: "Translate the 'certifications' column from English to French."
`
  });

  return new Response(JSON.stringify(suggestionObject), {
    headers: { "Content-Type": "application/json" },
  });
}