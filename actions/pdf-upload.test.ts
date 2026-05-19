import { describe, it, expect } from "vitest";

// ─── File validation logic (extracted constants) ─────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".json"];

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

function validateFile(
  file: { type: string; size: number; name: string } | null
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file type "${ext}". Only PDF, TXT, and JSON files are accepted.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File too large (${sizeMB} MB). Maximum size is 5 MB.`,
    };
  }

  return { valid: true };
}

describe("uploadFileForChat — file validation", () => {
  describe("valid inputs", () => {
    const validCases = [
      {
        file: { type: "application/pdf", size: 1024, name: "report.pdf" },
        reason: "small valid PDF",
      },
      {
        file: { type: "application/pdf", size: MAX_FILE_SIZE, name: "max.pdf" },
        reason: "exactly max size PDF",
      },
      {
        file: { type: "application/pdf", size: 1, name: "tiny.pdf" },
        reason: "minimum size PDF",
      },
      {
        file: { type: "text/plain", size: 512, name: "notes.txt" },
        reason: "small TXT file",
      },
      {
        file: { type: "text/plain", size: MAX_FILE_SIZE, name: "large.txt" },
        reason: "max size TXT file",
      },
      {
        file: { type: "application/json", size: 256, name: "diet.json" },
        reason: "small JSON file",
      },
      {
        file: { type: "application/json", size: MAX_FILE_SIZE, name: "data.json" },
        reason: "max size JSON file",
      },
    ];

    it.each(validCases)("accepts valid file: $reason", ({ file }) => {
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("invalid inputs", () => {
    const invalidCases = [
      {
        file: null,
        reason: "no file provided",
        expectedError: "No file provided",
      },
      {
        file: {
          type: "image/png",
          size: 1024,
          name: "photo.png",
        },
        reason: "wrong extension (PNG)",
        expectedError: "Invalid file type",
      },
      {
        file: {
          type: "application/xml",
          size: 1024,
          name: "data.xml",
        },
        reason: "wrong extension (XML)",
        expectedError: "Invalid file type",
      },
      {
        file: {
          type: "application/pdf",
          size: MAX_FILE_SIZE + 1,
          name: "large.pdf",
        },
        reason: "PDF file too large",
        expectedError: "File too large",
      },
      {
        file: {
          type: "text/plain",
          size: MAX_FILE_SIZE + 1,
          name: "large.txt",
        },
        reason: "TXT file too large",
        expectedError: "File too large",
      },
      {
        file: {
          type: "application/json",
          size: 100 * 1024 * 1024,
          name: "huge.json",
        },
        reason: "JSON file extremely large",
        expectedError: "File too large",
      },
      {
        file: {
          type: "",
          size: 1024,
          name: "unknown",
        },
        reason: "no extension",
        expectedError: "Invalid file type",
      },
    ];

    it.each(invalidCases)(
      "rejects invalid file: $reason",
      ({ file, expectedError }) => {
        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toContain(expectedError);
      }
    );
  });
});

describe("uploadFileForChat — error categorization", () => {
  function categorizeError(errorMessage: string): string {
    if (
      errorMessage.includes("encrypted") ||
      errorMessage.includes("password")
    ) {
      return "encrypted";
    }

    if (
      errorMessage.includes("Invalid") ||
      errorMessage.includes("PDF") ||
      errorMessage.includes("corrupted")
    ) {
      return "corrupted";
    }

    if (errorMessage.includes("JSON")) {
      return "invalid-json";
    }

    return "unknown";
  }

  const errorCases = [
    {
      message: "PDF is encrypted and requires a password",
      expectedCategory: "encrypted",
    },
    {
      message: "File is password protected",
      expectedCategory: "encrypted",
    },
    {
      message: "Invalid PDF structure",
      expectedCategory: "corrupted",
    },
    {
      message: "Not a valid PDF file",
      expectedCategory: "corrupted",
    },
    {
      message: "The PDF file is corrupted",
      expectedCategory: "corrupted",
    },
    {
      message: "Unexpected token in JSON",
      expectedCategory: "invalid-json",
    },
    {
      message: "Some other random error",
      expectedCategory: "unknown",
    },
  ];

  it.each(errorCases)(
    "categorizes '$message' as '$expectedCategory'",
    ({ message, expectedCategory }) => {
      expect(categorizeError(message)).toBe(expectedCategory);
    }
  );
});

describe("uploadFileForChat — constants", () => {
  it("allows PDF, TXT, and JSON extensions", () => {
    expect(ALLOWED_EXTENSIONS).toContain(".pdf");
    expect(ALLOWED_EXTENSIONS).toContain(".txt");
    expect(ALLOWED_EXTENSIONS).toContain(".json");
    expect(ALLOWED_EXTENSIONS).toHaveLength(3);
  });

  it("max file size is 5 MB", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(MAX_FILE_SIZE).toBe(5242880);
  });
});

describe("getExtension helper", () => {
  const cases = [
    { filename: "report.pdf", expected: ".pdf" },
    { filename: "notes.TXT", expected: ".txt" },
    { filename: "diet.json", expected: ".json" },
    { filename: "no-extension", expected: "" },
    { filename: ".hidden", expected: ".hidden" },
    { filename: "multiple.dots.file.pdf", expected: ".pdf" },
  ];

  it.each(cases)("extracts '$expected' from '$filename'", ({ filename, expected }) => {
    expect(getExtension(filename)).toBe(expected);
  });
});
