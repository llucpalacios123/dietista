"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

export interface FileUploadButtonProps {
  /** Called when a valid file is selected. */
  onFileSelected: (file: File) => void;
  /** Whether the upload is currently processing. */
  uploading?: boolean;
  /** Error message to display. */
  error?: string | null;
  /** Clear any error state. */
  onClearError?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".json"];
const ACCEPT_ATTRIBUTE = ".pdf,.txt,.json,application/pdf,text/plain,application/json";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * Button that triggers a file input for upload (PDF, TXT, or JSON).
 *
 * Validates file type and size client-side before calling onFileSelected.
 * Shows the selected filename and a remove button after selection.
 */
export function FileUploadButton({
  onFileSelected,
  uploading = false,
  error = null,
  onClearError,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error ?? localError;

  function handleClick() {
    setLocalError(null);
    onClearError?.();
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const ext = getExtension(file.name);

    // Validate extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setLocalError("Only PDF, TXT, and JSON files are accepted.");
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setLocalError(`File too large (${sizeMB} MB). Maximum is 5 MB.`);
      return;
    }

    setLocalError(null);
    setSelectedFile(file);
    onFileSelected(file);
  }

  function handleRemove() {
    setSelectedFile(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload nutrition report file (PDF, TXT, or JSON)"
      />

      {selectedFile ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate">{selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Remove file"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={uploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload File (PDF, TXT, JSON)"}
        </Button>
      )}

      {displayError && (
        <p className="text-xs text-destructive">{displayError}</p>
      )}
    </div>
  );
}
