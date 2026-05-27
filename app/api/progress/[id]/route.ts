import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const entry = await prisma.weightLog.findUnique({
    where: { id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }

  if (entry.userId !== session.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.weightLog.delete({ where: { id } });

  return NextResponse.json({ success: true }, { status: 200 });
}
