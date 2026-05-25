import { generateReactHelpers } from "@uploadthing/react";
import type { DietistaFileRouter } from "@/lib/uploadthing-server";

export const { useUploadThing, uploadFiles } = generateReactHelpers<DietistaFileRouter>();
