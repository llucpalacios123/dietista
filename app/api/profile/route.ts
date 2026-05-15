import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
