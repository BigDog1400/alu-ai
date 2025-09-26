This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

- **Set environment variables**
  ```bash
  cp .env.example .env.local
  # then edit .env.local and set your values
  ```

- **Run the dev server**
  ```bash
  npm run dev
  ```
  Open http://localhost:3005

- **Build and start (production)**
  ```bash
  npm run build
  npm start
  ```

## Environment Variables

- **OPENROUTER_API_KEY (required)**
  - Used by server-side AI features via OpenRouter.
  - Place it in `.env.local` (server-only; no `NEXT_PUBLIC_` vars are used currently).

Example `.env.local`:
```bash
OPENROUTER_API_KEY=sk-...your-key...
```
## Project Overview

This app streamlines transforming messy product spreadsheets into a clean, canonical schema and then lets you refine the data with AI-driven operations.

- **Upload & Parse**: Users upload CSV/XLSX files. We parse the first sheet and build robust headers and rows.
  - Code: `src/features/upload/server/parse-uploaded-file.ts`

- **AI Column Mapping**: We suggest a mapping from your columns to a canonical product schema using an LLM. If no API key is set, we fall back to a deterministic matcher.
  - Code: `src/features/upload/server/generate-column-mapping.ts`
  - Schema definition: `src/features/mapping/fields.ts` (e.g., `purchase_order`, `product_name`, `country_of_origin`, `supplier`, `supplier_email`, `certifications`, `status_of_certifications`, `material_composition`, `season`, `group_id`)
  - Model/provider: OpenRouter with `x-ai/grok-4-fast`

- **Local Persistence**: Parsed upload, mapping, and transformed rows are stored in `localStorage` via Jotai atoms so your progress persists between refreshes.
  - Code: `src/features/upload/hooks/use-parsed-upload-storage.ts`

- **Chat-Driven Transformations**: Use natural language to perform updates and per-cell transformations. The assistant maps your request to one of two tools:
  - `directUpdateTool`: static updates to selected rows/fields
  - `processCellsTool`: per-cell AI transformation using a prompt
  - UI: `src/features/chat/components/chat-pane.tsx`, `src/features/chat/components/tool-messages.tsx`
  - Server routes: `src/app/api/chat/route.ts`, `src/app/api/process-cell/route.ts`

## Architecture

- **Frontend**: Next.js App Router (v15), React 19, Tailwind CSS 4, Radix UI, Lucide icons.
- **AI**: `ai` SDK with OpenRouter provider.
- **Parsing**: `xlsx` for spreadsheet parsing.
- **State**: Jotai for persisted UI/data state.

## Scripts

- `npm run dev` — Start the dev server on port 3005
- `npm run build` — Build with Turbopack
- `npm start` — Start the production server
- `npm run lint` — Lint the project

## Development Notes & Limitations

- In development, `AIDevtools` is enabled for easier debugging (`src/features/chat/components/chat-pane.tsx`).
- The assistant only sees a small sample of your data (not the entire dataset) to maintain performance and privacy.
- `processCellsTool` issues one server call per selected cell; consider rate limits and costs for large batches.
- If `OPENROUTER_API_KEY` is missing, AI mapping falls back to a deterministic heuristic.
