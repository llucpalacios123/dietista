import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    userId: string;
    email: string;
    user?: DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
  }
}
