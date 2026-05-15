import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.userId) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  const activePlan = await prisma.mealPlan.findFirst({
    where: {
      userId: session.userId,
      status: "active",
    },
    include: { meals: true },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.email}</h1>
        <p className="mt-1 text-muted-foreground">
          Your personalized meal planning dashboard
        </p>
      </div>

      {!profile && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg">Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Set up your nutritional profile to generate personalized meal plans.
            </p>
            <Link href="/profile">
              <Button>Set Up Profile</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {activePlan ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Meal Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Week of {new Date(activePlan.startDate).toLocaleDateString()} —{" "}
              {activePlan.meals.length} meals planned
            </p>
            <Link href="/meal-plans">
              <Button variant="outline" className="mt-4">
                View Full Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Meal Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Generate your first personalized weekly meal plan.
            </p>
            <Link href="/meal-plans">
              <Button>Generate Meal Plan</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
