"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";

export interface VisionUploadState {
  status: "idle" | "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
  listId?: string;
}

export function useVisionUpload(): {
  state: VisionUploadState;
  uploadImage: (file: File) => Promise<void>;
  reset: () => void;
} {
  const [state, setState] = useState<VisionUploadState>({
    status: "idle",
    progress: 0,
  });

  const { startUpload } = useUploadThing("shoppingListImage", {
    onClientUploadComplete: async (res) => {
      setState({ status: "processing", progress: 50 });
      try {
        const response = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: res[0]?.url }),
        });

        if (!response.ok) {
          const error = await response.json();
          setState({ status: "error", progress: 0, error: error.error ?? "Error al procesar" });
          return;
        }

        const data = await response.json();
        setState({ status: "done", progress: 100, listId: data.listId });
      } catch {
        setState({ status: "error", progress: 0, error: "Error de conexión" });
      }
    },
    onUploadError: () => {
      setState({ status: "error", progress: 0, error: "Error al subir la imagen" });
    },
    onUploadBegin: () => {
      setState({ status: "uploading", progress: 10 });
    },
  });

  const uploadImage = async (file: File): Promise<void> => {
    if (!startUpload) {
      setState({ status: "error", progress: 0, error: "Upload no disponible" });
      return;
    }
    await startUpload([file]);
  };

  const reset = (): void => {
    setState({ status: "idle", progress: 0 });
  };

  return { state, uploadImage, reset };
}
