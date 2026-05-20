import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PlanesPage() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const activePlan = await prisma.mealPlan.findFirst({
    where: {
      userId: session.userId,
      status: "active",
    },
    include: { meals: true },
    orderBy: { startDate: "desc" },
  });

  const pastPlans = await prisma.mealPlan.findMany({
    where: {
      userId: session.userId,
      status: { in: ["completed", "draft"] },
    },
    orderBy: { startDate: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          Planes
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
          Tus planes de comidas
        </p>
      </div>

      {/* Active Plan Hero */}
      {activePlan && (
        <div className="mx-[var(--dietista-pad-card)]">
          <div className="rounded-[var(--dietista-r-lg)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-[var(--dietista-pad-card)]">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-700)]">
              Plan activo
            </p>
            <p className="mt-1 text-lg font-bold text-[var(--brand-800)]">
              Semana del {new Date(activePlan.startDate).toLocaleDateString("es-AR")}
            </p>
            <p className="mt-1 text-sm text-[var(--brand-600)]">
              {activePlan.meals.length} comidas · {Math.round(activePlan.totalCalories ?? 0)} kcal/día
            </p>
            <Link
              href={`/meal-plans/${activePlan.id}`}
              className="mt-3 inline-block rounded-lg bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
            >
              Ver plan completo
            </Link>
          </div>
        </div>
      )}

      {/* Create New Plan */}
      <div className="mx-[var(--dietista-pad-card)]">
        <Link
          href="/meal-plans/new"
          className="flex items-center justify-center rounded-[var(--dietista-r-lg)] border-2 border-dashed border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-6 transition-colors hover:border-[var(--brand-300)]"
        >
          <div className="text-center">
            <span className="text-2xl">+</span>
            <p className="mt-2 text-sm font-semibold text-[var(--dietista-text)]">
              Crear nuevo plan
            </p>
          </div>
        </Link>
      </div>

      {/* Past Plans */}
      {pastPlans.length > 0 && (
        <div className="mx-[var(--dietista-pad-card)]">
          <h2 className="mb-3 text-sm font-semibold text-[var(--dietista-text)]">
            Planes anteriores
          </h2>
          <div className="space-y-2">
            {pastPlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/meal-plans/${plan.id}`}
                className="flex items-center justify-between rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)] transition-colors hover:border-[var(--brand-300)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--dietista-text)]">
                    {new Date(plan.startDate).toLocaleDateString("es-AR")}
                  </p>
                  <p className="text-xs text-[var(--dietista-text-2)]">
                    {plan.status === "completed" ? "Completado" : "Borrador"}
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-[var(--dietista-text-3)]"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
