import { describe, it, expect } from "vitest";
import { mergeIngredients } from "@/lib/shopping-list-extract";

// ─── Ingredient merging from meal plan (tasks 2.7–2.8) ────────────────────

describe("mergeIngredients", () => {
  it("extracts ingredients from meals and merges duplicates by name+unit", () => {
    const meals = [
      {
        dayOfWeek: 0,
        ingredients: [
          { name: "pollo", quantity: 200, unit: "g" },
          { name: "arroz", quantity: 100, unit: "g" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
      {
        dayOfWeek: 2,
        ingredients: [
          { name: "pollo", quantity: 300, unit: "g" },
          { name: "cebolla", quantity: 1, unit: "unidades" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
    ];

    const result = mergeIngredients(meals);

    // Pollo (g) should be merged: 200 + 300 = 500
    const pollo = result.find((i) => i.name === "pollo");
    expect(pollo).toBeDefined();
    expect(pollo!.quantity).toBe(500);
    expect(pollo!.unit).toBe("g");

    // Arroz should be separate
    const arroz = result.find((i) => i.name === "arroz");
    expect(arroz).toBeDefined();
    expect(arroz!.quantity).toBe(100);
    expect(arroz!.unit).toBe("g");

    // Cebolla should be separate
    const cebolla = result.find((i) => i.name === "cebolla");
    expect(cebolla).toBeDefined();
    expect(cebolla!.quantity).toBe(1);
    expect(cebolla!.unit).toBe("unidades");
  });

  it("lists same ingredient with different units separately", () => {
    const meals = [
      {
        dayOfWeek: 0,
        ingredients: [
          { name: "aceite", quantity: 30, unit: "ml" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
      {
        dayOfWeek: 1,
        ingredients: [
          { name: "aceite", quantity: 2, unit: "cucharadas" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
    ];

    const result = mergeIngredients(meals);

    expect(result).toHaveLength(2);
    const ml = result.find((i) => i.unit === "ml");
    const cucharadas = result.find((i) => i.unit === "cucharadas");
    expect(ml).toBeDefined();
    expect(cucharadas).toBeDefined();
    expect(ml!.quantity).toBe(30);
    expect(cucharadas!.quantity).toBe(2);
  });

  it("handles empty ingredients arrays", () => {
    const meals = [
      {
        dayOfWeek: 0,
        ingredients: [] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
      {
        dayOfWeek: 1,
        ingredients: [
          { name: "pollo", quantity: 200, unit: "g" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
    ];

    const result = mergeIngredients(meals);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("pollo");
  });

  it("returns empty array for meals with no ingredients at all", () => {
    const meals: Array<{ dayOfWeek: number; ingredients: Array<{ name: string; quantity?: number; unit?: string }> }> = [
      { dayOfWeek: 0, ingredients: [] },
      { dayOfWeek: 1, ingredients: [] },
    ];

    const result = mergeIngredients(meals);

    expect(result).toEqual([]);
  });

  it("handles ingredients with no quantity (defaults to 0)", () => {
    const meals = [
      {
        dayOfWeek: 0,
        ingredients: [
          { name: "sal" },
          { name: "pimienta", quantity: 1, unit: "cucharadita" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
    ];

    const result = mergeIngredients(meals);

    const sal = result.find((i) => i.name === "sal");
    expect(sal).toBeDefined();
    expect(sal!.quantity).toBe(0);
    expect(sal!.unit).toBeUndefined();
  });

  it("merges ingredients with same name and no unit", () => {
    const meals = [
      {
        dayOfWeek: 0,
        ingredients: [
          { name: "sal" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
      {
        dayOfWeek: 1,
        ingredients: [
          { name: "sal" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
    ];

    const result = mergeIngredients(meals);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("sal");
    expect(result[0].quantity).toBe(0);
  });

  it("produces deterministic output order", () => {
    const meals = [
      {
        dayOfWeek: 0,
        ingredients: [
          { name: "Zanahoria", quantity: 3, unit: "unidades" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
      {
        dayOfWeek: 0,
        ingredients: [
          { name: "arroz", quantity: 100, unit: "g" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
      {
        dayOfWeek: 1,
        ingredients: [
          { name: "pollo", quantity: 200, unit: "g" },
        ] as Array<{ name: string; quantity?: number; unit?: string }>,
      },
    ];

    const result1 = mergeIngredients(meals);
    const result2 = mergeIngredients(meals);

    expect(result1.map((i) => i.name)).toEqual(result2.map((i) => i.name));
  });

  it("handles large meal plan with many ingredients", () => {
    // Simulate 7 days × 4 meals × 3 ingredients = 84 ingredient entries
    const meals: Array<{ dayOfWeek: number; ingredients: Array<{ name: string; quantity?: number; unit?: string }> }> = [];
    const proteins = ["pollo", "ternera", "pescado", "huevos", "lentejas", "tofu"];
    const sides = ["arroz", "patatas", "pasta", "quinoa", "pan", "verduras"];

    for (let day = 0; day < 7; day++) {
      for (let mealIdx = 0; mealIdx < 4; mealIdx++) {
        meals.push({
          dayOfWeek: day,
          ingredients: [
            { name: proteins[(day + mealIdx) % proteins.length], quantity: 150 + day * 20, unit: "g" },
            { name: sides[(day * 2 + mealIdx) % sides.length], quantity: 100 + day * 10, unit: "g" },
            { name: "aceite de oliva", quantity: 15, unit: "ml" },
          ],
        });
      }
    }

    const result = mergeIngredients(meals);

    // aceite de oliva should be merged across all 28 meals (28 × 15 = 420)
    const aceite = result.find((i) => i.name === "aceite de oliva");
    expect(aceite).toBeDefined();
    expect(aceite!.quantity).toBe(420);

    // Proteins should all be present
    for (const p of proteins) {
      const found = result.find((i) => i.name === p);
      expect(found, `Should find ${p}`).toBeDefined();
    }
  });
});
