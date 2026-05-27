import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { executeSetSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let parsed: ReturnType<typeof executeSetSchema.parse>;
  try {
    parsed = executeSetSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

  const updated = await prisma.workoutSet.update({
    where: { id },
    data: {
      reps: parsed.reps,
      weightKg: parsed.weightKg ?? null,
    },
  });

  return NextResponse.json(updated, { status: 200 });
}

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
