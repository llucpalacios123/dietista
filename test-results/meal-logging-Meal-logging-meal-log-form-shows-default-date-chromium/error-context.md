# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: meal-logging.spec.ts >> Meal logging >> meal log form shows default date
- Location: e2e/meal-logging.spec.ts:190:7

# Error details

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

```
Error: page.unrouteAll: Target page, context or browser has been closed
```

# Test source

```ts
  73  |       }),
  74  |     });
  75  |   });
  76  | }
  77  | 
  78  | /** Mocks the generate endpoint to return a 429 rate-limit error. */
  79  | export async function mockRateLimit(page: Page): Promise<void> {
  80  |   await page.route("**/api/meal-plans/generate", async (route) => {
  81  |     await route.fulfill({
  82  |       status: 429,
  83  |       contentType: "application/json",
  84  |       body: JSON.stringify({
  85  |         message:
  86  |           "Please wait 45 minutes before generating another plan",
  87  |       }),
  88  |     });
  89  |   });
  90  | }
  91  | 
  92  | // ─── Meal Plan Data Mock (for GET /api/meal-plans) ──────────────────────────
  93  | 
  94  | /**
  95  |  * Mocks GET /api/meal-plans to return a fully-populated active meal plan
  96  |  * with meals across multiple days. Used after job polling completes so the
  97  |  * meal-plan page can render the result.
  98  |  */
  99  | export async function mockActiveMealPlan(
  100 |   page: Page,
  101 |   planId?: string
  102 | ): Promise<void> {
  103 |   const id = planId ?? `mp-test-${Date.now()}`;
  104 |   const today = new Date();
  105 |   const startDate = new Date(today);
  106 |   // Monday of current week
  107 |   const dayOfWeek = today.getDay();
  108 |   const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  109 |   startDate.setDate(today.getDate() + mondayOffset);
  110 |   startDate.setHours(0, 0, 0, 0);
  111 | 
  112 |   const endDate = new Date(startDate);
  113 |   endDate.setDate(startDate.getDate() + 6);
  114 |   endDate.setHours(23, 59, 59, 999);
  115 | 
  116 |   await page.route("**/api/meal-plans", async (route) => {
  117 |     // Only mock the GET (not POSTs to /api/meal-plans/generate etc.)
  118 |     if (route.request().method() !== "GET") {
  119 |       await route.continue();
  120 |       return;
  121 |     }
  122 | 
  123 |     const meals = buildMockMeals(id);
  124 |     await route.fulfill({
  125 |       status: 200,
  126 |       contentType: "application/json",
  127 |       body: JSON.stringify({
  128 |         data: {
  129 |           id,
  130 |           startDate: startDate.toISOString(),
  131 |           endDate: endDate.toISOString(),
  132 |           status: "draft",
  133 |           totalCalories: meals.reduce((s, m) => s + m.calories, 0),
  134 |           meals,
  135 |         },
  136 |       }),
  137 |     });
  138 |   });
  139 | }
  140 | 
  141 | function buildMockMeals(planId: string) {
  142 |   const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
  143 |   const meals = [];
  144 | 
  145 |   for (let day = 0; day < 7; day++) {
  146 |     for (const type of mealTypes) {
  147 |       meals.push({
  148 |         id: `meal-${planId}-${day}-${type}`,
  149 |         mealPlanId: planId,
  150 |         dayOfWeek: day,
  151 |         mealType: type,
  152 |         name: `${capitalize(type)} Day ${day + 1}`,
  153 |         description: `Mock ${type} for day ${day + 1}`,
  154 |         calories: 450,
  155 |         protein: 35,
  156 |         carbs: 45,
  157 |         fat: 12,
  158 |       });
  159 |     }
  160 |   }
  161 | 
  162 |   return meals;
  163 | }
  164 | 
  165 | function capitalize(s: string): string {
  166 |   return s.charAt(0).toUpperCase() + s.slice(1);
  167 | }
  168 | 
  169 | // ─── Unmock Helpers ─────────────────────────────────────────────────────────
  170 | 
  171 | /** Removes all route mocks registered on this page. */
  172 | export async function clearAllMocks(page: Page): Promise<void> {
> 173 |   await page.unrouteAll({ behavior: "ignoreErrors" });
      |   ^ Error: page.unrouteAll: Target page, context or browser has been closed
  174 | }
  175 | 
```