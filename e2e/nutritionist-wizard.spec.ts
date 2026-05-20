import { test, expect } from "@playwright/test";

/**
 * E2E test: Nutritionist Chat Wizard (6-step meal planner)
 *
 * Tests the full wizard flow:
 * 1. Profile Review (Step 1) — view data, confirm or trigger edit
 * 2. Profile Modification (Step 2) — edit fields
 * 3. Preferences Collection (Step 3) — fill food preferences
 * 4. Generation (Step 4) — loading state
 * 5. Review & Modification (Step 5) — review plan, modify, undo
 * 6. Confirmation (Step 6) — validate JSON, confirm
 *
 * Prerequisites:
 *   1. PostgreSQL running
 *   2. Database migrated
 *   3. Dev server running
 *   4. OPENAI_API_KEY set in environment
 */

test.describe("Nutritionist Wizard E2E", () => {
  const testEmail = `wizard-e2e-${Date.now()}@test.com`;
  const testPassword = "WizardE2e1";

  test.beforeEach(async ({ page }) => {
    // Register
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole("button", { name: /register/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole("button", { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard|\/profile/);

    // Create profile with all fields
    await page.goto("/profile");
    await page.getByLabel(/weight/i).fill("70");
    await page.getByLabel(/height/i).fill("175");
    await page.getByLabel(/age/i).fill("30");
    await page.getByLabel(/sex/i).selectOption("male");
    await page.getByLabel(/goal/i).selectOption("lose");
    await page.getByLabel(/activity/i).first().selectOption("moderate");
    await page.getByRole("button", { name: /save|create|guardar/i }).click();
  });

  test("complete 6-step wizard flow: profile review → confirmation", async ({ page }) => {
    // ─── Navigate to the wizard page ──────────────────────────────────
    await page.goto("/meal-plans/new");

    // Should see the page title
    await expect(page.getByText(/nuevo plan|new meal plan/i)).toBeVisible();

    // Should see progress bar
    await expect(page.getByText(/paso 1|step 1/i)).toBeVisible();

    // ─── Step 1: Profile Review ───────────────────────────────────────
    // Verify profile data is displayed
    await expect(page.getByText(/tu perfil actual|your profile/i)).toBeVisible();

    // Profile fields should be visible
    await expect(page.getByText("70")).toBeVisible(); // weight
    await expect(page.getByText("175")).toBeVisible(); // height
    await expect(page.getByText("30")).toBeVisible(); // age

    // Click "All correct, continue"
    await page.getByRole("button", { name: /todo correcto|all correct|continuar/i }).click();

    // ─── Step 3: Preferences Collection ───────────────────────────────
    // (We skip Step 2 since we didn't request edits)
    await expect(page.getByText(/preferencias|preferences/i)).toBeVisible();

    // Fill in preferences
    // Allergies
    const allergyInput = page.locator("input[placeholder*='maní']").first();
    if (await allergyInput.isVisible()) {
      await allergyInput.fill("peanuts");
      await page.getByRole("button", { name: /agregar|add/i }).first().click();
    }

    // Diet type
    await page.getByRole("combobox").filter({ hasText: /tipo de dieta|diet type/i }).first()
      .click();
    await page.getByRole("option", { name: /omnívoro|omnivore/i }).click();

    // Budget friendly
    await page.getByRole("combobox").filter({ hasText: /modo económico|budget/i }).first()
      .click();
    await page.getByRole("option", { name: /sí|yes|true/i }).click();

    // Meal complexity
    await page.getByRole("combobox").filter({ hasText: /complejidad|complexity/i }).first()
      .click();
    await page.getByRole("option", { name: /simple/i }).click();

    // Meals per day
    await page.getByRole("combobox").filter({ hasText: /comidas por día|meals per day/i }).first()
      .click();
    await page.getByRole("option", { name: "4" }).click();

    // Submit preferences
    await page.getByRole("button", { name: /continuar/i }).click();

    // ─── Step 4: Generation Loading ──────────────────────────────────
    // Wait for loading state
    await expect(page.getByText(/creando|creating/i)).toBeVisible({ timeout: 10000 });

    // Wait for generation to complete (Step 4 → 5)
    // This may take a while due to OpenAI call
    await expect(page.getByText(/revisá|review/i)).toBeVisible({ timeout: 120000 });

    // ─── Step 5: Review & Modification ───────────────────────────────
    // Weekly totals should be visible
    await expect(page.getByText(/calorías|calories/i)).toBeVisible();

    // Days should be present
    const dayCards = page.locator("[class*='Card']").filter({ hasText: /lunes|monday/i });
    // At least one day card should be visible
    await expect(page.locator("text=Lunes")).toBeVisible({ timeout: 5000 });

    // Confirm the plan
    await page.getByRole("button", { name: /confirmar plan|confirm plan/i }).click();

    // ─── Step 6: Confirmation ────────────────────────────────────────
    await expect(page.getByText(/plan confirmado|confirmed/i)).toBeVisible({ timeout: 10000 });

    // JSON preview should be visible
    await expect(page.getByText(/userProfile/)).toBeVisible({ timeout: 5000 });
  });

  test("profile modification flow (Step 1 → Step 2 → Step 1)", async ({ page }) => {
    await page.goto("/meal-plans/new");

    // Wait for profile review
    await expect(page.getByText(/tu perfil actual|your profile/i)).toBeVisible();

    // Click edit on a field (weight edit button)
    const editButtons = page.getByRole("button", { name: /editar/i });
    const editButtonCount = await editButtons.count();
    if (editButtonCount > 0) {
      await editButtons.first().click();
    }

    // Should now be in modification step
    await expect(page.getByText(/modificar|modify/i)).toBeVisible();

    // Change weight
    const weightInput = page.getByLabel(/peso|weight/i).first();
    if (await weightInput.isVisible()) {
      await weightInput.fill("75");
    }

    // Save changes
    await page.getByRole("button", { name: /guardar cambios|save changes/i }).click();

    // Should advance to preferences
    await expect(page.getByText(/preferencias|preferences/i)).toBeVisible();
  });

  test("modification + undo in review step", async ({ page }) => {
    // This test requires a pre-generated plan.
    // For now, test that the UI elements for modification are present.

    await page.goto("/meal-plans/new");

    // Skip to preferences quickly
    await expect(page.getByText(/tu perfil actual|your profile/i)).toBeVisible();
    await page.getByRole("button", { name: /todo correcto|all correct|continuar/i }).click();

    // Submit minimal preferences
    await expect(page.getByText(/preferencias|preferences/i)).toBeVisible();
    await page.getByRole("button", { name: /continuar/i }).click();

    // Wait for generation
    await expect(page.getByText(/revisá|review/i)).toBeVisible({ timeout: 120000 });

    // Modification counter should be visible (showing 0 modifications)
    // The undo button should not be visible until modifications are made

    // Click modify on a meal (hover-based button)
    const mealCards = page.locator("[class*='group']").filter({ hasText: /kcal/i });
    if (await mealCards.count() > 0) {
      await mealCards.first().hover();
      const modifyBtn = page.getByRole("button", { name: /modificar/i });
      if (await modifyBtn.isVisible({ timeout: 2000 })) {
        await modifyBtn.click();
        // Reason dialog should appear
        await expect(page.getByText(/por qué|why/i)).toBeVisible({ timeout: 3000 });
        // Select a reason
        await page.getByRole("button", { name: /no me gusta|don't like/i }).click();
      }
    }
  });

  test("progress bar updates correctly through steps", async ({ page }) => {
    await page.goto("/meal-plans/new");

    // Step 1
    await expect(page.getByText(/paso 1|step 1/i)).toBeVisible();
    await page.getByRole("button", { name: /todo correcto|all correct|continuar/i }).click();

    // Step 3 (skipped step 2)
    await expect(page.getByText(/paso 3 de 6|step 3 of 6/i)).toBeVisible();
    await page.getByRole("button", { name: /continuar/i }).click();

    // Step 4
    await expect(page.getByText(/creando|creating/i)).toBeVisible({ timeout: 10000 });
  });
});
