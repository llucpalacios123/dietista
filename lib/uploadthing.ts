import { generateReactHelpers } from "@uploadthing/react";
import type { DietistaFileRouter } from "@/app/api/uploadthing/route";

export const { useUploadThing, uploadFiles } = generateReactHelpers<DietistaFileRouter>();
