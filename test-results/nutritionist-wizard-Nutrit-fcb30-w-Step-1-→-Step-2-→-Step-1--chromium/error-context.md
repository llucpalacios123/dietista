# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nutritionist-wizard.spec.ts >> Nutritionist Wizard E2E >> profile modification flow (Step 1 → Step 2 → Step 1)
- Location: e2e/nutritionist-wizard.spec.ts:134:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /register/i })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Dietista" [level=1] [ref=e5]
      - paragraph [ref=e6]: Create your account to get started
    - generic [ref=e7]:
      - generic [ref=e8]:
        - heading "Create Account" [level=3] [ref=e9]
        - paragraph [ref=e10]: Enter your email and password to get started
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]:
            - text: Email
            - textbox "Email" [ref=e14]:
              - /placeholder: you@example.com
              - text: wizard-e2e-1779204409145@test.com
          - generic [ref=e15]:
            - text: Password
            - textbox "Password" [active] [ref=e16]:
              - /placeholder: Min 8 chars, 1 uppercase, 1 number
              - text: WizardE2e1
          - button "Create Account" [ref=e17] [cursor=pointer]
        - paragraph [ref=e18]:
          - text: Already have an account?
          - link "Sign in" [ref=e19] [cursor=pointer]:
            - /url: /login
  - button "Open Next.js Dev Tools" [ref=e25] [cursor=pointer]:
    - img [ref=e26]
  - alert [ref=e29]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * E2E test: Nutritionist Chat Wizard (6-step meal planner)
  5   |  *
  6   |  * Tests the full wizard flow:
  7   |  * 1. Profile Review (Step 1) — view data, confirm or trigger edit
  8   |  * 2. Profile Modification (Step 2) — edit fields
  9   |  * 3. Preferences Collection (Step 3) — fill food preferences
  10  |  * 4. Generation (Step 4) — loading state
  11  |  * 5. Review & Modification (Step 5) — review plan, modify, undo
  12  |  * 6. Confirmation (Step 6) — validate JSON, confirm
  13  |  *
  14  |  * Prerequisites:
  15  |  *   1. PostgreSQL running
  16  |  *   2. Database migrated
  17  |  *   3. Dev server running
  18  |  *   4. OPENAI_API_KEY set in environment
  19  |  */
  20  | 
  21  | test.describe("Nutritionist Wizard E2E", () => {
  22  |   const testEmail = `wizard-e2e-${Date.now()}@test.com`;
  23  |   const testPassword = "WizardE2e1";
  24  | 
  25  |   test.beforeEach(async ({ page }) => {
  26  |     // Register
  27  |     await page.goto("/register");
  28  |     await page.getByLabel(/email/i).fill(testEmail);
  29  |     await page.getByLabel(/password/i).fill(testPassword);
> 30  |     await page.getByRole("button", { name: /register/i }).click();
      |                                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
  31  |     await expect(page).toHaveURL(/\/login/);
  32  | 
  33  |     // Login
  34  |     await page.getByLabel(/email/i).fill(testEmail);
  35  |     await page.getByLabel(/password/i).fill(testPassword);
  36  |     await page.getByRole("button", { name: /sign in|login/i }).click();
  37  |     await expect(page).toHaveURL(/\/dashboard|\/profile/);
  38  | 
  39  |     // Create profile with all fields
  40  |     await page.goto("/profile");
  41  |     await page.getByLabel(/weight/i).fill("70");
  42  |     await page.getByLabel(/height/i).fill("175");
  43  |     await page.getByLabel(/age/i).fill("30");
  44  |     await page.getByLabel(/sex/i).selectOption("male");
  45  |     await page.getByLabel(/goal/i).selectOption("lose");
  46  |     await page.getByLabel(/activity/i).first().selectOption("moderate");
  47  |     await page.getByRole("button", { name: /save|create|guardar/i }).click();
  48  |   });
  49  | 
  50  |   test("complete 6-step wizard flow: profile review → confirmation", async ({ page }) => {
  51  |     // ─── Navigate to the wizard page ──────────────────────────────────
  52  |     await page.goto("/meal-plans/new");
  53  | 
  54  |     // Should see the page title
  55  |     await expect(page.getByText(/nuevo plan|new meal plan/i)).toBeVisible();
  56  | 
  57  |     // Should see progress bar
  58  |     await expect(page.getByText(/paso 1|step 1/i)).toBeVisible();
  59  | 
  60  |     // ─── Step 1: Profile Review ───────────────────────────────────────
  61  |     // Verify profile data is displayed
  62  |     await expect(page.getByText(/tu perfil actual|your profile/i)).toBeVisible();
  63  | 
  64  |     // Profile fields should be visible
  65  |     await expect(page.getByText("70")).toBeVisible(); // weight
  66  |     await expect(page.getByText("175")).toBeVisible(); // height
  67  |     await expect(page.getByText("30")).toBeVisible(); // age
  68  | 
  69  |     // Click "All correct, continue"
  70  |     await page.getByRole("button", { name: /todo correcto|all correct|continuar/i }).click();
  71  | 
  72  |     // ─── Step 3: Preferences Collection ───────────────────────────────
  73  |     // (We skip Step 2 since we didn't request edits)
  74  |     await expect(page.getByText(/preferencias|preferences/i)).toBeVisible();
  75  | 
  76  |     // Fill in preferences
  77  |     // Allergies
  78  |     const allergyInput = page.locator("input[placeholder*='maní']").first();
  79  |     if (await allergyInput.isVisible()) {
  80  |       await allergyInput.fill("peanuts");
  81  |       await page.getByRole("button", { name: /agregar|add/i }).first().click();
  82  |     }
  83  | 
  84  |     // Diet type
  85  |     await page.getByRole("combobox").filter({ hasText: /tipo de dieta|diet type/i }).first()
  86  |       .click();
  87  |     await page.getByRole("option", { name: /omnívoro|omnivore/i }).click();
  88  | 
  89  |     // Budget friendly
  90  |     await page.getByRole("combobox").filter({ hasText: /modo económico|budget/i }).first()
  91  |       .click();
  92  |     await page.getByRole("option", { name: /sí|yes|true/i }).click();
  93  | 
  94  |     // Meal complexity
  95  |     await page.getByRole("combobox").filter({ hasText: /complejidad|complexity/i }).first()
  96  |       .click();
  97  |     await page.getByRole("option", { name: /simple/i }).click();
  98  | 
  99  |     // Meals per day
  100 |     await page.getByRole("combobox").filter({ hasText: /comidas por día|meals per day/i }).first()
  101 |       .click();
  102 |     await page.getByRole("option", { name: "4" }).click();
  103 | 
  104 |     // Submit preferences
  105 |     await page.getByRole("button", { name: /continuar/i }).click();
  106 | 
  107 |     // ─── Step 4: Generation Loading ──────────────────────────────────
  108 |     // Wait for loading state
  109 |     await expect(page.getByText(/creando|creating/i)).toBeVisible({ timeout: 10000 });
  110 | 
  111 |     // Wait for generation to complete (Step 4 → 5)
  112 |     // This may take a while due to OpenAI call
  113 |     await expect(page.getByText(/revisá|review/i)).toBeVisible({ timeout: 120000 });
  114 | 
  115 |     // ─── Step 5: Review & Modification ───────────────────────────────
  116 |     // Weekly totals should be visible
  117 |     await expect(page.getByText(/calorías|calories/i)).toBeVisible();
  118 | 
  119 |     // Days should be present
  120 |     const dayCards = page.locator("[class*='Card']").filter({ hasText: /lunes|monday/i });
  121 |     // At least one day card should be visible
  122 |     await expect(page.locator("text=Lunes")).toBeVisible({ timeout: 5000 });
  123 | 
  124 |     // Confirm the plan
  125 |     await page.getByRole("button", { name: /confirmar plan|confirm plan/i }).click();
  126 | 
  127 |     // ─── Step 6: Confirmation ────────────────────────────────────────
  128 |     await expect(page.getByText(/plan confirmado|confirmed/i)).toBeVisible({ timeout: 10000 });
  129 | 
  130 |     // JSON preview should be visible
```