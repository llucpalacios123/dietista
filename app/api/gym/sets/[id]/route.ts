import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const workoutSet = await prisma.workoutSet.findUnique({
    where: { id },
    include: { session: true },
  });

  if (!workoutSet) {
    return NextResponse.json({ error: "Serie no encontrada" }, { status: 404 });
  }

  if (workoutSet.session.userId !== session.userId) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  await prisma.workoutSet.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
