/**
 * POST /api/ai/extract
 *
 * Upload a document (PDF/image) and extract academic data.
 *
 * Request body:
 * - documentName: string
 * - fileData: string (base64-encoded)
 * - mimeType: string
 *
 * OR for text-only extraction:
 * - documentName: string
 * - textContent: string
 */

import { NextRequest, NextResponse } from "next/server";
import { extractAcademicData, extractAcademicDataFromText } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { documentName, fileData, mimeType, textContent } = body;

    if (!documentName || typeof documentName !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "documentName is required" } },
        { status: 400 }
      );
    }

    // Text-only extraction
    if (textContent && typeof textContent === "string") {
      const result = await extractAcademicDataFromText({
        documentName,
        textContent,
      });
      return NextResponse.json(result, {
        status: result.success ? 200 : 502,
      });
    }

    // File-based extraction
    if (!fileData || typeof fileData !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "fileData (base64) or textContent is required" } },
        { status: 400 }
      );
    }

    if (!mimeType || typeof mimeType !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "mimeType is required" } },
        { status: 400 }
      );
    }

    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: `Unsupported MIME type: ${mimeType}. Allowed: ${allowedMimeTypes.join(", ")}` } },
        { status: 400 }
      );
    }

    const result = await extractAcademicData({
      documentName,
      fileData,
      mimeType,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 502,
    });
  } catch (error) {
    console.error("[API /api/ai/extract] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error", retryable: false } },
      { status: 500 }
    );
  }
}
