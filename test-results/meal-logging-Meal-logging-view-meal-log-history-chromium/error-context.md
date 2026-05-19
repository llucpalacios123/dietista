# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: meal-logging.spec.ts >> Meal logging >> view meal log history
- Location: e2e/meal-logging.spec.ts:122:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/profile created successfully/i)
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for getByText(/profile created successfully/i)

```

```yaml
- banner:
  - link "Dietista":
    - /url: /dashboard
  - navigation:
    - link "Dashboard":
      - /url: /dashboard
    - link "Profile":
      - /url: /profile
    - link "Meal Plans":
      - /url: /meal-plans
    - link "Meal Logs":
      - /url: /meal-logs
    - button "Logout"
- main:
  - heading "Profile" [level=1]
  - paragraph: Update your nutritional parameters for personalized meal plans.
  - heading "Update Profile" [level=3]
  - paragraph: Edit your nutritional parameters for personalized meal plans.
  - alert: Profile updated successfully!
  - text: Weight (kg)
  - spinbutton "Weight (kg)": "70"
  - text: Height (cm)
  - spinbutton "Height (cm)": "175"
  - text: Age
  - spinbutton "Age": "30"
  - text: Sex
  - combobox "Sex": Male
  - text: Goal
  - combobox "Goal": Lose weight
  - text: Activity Level
  - combobox "Activity Level": Moderate (3-5 days/week)
  - button "Show advanced options"
  - button "Update Profile"
- alert
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { generateEmail, generatePassword, defaultProfileData } from "./helpers/test-data";
  3   | import { registerUser, loginUser } from "./helpers/api";
  4   | import { clearAllMocks } from "./helpers/mock-ai";
  5   | 
  6   | test.describe("Meal logging", () => {
  7   |   test.afterEach(async ({ page }) => {
  8   |     await clearAllMocks(page);
  9   |   });
  10  | 
  11  |   async function setupUserWithProfile(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
  12  |     const email = generateEmail("meallog");
  13  |     const password = generatePassword();
  14  |     await registerUser(request, email, password);
  15  |     const cookies = await loginUser(request, email, password);
  16  |     await page.context().addCookies(cookies);
  17  | 
  18  |     // Create profile
  19  |     await page.goto("/profile");
  20  |     const profile = defaultProfileData();
  21  |     await page.getByLabel(/weight/i).fill(profile.weight);
  22  |     await page.getByLabel(/height/i).fill(profile.height);
  23  |     await page.getByLabel(/age/i).fill(profile.age);
  24  | 
  25  |     await page.getByLabel(/sex/i).click();
  26  |     await page.waitForTimeout(500);
  27  |     await page.getByRole("option", { name: "Male" }).first().click();
  28  |     await page.waitForTimeout(500);
  29  | 
  30  |     await page.getByLabel(/goal/i).click();
  31  |     await page.waitForTimeout(500);
  32  |     await page.getByRole("option", { name: "Lose weight" }).first().click();
  33  |     await page.waitForTimeout(500);
  34  | 
  35  |     await page.getByLabel(/activity level/i).click();
  36  |     await page.waitForTimeout(500);
  37  |     await page.getByRole("option", { name: /moderate/i }).first().click();
  38  |     await page.waitForTimeout(500);
  39  | 
  40  |     await page.getByRole("button", { name: /create profile/i }).click();
> 41  |     await expect(page.getByText(/profile created successfully/i)).toBeVisible({ timeout: 30000 });
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  42  | 
  43  |     await page.waitForTimeout(2000);
  44  |     return { email, password };
  45  |   }
  46  | 
  47  |   test("log a meal with valid data", async ({ page, request }) => {
  48  |     test.setTimeout(120000);
  49  |     await setupUserWithProfile(page, request);
  50  | 
  51  |     await page.goto("/meal-logs");
  52  | 
  53  |     // Set date via evaluate to bypass browser date input validation
  54  |     const today = new Date();
  55  |     today.setHours(12, 0, 0, 0);
  56  |     await page.evaluate((iso) => {
  57  |       const input = document.querySelector('input[name="date"]') as HTMLInputElement;
  58  |       if (input) {
  59  |         input.removeAttribute("type");
  60  |         input.value = iso;
  61  |       }
  62  |     }, today.toISOString());
  63  | 
  64  |     // Fill food description
  65  |     await page.getByLabel(/what did you eat/i).fill("grilled chicken breast 200g, rice 150g, salad");
  66  | 
  67  |     // Submit
  68  |     await page.getByRole("button", { name: /log meal/i }).click();
  69  | 
  70  |     // Wait for processing (OpenAI interpretation takes time)
  71  |     await page.waitForTimeout(30000);
  72  | 
  73  |     // Check for success or error (depends on OPENAI_API_KEY)
  74  |     const successVisible = await page.getByText(/meal logged successfully/i).isVisible().catch(() => false);
  75  |     const errorVisible = await page.getByText(/failed|invalid/i).isVisible().catch(() => false);
  76  | 
  77  |     if (successVisible) {
  78  |       // Reload to see the meal in the list
  79  |       await page.reload();
  80  |       // Wait for the list to load - either shows the meal or "no meal logs found"
  81  |       await page.waitForTimeout(5000);
  82  |       const mealVisible = await page.getByText(/chicken|grilled/i).isVisible().catch(() => false);
  83  |       const noLogsVisible = await page.getByText(/no meal logs found/i).isVisible().catch(() => false);
  84  |       expect(mealVisible || noLogsVisible).toBe(true);
  85  |     } else {
  86  |       // Skip if no API key - log but don't fail
  87  |       console.log("Meal log skipped (no OpenAI API key or API error)");
  88  |     }
  89  |   });
  90  | 
  91  |   test("log meal with past date", async ({ page, request }) => {
  92  |     test.setTimeout(120000);
  93  |     await setupUserWithProfile(page, request);
  94  | 
  95  |     await page.goto("/meal-logs");
  96  | 
  97  |     // Set date to yesterday via evaluate
  98  |     const yesterday = new Date();
  99  |     yesterday.setDate(yesterday.getDate() - 1);
  100 |     yesterday.setHours(12, 0, 0, 0);
  101 |     await page.evaluate((iso) => {
  102 |       const input = document.querySelector('input[name="date"]') as HTMLInputElement;
  103 |       if (input) {
  104 |         input.removeAttribute("type");
  105 |         input.value = iso;
  106 |       }
  107 |     }, yesterday.toISOString());
  108 | 
  109 |     await page.getByLabel(/what did you eat/i).fill("oatmeal with banana and honey");
  110 | 
  111 |     await page.getByRole("button", { name: /log meal/i }).click();
  112 | 
  113 |     // Wait for processing
  114 |     await page.waitForTimeout(30000);
  115 | 
  116 |     const successVisible = await page.getByText(/meal logged successfully/i).isVisible().catch(() => false);
  117 |     if (!successVisible) {
  118 |       console.log("Meal log skipped (no OpenAI API key or API error)");
  119 |     }
  120 |   });
  121 | 
  122 |   test("view meal log history", async ({ page, request }) => {
  123 |     await setupUserWithProfile(page, request);
  124 | 
  125 |     await page.goto("/meal-logs");
  126 | 
  127 |     // Initial state should show no logs or loading
  128 |     await expect(
  129 |       page.getByText(/no meal logs found|loading meal logs/i)
  130 |     ).toBeVisible({ timeout: 10000 });
  131 |   });
  132 | 
  133 |   test("date filter shows correct range", async ({ page, request }) => {
  134 |     await setupUserWithProfile(page, request);
  135 | 
  136 |     await page.goto("/meal-logs");
  137 | 
  138 |     // Check that date filter inputs exist
  139 |     await expect(page.getByText(/from/i)).toBeVisible({ timeout: 10000 });
  140 |     await expect(page.getByText(/to/i)).toBeVisible();
  141 |     await expect(page.getByRole("button", { name: /apply/i })).toBeVisible();
```