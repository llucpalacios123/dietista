import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCalories } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

export interface MealData {
  id: string;
  dayOfWeek: number;
  mealType: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanData {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  status: "draft" | "active" | "completed";
  totalCalories: number | null;
  meals: MealData[];
}

// ─── Constants ────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

// ─── Component ────────────────────────────────────────────────────────────

export function MealPlanView({ plan }: { plan: MealPlanData }) {
  const mealsByDayAndType = new Map<string, MealData>();
  for (const meal of plan.meals) {
    mealsByDayAndType.set(`${meal.dayOfWeek}-${meal.mealType}`, meal);
  }

  // Calculate daily totals
  const dailyTotals = DAYS.map((_, dayIndex) => {
    const dayMeals = plan.meals.filter((m) => m.dayOfWeek === dayIndex);
    return {
      calories: dayMeals.reduce((s, m) => s + m.calories, 0),
      protein: dayMeals.reduce((s, m) => s + m.protein, 0),
      carbs: dayMeals.reduce((s, m) => s + m.carbs, 0),
      fat: dayMeals.reduce((s, m) => s + m.fat, 0),
    };
  });

  // Weekly totals
  const weeklyTotals = dailyTotals.reduce(
    (acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const startDate = new Date(plan.startDate);
  const endDate = new Date(plan.endDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weekly Meal Plan</h2>
          <p className="text-sm text-muted-foreground">
            {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} —{" "}
            {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[plan.status]}`}
        >
          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
        </span>
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{formatCalories(weeklyTotals.calories)}</p>
              <p className="text-sm text-muted-foreground">Calories</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(weeklyTotals.protein)}g</p>
              <p className="text-sm text-muted-foreground">Protein</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(weeklyTotals.carbs)}g</p>
              <p className="text-sm text-muted-foreground">Carbs</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(weeklyTotals.fat)}g</p>
              <p className="text-sm text-muted-foreground">Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Cards */}
      {DAYS.map((day, dayIndex) => {
        const totals = dailyTotals[dayIndex];
        return (
          <Card key={day}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{day}</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {formatCalories(totals.calories)} · P:{Math.round(totals.protein)}g C:{Math.round(totals.carbs)}g F:{Math.round(totals.fat)}g
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {MEAL_TYPES.map((type) => {
                  const meal = mealsByDayAndType.get(`${dayIndex}-${type}`);
                  return (
                    <div
                      key={type}
                      className="rounded-lg border p-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {MEAL_TYPE_LABELS[type]}
                      </p>
                      {meal ? (
                        <div className="mt-1">
                          <p className="font-medium">{meal.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {meal.description}
                          </p>
                          <p className="text-xs mt-2 text-muted-foreground">
                            {Math.round(meal.calories)} kcal · P:{Math.round(meal.protein)}g C:{Math.round(meal.carbs)}g F:{Math.round(meal.fat)}g
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          No meal planned
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
