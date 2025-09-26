"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import type { UIMessage } from "ai";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { ComponentType } from "react";

type ToolPartCommon = {
  toolCallId: string;
  providerExecuted?: boolean;
  input?: unknown;
};

type ToolInputState = ToolPartCommon & {
  state: "input-streaming" | "input-available";
};

type ToolOutputState = ToolPartCommon & {
  state: "output-available";
  output?: unknown;
};

type ToolErrorState = ToolPartCommon & {
  state: "output-error";
  errorText?: string;
};

type DirectUpdateToolPart =
  | ({ type: "tool-directUpdateTool" } & ToolInputState)
  | ({ type: "tool-directUpdateTool" } & ToolOutputState)
  | ({ type: "tool-directUpdateTool" } & ToolErrorState);

type ProcessCellsToolPart =
  | ({ type: "tool-processCellsTool" } & ToolInputState)
  | ({ type: "tool-processCellsTool" } & ToolOutputState)
  | ({ type: "tool-processCellsTool" } & ToolErrorState);


function AssistantNotice({
  role,
  icon,
  title,
  description,
  details,
}: {
  role: UIMessage["role"];
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  details?: unknown;
}) {
  const Icon = icon;
  return (
    <Message from={role}>
      <MessageContent className="max-w-[80%]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-muted p-2">
            <Icon className="size-4" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">{title}</p>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
            {details && process.env.NODE_ENV === 'development' ? (
              <details className="mt-1 text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none">Show details</summary>
                <pre className="mt-1 max-h-56 overflow-auto rounded bg-muted/50 p-2">
                  {typeof details === "string"
                    ? details
                    : JSON.stringify(details, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        </div>
      </MessageContent>
    </Message>
  );
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function DirectUpdateToolMessage({
  part,
  role,
}: {
  part: DirectUpdateToolPart;
  role: UIMessage["role"];
}) {
  switch (part.state) {
    case "input-streaming":
    case "input-available": {
      return (
        <AssistantNotice
          role={role}
          icon={Loader2}
          title="Updating your data…"
          description="Applying your changes. This may take a moment."
          details={isObject(part.input) ? part.input : undefined}
        />
      );
    }
    case "output-available": {
      const output = isObject(part.output) ? part.output : undefined;
      const updatedCount = typeof output?.updatedRowCount === "number" ? output.updatedRowCount : undefined;
      const fields = Array.isArray(output?.updatedFields) ? output?.updatedFields : undefined;
      return (
        <AssistantNotice
          role={role}
          icon={CheckCircle2}
          title={
            updatedCount !== undefined
              ? `Updated ${updatedCount} ${updatedCount === 1 ? "row" : "rows"}.`
              : "Update complete."
          }
          description={fields ? `Changed ${fields.length} ${fields.length === 1 ? "field" : "fields"}.` : undefined}
          details={output}
        />
      );
    }
    case "output-error": {
      return (
        <AssistantNotice
          role={role}
          icon={AlertCircle}
          title="We couldn't complete that step."
          description={part.errorText}
        />
      );
    }
  }
}

export function ProcessCellsToolMessage({
  part,
  role,
}: {
  part: ProcessCellsToolPart;
  role: UIMessage["role"];
}) {
  const input = isObject(part.input) ? part.input : undefined;
  const field = typeof input?.fieldToProcess === "string" ? input.fieldToProcess : undefined;

  switch (part.state) {
    case "input-streaming":
    case "input-available": {
      return (
        <AssistantNotice
          role={role}
          icon={Loader2}
          title={field ? `Transforming "${field}"…` : "Transforming your data…"}
          description="Hang tight — we're applying your transformation."
          details={input}
        />
      );
    }
    case "output-available": {
      const output = isObject(part.output) ? part.output : undefined;
      const processed = typeof output?.processedCount === "number" ? output.processedCount : undefined;
      return (
        <AssistantNotice
          role={role}
          icon={CheckCircle2}
          title={
            processed !== undefined
              ? `Done. ${processed} ${processed === 1 ? "cell" : "cells"} updated.`
              : "Transformation complete."
          }
          description={field ? `Column: ${field}` : undefined}
          details={output}
        />
      );
    }
    case "output-error": {
      return (
        <AssistantNotice
          role={role}
          icon={AlertCircle}
          title="We couldn't finish that step."
          description={part.errorText}
        />
      );
    }
  }
}

export type ToolMessageComponentProps = {
  part: UIMessage["parts"][number];
  role: UIMessage["role"];
};

export function ToolPartMessage({ part, role }: ToolMessageComponentProps) {
  if (part.type === "tool-directUpdateTool") {
    return <DirectUpdateToolMessage part={part as DirectUpdateToolPart} role={role} />;
  }
  if (part.type === "tool-processCellsTool") {
    return <ProcessCellsToolMessage part={part as ProcessCellsToolPart} role={role} />;
  }
  return null;
}
