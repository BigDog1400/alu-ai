import { streamText, UIMessage, convertToModelMessages, tool } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// features/chat/schemas.ts

import { z } from "zod";

/**
 * A flexible filter to select specific rows in the table.
 * The AI can chain multiple filters for complex selections, though for simplicity, we start with one.
 */
export const filterSchema = z.object({
  field: z
    .string()
    .describe(
      "The field/column to apply the filter on. Must be one of the existing column keys."
    ),
  condition: z
    .enum(["equals", "not_equals", "is_empty", "is_not_empty", "contains"])
    .describe("The condition to apply for the filter."),
  value: z
    .any()
    .optional()
    .describe(
      "The value to compare against. Not needed for 'is_empty' or 'is_not_empty'."
    ),
});

/**
 * Tool for making direct, static updates to table data.
 * Use this for setting fields to specific values, remapping, or clearing data.
 */
export const directUpdateSchema = z.object({
  filter: filterSchema
    .optional()
    .describe(
      "A filter to select which rows to update. If omitted, the update applies to ALL rows."
    ),
  newValues: z
    .record(z.string(), z.any())
    .describe(
      "An object where keys are the field names to update and values are the new static values to set."
    ),
});

/**
 * Tool for processing the value of each cell in a column using another AI prompt.
 * Use this for complex transformations like translation, summarization, or reformatting.
 */
export const processCellsSchema = z.object({
  filter: filterSchema
    .optional()
    .describe(
      "A filter to select which rows to process. If omitted, all rows will be processed."
    ),
  fieldToProcess: z
    .string()
    .describe("The name of the column/field whose cells should be processed."),
  processingPrompt: z
    .string()
    .describe(
      "A clear, concise prompt for the per-cell AI. It MUST include the placeholder '{value}' which will be replaced with the cell's current value."
    ),
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model: _model,
    metadata,
  }: {
    messages: UIMessage[];
    model: string;
    metadata: {
      schema: string[];
      sampleData: unknown[];
    };
  } = await req.json();

  const result = streamText({
    model: openrouter.chat("x-ai/grok-4-fast"),
    messages: convertToModelMessages(messages),
    system: `You are an AI data assistant. Your task is to translate a user's natural language command into a structured JSON operation for one of the available tools.

    You will be provided with the table's 'schema' (a list of column names) and a few 'sampleData' rows to understand the data's structure and format.
    
    IMPORTANT: You DO NOT have access to the full dataset. Do not attempt to answer questions that require full data access (e.g., "how many rows have the supplier 'GreenThreads Co.'?"). If asked such a question, you must respond with a text message explaining that you can only perform updates, not answer analytical questions.
    
    Your sole purpose is to plan the operation for the client to execute.
    
    - For direct, static value changes, use the 'directUpdateTool'.
    - For complex transformations requiring per-cell AI processing, use the 'processCellsTool'.
    
    Table Schema: ${JSON.stringify(metadata.schema)}
    Sample Data: ${JSON.stringify(metadata.sampleData, null, 2)}
    `,
    tools: {
      directUpdateTool: tool({
        description:
          "Update table rows directly based on a filter. Use for setting static values, remapping, or bulk edits.",
        inputSchema: directUpdateSchema,
      }),
      processCellsTool: tool({
        description:
          "Process the value of each cell in a column using another AI prompt. Use for translations, summarization, or complex reformatting.",
        inputSchema: processCellsSchema,
      }),
    },
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
