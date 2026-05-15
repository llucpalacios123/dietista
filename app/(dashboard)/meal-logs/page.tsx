import { MealLogForm } from "@/components/meal-logs/meal-log-form";
import { MealLogList } from "@/components/meal-logs/meal-log-list";

export default function MealLogsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meal Logs</h1>
        <p className="mt-1 text-muted-foreground">
          Track your daily food intake with AI-powered nutrition analysis
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: New Entry Form */}
        <div>
          <MealLogForm />
        </div>

        {/* Right: Log History */}
        <div>
          <MealLogList />
        </div>
      </div>
    </div>
  );
}
