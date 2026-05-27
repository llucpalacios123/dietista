import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    userId: string;
    email: string;
    name?: string | null;
    user?: DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
    name?: string | null;
  }
}
