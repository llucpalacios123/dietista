import { PrismaClient, MealType, FoodGroup } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Food Catalog ──────────────────────────────────────────────────────────

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

// ─── Carla Bozal Template Data ─────────────────────────────────────────────

const templateGuidelines = [
  "El peso de los alimentos lo haremos en crudo para una referencia fiable. Excepto la legumbre que la pesaremos en cocido.",
  "Debes elegir un alimento de cada grupo para cada comida (1 carbohidratos, 1 proteína, 1 de grasas). Puedes hacer las combinaciones que quieras siempre respetando tus cantidades indicadas.",
  "Puedes cocinar a la plancha, air fryer, horno… y usar aceite de oliva en spray.",
  "Puedes refrescos y bebidas que quieras siempre que sean sin azúcar y/o zero calorías.",
  "Puedes tomar café/infusiones/tés solos cuando quieras. Si vas a usar leche ponemos la leche pautada en el plan.",
  "Puedes hacer una comida libre a la semana cuando quieras.",
  "El batido de proteína después de entrenar es opcional y el día de descanso no es necesario tomarlo.",
  "Intenta llegar a los 2-3l diarios de agua.",
  "Cuando ponga * al lado de un alimento, significa que no ponemos grasas con esa elección. Ya que ese alimento ya tiene grasas.",
  "Dejamos mínimo 1-2h de digestión antes de ir a entrenar.",
  "Pescado azul: intentamos meterlo mínimo 3 veces a la semana por su contenido en omega 3.",
  "Legumbres: intentamos meterlas mínimo 2-3 veces a la semana, ya que son antiinflamatorias.",
  "Jamón serrano, lomo embuchado y bacon: máximo 2 veces a la semana ya que son grasas saturadas y contienen mucho sodio.",
  "Vegetales: incluimos en todas las comidas, mínimo 3 de la lista.",
  "Carbohidratos: intentamos que sean sin gluten la mayoría de las comidas ya que sientan mejor a nivel digestivo.",
  "Gambas, crustáceos y moluscos: máximo 1-2 veces por semana para evitar elevar el colesterol ni abusar de metales pesados.",
  "Intenta dejar 10h de distancia entre la cena y la primera comida del día siguiente.",
  "En cada desayuno, comida y cena debe de haber al menos una pieza de fruta.",
  "Especiar en la cena y comida con cúrcuma + pimienta. La cúrcuma es el mayor antiinflamatorio vegetal y la pimienta aumenta su absorción.",
];

interface MealDef {
  mealType: MealType;
  order: number;
  name: string;
  groups: {
    foodGroup: FoodGroup;
    options: { name: string; quantity: number; unit: string; notes?: string }[];
  }[];
}

const mealDefs: MealDef[] = [
  // ── COMIDA 1: DESAYUNO ──
  {
    mealType: MealType.breakfast,
    order: 1,
    name: "Desayuno",
    groups: [
      {
        foodGroup: FoodGroup.carbohydrates,
        options: [
          { name: "Pan integral o centeno", quantity: 60, unit: "gr" },
          { name: "Cereales sin azúcar (corn flakes/muesli)", quantity: 40, unit: "gr" },
          { name: "Arroz / Crema de arroz", quantity: 40, unit: "gr" },
          { name: "Tortitas de maíz", quantity: 1, unit: "unidad" },
          { name: "Harina de avena / Copos de avena", quantity: 50, unit: "gr" },
          { name: "Quinoa", quantity: 50, unit: "gr" },
          { name: "1 fruta + mitad de otro carbohidrato", quantity: 1, unit: "porcion" },
          { name: "Pan con mermelada o miel", quantity: 40, unit: "gr", notes: "+ 10gr mermelada o miel" },
        ],
      },
      {
        foodGroup: FoodGroup.protein,
        options: [
          { name: "Lomo embuchado / Pavo / Jamón cocido / York +85%", quantity: 70, unit: "gr" },
          { name: "Jamón serrano / Salmón ahumado", quantity: 70, unit: "gr" },
          { name: "Proteína en polvo", quantity: 25, unit: "gr" },
          { name: "Queso fresco batido / Yogurt de proteína / Requesón", quantity: 250, unit: "gr" },
          { name: "Huevos", quantity: 2, unit: "unidad", notes: "*" },
          { name: "Huevo + claras", quantity: 1, unit: "unidad", notes: "+ 150ml claras" },
          { name: "Pudding de proteína", quantity: 1, unit: "porcion" },
          { name: "Soja texturizada", quantity: 50, unit: "gr" },
        ],
      },
      {
        foodGroup: FoodGroup.fat,
        options: [
          { name: "Aceite de oliva virgen extra", quantity: 10, unit: "ml" },
          { name: "Aguacate", quantity: 60, unit: "gr" },
          { name: "Guacamole", quantity: 80, unit: "gr" },
          { name: "Frutos secos", quantity: 15, unit: "gr" },
          { name: "Crema de almendra / cacahuete / avellana", quantity: 15, unit: "gr" },
          { name: "Chocolate 85%", quantity: 15, unit: "gr" },
        ],
      },
      {
        foodGroup: FoodGroup.other,
        options: [
          { name: "Vegetales (espinacas, brócoli, pimientos, pico de gallo, champiñones, remolacha, zanahoria)", quantity: 3, unit: "minimo" },
          { name: "Semillas de chía o lino hidratadas", quantity: 2, unit: "cucharaditas", notes: "Recomendación: mejorar digestiones" },
          { name: "Especias al gusto", quantity: 0, unit: "al gusto", notes: "Pimienta negra favorece absorción de nutrientes" },
          { name: "Edulcorante o saborizante", quantity: 0, unit: "al gusto" },
          { name: "Sazonadores cero", quantity: 0, unit: "al gusto" },
        ],
      },
    ],
  },
  // ── COMIDA 2: ALMUERZO / MERIENDA ──
  {
    mealType: MealType.mid_morning,
    order: 2,
    name: "Almuerzo / Merienda",
    groups: [
      {
        foodGroup: FoodGroup.carbohydrates,
        options: [
          { name: "Pan integral o centeno", quantity: 40, unit: "gr" },
          { name: "Cereales sin azúcar (corn flakes/muesli)", quantity: 40, unit: "gr" },
          { name: "Arroz / Crema de arroz", quantity: 40, unit: "gr" },
          { name: "Tortitas de maíz", quantity: 1, unit: "unidad" },
          { name: "Harina de avena / Copos de avena", quantity: 50, unit: "gr" },
          { name: "Quinoa", quantity: 50, unit: "gr" },
          { name: "1 fruta + mitad de otro carbohidrato", quantity: 1, unit: "porcion" },
          { name: "Pan con mermelada o miel", quantity: 40, unit: "gr", notes: "+ 10gr mermelada o miel" },
        ],
      },
      {
        foodGroup: FoodGroup.protein,
        options: [
          { name: "Lomo embuchado / Pavo / Jamón cocido / York +85%", quantity: 60, unit: "gr" },
          { name: "Jamón serrano / Salmón ahumado", quantity: 60, unit: "gr" },
          { name: "Proteína en polvo", quantity: 30, unit: "gr" },
          { name: "Queso fresco batido / Yogurt de proteína / Requesón", quantity: 150, unit: "gr" },
          { name: "Huevos", quantity: 1, unit: "unidad", notes: "*" },
          { name: "Huevo + claras", quantity: 1, unit: "unidad", notes: "+ 150ml claras" },
          { name: "Pudding de proteína", quantity: 1, unit: "porcion" },
        ],
      },
      {
        foodGroup: FoodGroup.fat,
        options: [
          { name: "Aceite de oliva virgen extra", quantity: 5, unit: "ml" },
          { name: "Aguacate", quantity: 40, unit: "gr" },
          { name: "Guacamole", quantity: 60, unit: "gr" },
          { name: "Frutos secos", quantity: 10, unit: "gr" },
          { name: "Crema de almendra / cacahuete / avellana", quantity: 10, unit: "gr" },
          { name: "Chocolate 85%", quantity: 15, unit: "gr" },
        ],
      },
      {
        foodGroup: FoodGroup.other,
        options: [
          { name: "Vegetales (espinacas, brócoli, pimientos, pico de gallo, champiñones, remolacha, zanahoria)", quantity: 3, unit: "minimo" },
          { name: "Especias (canela, pimienta, cúrcuma, jengibre, perejil)", quantity: 0, unit: "al gusto" },
        ],
      },
    ],
  },
  // ── COMIDA 3: COMIDA ──
  {
    mealType: MealType.lunch,
    order: 3,
    name: "Comida",
    groups: [
      {
        foodGroup: FoodGroup.carbohydrates,
        options: [
          { name: "Arroz / Pasta / Crema de arroz", quantity: 40, unit: "gr" },
          { name: "Tortas de arroz / maíz", quantity: 40, unit: "gr" },
          { name: "Quinoa / Cous cous", quantity: 50, unit: "gr" },
          { name: "Legumbre", quantity: 200, unit: "gr", notes: "pesar en cocido" },
          { name: "Patata", quantity: 170, unit: "gr" },
          { name: "Boniato", quantity: 150, unit: "gr" },
          { name: "Ñoquis", quantity: 140, unit: "gr" },
          { name: "Fajita de trigo / maíz", quantity: 1, unit: "unidad" },
          { name: "Pan integral o centeno", quantity: 60, unit: "gr" },
          { name: "1 fruta + mitad carbohidrato", quantity: 1, unit: "porcion" },
          { name: "Frijoles cocidos", quantity: 160, unit: "gr" },
        ],
      },
      {
        foodGroup: FoodGroup.protein,
        options: [
          { name: "Carne roja / Hamburguesa", quantity: 100, unit: "gr", notes: "*" },
          { name: "Pechuga de pollo / pavo", quantity: 100, unit: "gr" },
          { name: "Jamón serrano", quantity: 70, unit: "gr", notes: "*" },
          { name: "Lomo embuchado / Jamón pavo", quantity: 70, unit: "gr" },
          { name: "Tofu con legumbre", quantity: 30, unit: "gr" },
          { name: "Heura", quantity: 100, unit: "gr" },
          { name: "Huevo + claras", quantity: 1, unit: "unidad", notes: "+ 100ml claras" },
          { name: "Proteína en polvo", quantity: 20, unit: "gr" },
          { name: "Pescado azul", quantity: 100, unit: "gr", notes: "*" },
          { name: "Pescado blanco", quantity: 120, unit: "gr" },
          { name: "Queso fresco batido / Requesón", quantity: 250, unit: "gr" },
          { name: "Gambas", quantity: 100, unit: "gr" },
          { name: "Mejillones", quantity: 90, unit: "gr" },
          { name: "Sepia / Pulpo", quantity: 180, unit: "gr" },
          { name: "Soja texturizada", quantity: 50, unit: "gr" },
        ],
      },
      {
        foodGroup: FoodGroup.fat,
        options: [
          { name: "Aceite de oliva virgen extra", quantity: 10, unit: "ml" },
          { name: "Aguacate", quantity: 60, unit: "gr" },
          { name: "Guacamole", quantity: 80, unit: "gr" },
          { name: "Frutos secos", quantity: 15, unit: "gr" },
          { name: "Crema de almendra / cacahuete / avellana", quantity: 15, unit: "gr" },
          { name: "Bacon", quantity: 40, unit: "gr" },
        ],
      },
      {
        foodGroup: FoodGroup.other,
        options: [
          { name: "Vegetales (espinacas, brócoli, pimientos, pico de gallo, champiñones, remolacha, zanahoria)", quantity: 3, unit: "minimo" },
        ],
      },
    ],
  },
  // ── COMIDA 4: CENA ──
  {
    mealType: MealType.dinner,
    order: 4,
    name: "Cena",
    groups: [
      {
        foodGroup: FoodGroup.carbohydrates,
        options: [
          { name: "Arroz / Pasta / Crema de arroz", quantity: 40, unit: "gr" },
          { name: "Tortas de arroz / maíz", quantity: 40, unit: "gr" },
          { name: "Quinoa / Cous cous", quantity: 50, unit: "gr" },
          { name: "Legumbre", quantity: 200, unit: "gr", notes: "pesar en cocido" },
          { name: "Patata", quantity: 170, unit: "gr" },
          { name: "Boniato", quantity: 150, unit: "gr" },
          { name: "Ñoquis", quantity: 140, unit: "gr" },
          { name: "Fajita de trigo / maíz", quantity: 1, unit: "unidad" },
          { name: "Pan integral o centeno", quantity: 60, unit: "gr" },
          { name: "1 fruta + mitad carbohidrato", quantity: 1, unit: "porcion" },
        ],
      },
      {
        foodGroup: FoodGroup.protein,
        options: [
          { name: "Carne roja / Hamburguesa", quantity: 100, unit: "gr", notes: "*" },
          { name: "Pechuga de pollo / pavo", quantity: 100, unit: "gr" },
          { name: "Jamón serrano", quantity: 70, unit: "gr", notes: "*" },
          { name: "Lomo embuchado / Jamón pavo", quantity: 70, unit: "gr" },
          { name: "Tofu con legumbre", quantity: 30, unit: "gr" },
          { name: "Heura", quantity: 100, unit: "gr" },
          { name: "Huevo + claras", quantity: 1, unit: "unidad", notes: "+ 100ml claras" },
          { name: "Proteína en polvo", quantity: 20, unit: "gr" },
          { name: "Pescado azul", quantity: 100, unit: "gr", notes: "*" },
          { name: "Pescado blanco", quantity: 120, unit: "gr" },
          { name: "Queso fresco batido / Requesón", quantity: 250, unit: "gr" },
          { name: "Gambas", quantity: 100, unit: "gr" },
        ],
      },
      {
        foodGroup: FoodGroup.fat,
        options: [
          { name: "Aceite de oliva virgen extra", quantity: 10, unit: "ml" },
          { name: "Aguacate", quantity: 60, unit: "gr" },
          { name: "Guacamole", quantity: 80, unit: "gr" },
          { name: "Frutos secos", quantity: 15, unit: "gr" },
          { name: "Crema de almendra / cacahuete / avellana", quantity: 15, unit: "gr" },
          { name: "Chocolate 85%", quantity: 15, unit: "gr" },
          { name: "Bacon", quantity: 40, unit: "gr" },
          { name: "Semillas linwood / cáñamo", quantity: 20, unit: "gr" },
        ],
      },
      {
        foodGroup: FoodGroup.other,
        options: [
          { name: "Vegetales (espinacas, brócoli, pimientos, pico de gallo, champiñones, remolacha, zanahoria)", quantity: 3, unit: "minimo" },
          { name: "Especias al gusto", quantity: 0, unit: "al gusto", notes: "Pimienta negra favorece absorción de nutrientes" },
          { name: "Edulcorante o saborizante", quantity: 0, unit: "al gusto" },
          { name: "Sazonadores cero", quantity: 0, unit: "al gusto" },
        ],
      },
    ],
  },
];

// ─── Snack Recipes ─────────────────────────────────────────────────────────

const snackRecipes = [
  {
    name: "Fresas con Yogur Light",
    description: "Snack ligero y fresco con polifenoles",
    ingredients: [
      "5 fresas medianas",
      "1 cucharada de yogur natural desnatado sin azúcar",
      "Opcional: Unas gotitas de esencia de vainilla o canela",
    ],
    steps: [
      "Lavar las fresas y cortarlas en trozos.",
      "Colocarlas en un bol.",
      "Añadir la cucharada de yogur natural desnatado.",
      "Opcional: añadir esencia de vainilla o canela al gusto.",
    ],
    mealType: MealType.snack,
  },
  {
    name: "Bombón de Chocolate Negro y Almendra",
    description: "Snack con chocolate 85% y grasas saludables",
    ingredients: [
      "1 almendra",
      "1 cuadrito de chocolate negro 85% (5g aprox)",
    ],
    steps: [
      "Derrite el chocolate negro al baño maría o en microondas en intervalos cortos.",
      "Baña la almendra con el chocolate derretido.",
      "Enfría hasta que endurezca (puedes meterlo en la nevera 10 minutos).",
    ],
    mealType: MealType.snack,
  },
  {
    name: "Manzana Asada con Canela",
    description: "Snack caliente rico en polifenoles",
    ingredients: [
      "1/2 manzana",
      "Canela al gusto",
      "Unas gotas de jugo de limón",
    ],
    steps: [
      "Precalentar el horno a 180°C.",
      "Cortar la manzana en gajos.",
      "Rociar con unas gotas de limón.",
      "Espolvorear canela al gusto.",
      "Hornear durante 15-20 minutos hasta que esté tierna.",
    ],
    mealType: MealType.snack,
  },
  {
    name: "Gelatina Light",
    description: "Snack bajo en calorías con frutas",
    ingredients: [
      "Gelatina sin azúcar (marca light o casera con stevia)",
      "Frambuesas o moras",
    ],
    steps: [
      "Preparar la gelatina según las instrucciones del paquete.",
      "Añadir las frutas bajas en calorías (frambuesas o moras).",
      "Refrigerar hasta que cuaje.",
    ],
    mealType: MealType.snack,
  },
  {
    name: "Mini Helado de Plátano",
    description: "Helado casero sin azúcar añadido",
    ingredients: [
      "1/4 de plátano congelado",
      "1 cucharadita de cacao en polvo sin azúcar",
      "Un chorrito de bebida vegetal sin azúcar (almendra, coco…)",
    ],
    steps: [
      "Congelar el plátano previamente cortado en trozos.",
      "Licuar el plátano congelado con el cacao en polvo.",
      "Añadir un chorrito de bebida vegetal sin azúcar.",
      "Licuar hasta obtener una textura cremosa.",
      "Servir frío.",
    ],
    mealType: MealType.snack,
  },
];

// ─── Full Recipes ──────────────────────────────────────────────────────────

const fullRecipes = [
  {
    name: "Revuelto de arroz con quinoa y verduras",
    description: "Plato completo antiinflamatorio con cúrcuma y pimienta",
    ingredients: [
      "Arroz",
      "Quinoa",
      "Pimientos",
      "Champiñones",
      "Cebolla",
      "Ajo",
      "Huevos",
      "Aceite de oliva virgen extra",
      "Pimienta molida",
      "Comino",
      "Sésamo tostado",
      "Pimentón dulce de la Vera",
    ],
    steps: [
      "Cocer el arroz y la quinoa el tiempo especificado por el fabricante (usa solo una olla, primero echa el arroz, que requiere más tiempo de cocción, y luego la quinoa).",
      "Cortar los pimientos, champiñones, cebolla y ajo en pequeños dados.",
      "En una sartén: echar aceite de oliva virgen extra y saltear pimientos, champiñones, cebolla y ajo hasta la consistencia deseada. Utilizar una tapadera con salida de aire para que se hagan más rápidamente.",
      "Una vez acabado bajar el fuego y añadir los huevos para hacerlos revueltos junto con las verduras y también añadir las especias (pimienta molida, comino y/o sésamo tostado).",
      "Escurrir el arroz y la quinoa, que ya estarán listos, y mezclarlos en la sartén (con el fuego ya apagado) con los demás ingredientes para que absorban todo el sabor. Mezclar bien.",
      "Añadir el pimentón dulce de la Vera al final cuando se apague el fuego para que no pierda sabor.",
      "Servir y... ¡Que aproveche!",
    ],
    mealType: MealType.lunch,
  },
  {
    name: "Berenjena rellena de atún, champiñones y queso",
    description: "Plato reconfortante y nutritivo",
    ingredients: [
      "Berenjena",
      "Cebolla",
      "Champiñones",
      "Atún",
      "Queso",
      "Salsa de tomate",
      "Especias al gusto",
      "Perejil picado (opcional)",
    ],
    steps: [
      "Abrir la berenjena por la mitad a lo largo y ponerlas en el microondas unos 8 minutos.",
      "Mientras se cocinan las berenjenas, hacer un sofrito con la cebolla a daditos, añadiendo el champiñón. Dejar sofreír todo unos cinco minutos.",
      "Cuando las berenjenas estén listas (si quedan demasiado duras, introducir unos minutos más) y templadas, vaciarlas con una cuchara, con cuidado de no romper la piel.",
      "Añadir la carne de la berenjena a la sartén del sofrito, dar unas vueltas para que se integre y rectificar de sazón.",
      "Añadir salsa de tomate, el atún, las especias y mezclar todo.",
      "Volver a rellenar las berenjenas, cubrirlas con el queso y gratinar unos minutos, hasta que esté dorado y huela bien.",
      "Emplatar con un poco de perejil picado (si se quiere). Servir inmediatamente.",
    ],
    mealType: MealType.dinner,
  },
];

// ─── Seed Execution ────────────────────────────────────────────────────────

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

  // ── Seed Carla Bozal Template ──
  console.log("\nSeeding Carla Bozal meal plan template...");

  const existingTemplate = await prisma.mealPlanTemplate.findFirst({
    where: { name: "Carla Bozal - 3+ snacks" },
  });

  if (existingTemplate) {
    console.log("Template already exists, skipping.");
    return;
  }

  const template = await prisma.mealPlanTemplate.create({
    data: {
      name: "Carla Bozal - 3+ snacks",
      description: "Plan de alimentación antiinflamatorio con 4 comidas + snacks",
      objective: "reducir la inflamación",
      guidelines: templateGuidelines,
    },
  });

  console.log(`Created template: ${template.name}`);

  // ── Seed Meal Templates ──
  for (const mealDef of mealDefs) {
    const mealTemplate = await prisma.mealTemplate.create({
      data: {
        templateId: template.id,
        mealType: mealDef.mealType,
        order: mealDef.order,
        name: mealDef.name,
      },
    });

    console.log(`  Created meal: ${mealTemplate.name} (${mealTemplate.mealType})`);

    for (const groupDef of mealDef.groups) {
      const group = await prisma.mealTemplateGroup.create({
        data: {
          mealTemplateId: mealTemplate.id,
          foodGroup: groupDef.foodGroup,
        },
      });

      for (const opt of groupDef.options) {
        await prisma.foodOption.create({
          data: {
            mealTemplateGroupId: group.id,
            name: opt.name,
            quantity: opt.quantity,
            unit: opt.unit,
            notes: opt.notes ?? null,
          },
        });
      }

      console.log(`    Group: ${group.foodGroup} (${groupDef.options.length} options)`);
    }
  }

  // ── Seed Snack Recipes ──
  console.log("\nSeeding snack recipes...");

  for (const recipe of snackRecipes) {
    await prisma.recipe.create({
      data: {
        templateId: template.id,
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        mealType: recipe.mealType,
      },
    });
    console.log(`  Recipe: ${recipe.name}`);
  }

  // ── Seed Full Recipes ──
  console.log("\nSeeding full recipes...");

  for (const recipe of fullRecipes) {
    await prisma.recipe.create({
      data: {
        templateId: template.id,
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        mealType: recipe.mealType,
      },
    });
    console.log(`  Recipe: ${recipe.name}`);
  }

  // ── Summary ──
  const stats = await Promise.all([
    prisma.food.count(),
    prisma.mealPlanTemplate.count(),
    prisma.mealTemplate.count(),
    prisma.mealTemplateGroup.count(),
    prisma.foodOption.count(),
    prisma.recipe.count(),
  ]);

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║          SEED COMPLETE                  ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Foods:          ${String(stats[0]).padStart(8)}              ║`);
  console.log(`║  Templates:      ${String(stats[1]).padStart(8)}              ║`);
  console.log(`║  Meal Templates: ${String(stats[2]).padStart(8)}              ║`);
  console.log(`║  Meal Groups:    ${String(stats[3]).padStart(8)}              ║`);
  console.log(`║  Food Options:   ${String(stats[4]).padStart(8)}              ║`);
  console.log(`║  Recipes:        ${String(stats[5]).padStart(8)}              ║`);
  console.log("╚══════════════════════════════════════════╝");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
