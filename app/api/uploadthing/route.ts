import { createRouteHandler } from "uploadthing/next";
import { dietistaFileRouter } from "@/lib/uploadthing-server";

export const { GET, POST } = createRouteHandler({
  router: dietistaFileRouter,
});
