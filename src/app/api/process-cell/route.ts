// app/api/process-cell/route.ts

import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';



const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

export async function POST(req: Request) {
  const { prompt, value } = await req.json();

  // The prompt from the tool call includes '{value}', which we replace here.
  const finalPrompt = prompt.replace('{value}', String(value));

  const { text } = await generateText({
    model: openrouter.chat('x-ai/grok-4-fast'), // Maybe we should use a faster model for this?
    prompt: finalPrompt,
  });

  return new Response(JSON.stringify({ newValue: text }), {
    headers: { "Content-Type": "application/json" },
  });
}