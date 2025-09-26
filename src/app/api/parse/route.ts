import { NextResponse } from "next/server";

import { parseUploadedFile } from "@/features/upload/server/parse-uploaded-file";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file upload in 'file' form field." },
        { status: 400 },
      );
    }

    const parsed = await parseUploadedFile(file);

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("/api/parse error", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse uploaded file. Please try again.",
      },
      { status: 500 },
    );
  }
}
