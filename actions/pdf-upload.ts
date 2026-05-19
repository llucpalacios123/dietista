"use server";

import { auth } from "@/lib/auth-config";
import { setSessionData, clearSessionData } from "@/lib/chat-tools";

// ─── Constants ────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/json",
];
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".json"];

// ─── Types ────────────────────────────────────────────────────────────────

export interface FileUploadResult {
  success: boolean;
  error?: string;
  rawText?: string;
  pageCount?: number;
  fileType?: "pdf" | "txt" | "json";
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getFileType(mimeType: string, extension: string): "pdf" | "txt" | "json" | null {
  if (mimeType === "application/pdf" || extension === ".pdf") return "pdf";
  if (mimeType === "text/plain" || extension === ".txt") return "txt";
  if (mimeType === "application/json" || extension === ".json") return "json";
  return null;
}

function extractExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

// ─── Wrapper for pdf-parse (dynamic import to handle ESM/CJS module) ──────

async function parsePdfBuffer(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
}> {
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = (
    pdfParseModule as unknown as
      | { default: (buf: Buffer) => Promise<{ text: string; numpages: number }> }
      | ((buf: Buffer) => Promise<{ text: string; numpages: number }>)
  );
  if (typeof pdfParse === "function") {
    return pdfParse(buffer);
  }
  if (
    typeof pdfParse === "object" &&
    pdfParse !== null &&
    "default" in pdfParse &&
    typeof (pdfParse as { default: unknown }).default === "function"
  ) {
    return (pdfParse as { default: (buf: Buffer) => Promise<{ text: string; numpages: number }> }).default(buffer);
  }
  throw new Error("pdf-parse module is not in the expected format");
}

// ─── Server Action ────────────────────────────────────────────────────────

/**
 * Upload a file (PDF, TXT, or JSON) for chat-based meal plan analysis.
 *
 * Validates file size (max 5MB) and MIME type/extension. Extracts text
 * content: pdf-parse for PDFs, direct read for TXT, JSON.stringify for JSON.
 * Stores the extracted text in the chat session data store for the AI to
 * process via extractPdfData tool.
 */
export async function uploadFileForChat(
  _prevState: FileUploadResult | null,
  formData: FormData
): Promise<FileUploadResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "You must be logged in to upload a file." };
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return { success: false, error: "No file provided." };
  }

  const extension = extractExtension(file.name);
  const fileType = getFileType(file.type, extension);

  // Type check via MIME or extension
  if (!fileType) {
    const extMsg = extension ? `"${extension}"` : "unknown";
    return {
      success: false,
      error: `Invalid file type ${extMsg}. Only PDF, TXT, and JSON files are accepted.`,
    };
  }

  // File size check
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      success: false,
      error: `File too large (${sizeMB} MB). Maximum size is 5 MB.`,
    };
  }

  // Read file into buffer
  let buffer: Buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return {
      success: false,
      error: "Failed to read the uploaded file. Please try again.",
    };
  }

  // Extract text based on file type
  let rawText: string;
  let pageCount: number | undefined;

  try {
    if (fileType === "pdf") {
      const parsed = await parsePdfBuffer(buffer);
      rawText = parsed.text;
      pageCount = parsed.numpages;

      if (!rawText.trim()) {
        return {
          success: false,
          error: "No text could be extracted from this PDF. It may be a scanned image or empty document.",
        };
      }
    } else if (fileType === "txt") {
      rawText = buffer.toString("utf-8");
      if (!rawText.trim()) {
        return {
          success: false,
          error: "The uploaded text file is empty.",
        };
      }
    } else {
      // JSON: parse and re-stringify for consistent text representation
      const jsonContent = buffer.toString("utf-8");
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonContent);
      } catch {
        return {
          success: false,
          error: "The uploaded JSON file is not valid JSON.",
        };
      }
      rawText = JSON.stringify(parsed, null, 2);
      if (!rawText.trim()) {
        return {
          success: false,
          error: "The uploaded JSON file is empty.",
        };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parsing error";

    if (message.includes("encrypted") || message.includes("password")) {
      return {
        success: false,
        error: "This PDF is encrypted or password-protected. Please upload an unprotected file.",
      };
    }

    if (message.includes("Invalid") || message.includes("PDF")) {
      return {
        success: false,
        error: "The uploaded file appears to be corrupted or is not a valid PDF.",
      };
    }

    return {
      success: false,
      error: `Failed to parse file: ${message}`,
    };
  }

  // Store in session data for AI tool access
  setSessionData(session.userId, {
    preferences: { allergies: [], forbiddenFoods: [] },
    pdfData: {
      rawText,
      extractedAt: new Date().toISOString(),
    },
    confidence: "medium",
  });

  return {
    success: true,
    rawText,
    pageCount,
    fileType,
  };
}

// Keep backward-compatible alias
export const uploadPdfForChat = uploadFileForChat;

/**
 * Clear previously uploaded file data for a user (optional utility).
 */
export async function clearFileData(): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false };
  }

  clearSessionData(session.userId);
  return { success: true };
}

export const clearPdfData = clearFileData;
