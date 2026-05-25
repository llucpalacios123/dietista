import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth-config";

const f = createUploadthing();

export const dietistaFileRouter = {
  shoppingListImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.userId) {
        throw new Error("No autenticado");
      }
      return { userId: session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`Upload complete for user ${metadata.userId}: ${file.url}`);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type DietistaFileRouter = typeof dietistaFileRouter;
