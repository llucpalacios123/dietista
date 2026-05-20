import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const list = await prisma.shoppingList.findFirst({
    where: { id, userId: session.userId },
    include: { items: { orderBy: { order: "asc" } } },
  });

  if (!list) {
    return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    id: list.id,
    status: list.status,
    budget: list.budget,
    totalEstimate: list.totalEstimate,
    imageUrl: list.imageUrl,
    items: list.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      confidence: item.confidence,
      checked: item.checked,
      matchedToPlan: item.matchedToPlan,
      category: item.category,
      order: item.order,
    })),
  });
}
