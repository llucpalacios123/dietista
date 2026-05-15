import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const foods = [
  // Proteins
  { name: "Chicken Breast", category: "Protein", unit: "g", calories: 165, protein: 31, carbs: 0, fat: 3.6, brand: null },
  { name: "Salmon", category: "Protein", unit: "g", calories: 208, protein: 20, carbs: 0, fat: 13, brand: null },
  { name: "Tuna", category: "Protein", unit: "g", calories: 132, protein: 29, carbs: 0, fat: 1.3, brand: null },
  { name: "Egg", category: "Protein", unit: "g", calories: 155, protein: 13, carbs: 1.1, fat: 11, brand: null },
  { name: "Greek Yogurt", category: "Protein", unit: "g", calories: 59, protein: 10, carbs: 3.6, fat: 0.7, brand: null },
  { name: "Tofu", category: "Protein", unit: "g", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, brand: null },
  // Grains
  { name: "Brown Rice", category: "Grain", unit: "g", calories: 123, protein: 2.7, carbs: 26, fat: 1, brand: null },
  { name: "Oats", category: "Grain", unit: "g", calories: 389, protein: 17, carbs: 66, fat: 7, brand: null },
  { name: "Quinoa", category: "Grain", unit: "g", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, brand: null },
  { name: "Whole Wheat Bread", category: "Grain", unit: "g", calories: 247, protein: 13, carbs: 41, fat: 3.4, brand: null },
  // Vegetables
  { name: "Broccoli", category: "Vegetable", unit: "g", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, brand: null },
  { name: "Spinach", category: "Vegetable", unit: "g", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, brand: null },
  { name: "Sweet Potato", category: "Vegetable", unit: "g", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, brand: null },
  { name: "Tomato", category: "Vegetable", unit: "g", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, brand: null },
  // Fruits
  { name: "Banana", category: "Fruit", unit: "g", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, brand: null },
  { name: "Apple", category: "Fruit", unit: "g", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, brand: null },
  { name: "Blueberries", category: "Fruit", unit: "g", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, brand: null },
  // Fats
  { name: "Avocado", category: "Fat", unit: "g", calories: 160, protein: 2, carbs: 9, fat: 15, brand: null },
  { name: "Almonds", category: "Fat", unit: "g", calories: 579, protein: 21, carbs: 22, fat: 50, brand: null },
  { name: "Olive Oil", category: "Fat", unit: "ml", calories: 884, protein: 0, carbs: 0, fat: 100, brand: null },
  // Dairy
  { name: "Milk", category: "Dairy", unit: "ml", calories: 42, protein: 3.4, carbs: 5, fat: 1, brand: null },
  { name: "Cheddar Cheese", category: "Dairy", unit: "g", calories: 403, protein: 25, carbs: 1.3, fat: 33, brand: null },
  // Legumes
  { name: "Lentils", category: "Legume", unit: "g", calories: 116, protein: 9, carbs: 20, fat: 0.4, brand: null },
  { name: "Chickpeas", category: "Legume", unit: "g", calories: 164, protein: 8.9, carbs: 27, fat: 2.6, brand: null },
];

async function main() {
  console.log("Seeding food catalog...");

  for (const food of foods) {
    const existing = await prisma.food.findFirst({
      where: { name: food.name, brand: food.brand },
    });
    if (!existing) {
      await prisma.food.create({ data: food });
    }
  }

  console.log(`Seeded ${foods.length} food items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
