import { prisma } from "@/lib/prisma";
import type { Ingredient } from "@/types/meal-plan";
import type { Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

type SeedMealData = {
  dayOfWeek: number;
  mealType: "breakfast" | "mid_morning" | "lunch" | "dinner";
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  instructions: string;
};

// ─── Seed Meal Data ───────────────────────────────────────────────────────

const SEED_MEALS: SeedMealData[] = [
  // ── Monday (0) ─────────────────────────────────────────────────────────
  {
    dayOfWeek: 0,
    mealType: "breakfast",
    name: "Tostada integral con tomate y aceite de oliva",
    description: "Pan integral tostado con tomate rallado, aceite de oliva virgen extra y una pizca de sal.",
    calories: 320,
    protein: 8,
    carbs: 45,
    fat: 12,
    ingredients: [
      { name: "pan integral", quantity: 60, unit: "g" },
      { name: "tomate", quantity: 100, unit: "g" },
      { name: "aceite de oliva virgen extra", quantity: 10, unit: "ml" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Tostar el pan. Rallar el tomate y extenderlo sobre la tostada. Añadir un chorrito de aceite de oliva y una pizca de sal.",
  },
  {
    dayOfWeek: 0,
    mealType: "mid_morning",
    name: "Fruta fresca con frutos secos",
    description: "Manzana cortada en gajos acompañada de un puñado de almendras naturales.",
    calories: 210,
    protein: 6,
    carbs: 30,
    fat: 9,
    ingredients: [
      { name: "manzana", quantity: 150, unit: "g" },
      { name: "almendras naturales", quantity: 20, unit: "g" },
    ],
    instructions: "Lavar la manzana, cortarla en gajos y acompañar con las almendras.",
  },
  {
    dayOfWeek: 0,
    mealType: "lunch",
    name: "Lentejas estofadas con verduras",
    description: "Lentejas cocinadas a fuego lento con zanahoria, puerro, patata y pimentón.",
    calories: 430,
    protein: 22,
    carbs: 55,
    fat: 10,
    ingredients: [
      { name: "lentejas", quantity: 80, unit: "g" },
      { name: "zanahoria", quantity: 80, unit: "g" },
      { name: "puerro", quantity: 50, unit: "g" },
      { name: "patata", quantity: 100, unit: "g" },
      { name: "pimentón dulce", quantity: 5, unit: "g" },
      { name: "aceite de oliva", quantity: 15, unit: "ml" },
      { name: "laurel", quantity: 1, unit: "unidades" },
      { name: "ajo", quantity: 2, unit: "unidades" },
    ],
    instructions: "Sofreír el ajo, puerro y zanahoria picados en aceite. Añadir el pimentón, las lentejas, la patata troceada y el laurel. Cubrir con agua y cocer a fuego medio 35-40 minutos.",
  },
  {
    dayOfWeek: 0,
    mealType: "dinner",
    name: "Tortilla de patatas con ensalada verde",
    description: "Tortilla española jugosa acompañada de una ensalada de lechuga y tomate.",
    calories: 480,
    protein: 22,
    carbs: 38,
    fat: 26,
    ingredients: [
      { name: "huevos", quantity: 3, unit: "unidades" },
      { name: "patata", quantity: 200, unit: "g" },
      { name: "cebolla", quantity: 80, unit: "g" },
      { name: "aceite de oliva", quantity: 30, unit: "ml" },
      { name: "lechuga", quantity: 80, unit: "g" },
      { name: "tomate cherry", quantity: 60, unit: "g" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Pelar y cortar las patatas y la cebolla en láminas finas. Freír en abundante aceite a fuego medio hasta que estén tiernas. Escurrir y mezclar con los huevos batidos. Cuajar la tortilla en una sartén con un poco de aceite, dándole la vuelta a media cocción.",
  },

  // ── Tuesday (1) ────────────────────────────────────────────────────────
  {
    dayOfWeek: 1,
    mealType: "breakfast",
    name: "Yogur natural con granola y frutos rojos",
    description: "Yogur natural sin azúcar con granola casera y arándanos frescos.",
    calories: 280,
    protein: 12,
    carbs: 38,
    fat: 8,
    ingredients: [
      { name: "yogur natural", quantity: 200, unit: "g" },
      { name: "granola", quantity: 30, unit: "g" },
      { name: "arándanos", quantity: 50, unit: "g" },
    ],
    instructions: "Verter el yogur en un bol, añadir la granola por encima y coronar con los arándanos.",
  },
  {
    dayOfWeek: 1,
    mealType: "mid_morning",
    name: "Batido de plátano y avena",
    description: "Batido cremoso con plátano maduro, copos de avena y leche semidesnatada.",
    calories: 250,
    protein: 8,
    carbs: 42,
    fat: 5,
    ingredients: [
      { name: "plátano", quantity: 100, unit: "g" },
      { name: "copos de avena", quantity: 20, unit: "g" },
      { name: "leche semidesnatada", quantity: 200, unit: "ml" },
      { name: "canela en polvo", quantity: 2, unit: "g" },
    ],
    instructions: "Triturar todos los ingredientes en la batidora hasta obtener una textura suave y homogénea.",
  },
  {
    dayOfWeek: 1,
    mealType: "lunch",
    name: "Paella de verduras",
    description: "Arroz meloso con verduras de temporada, azafrán y pimentón.",
    calories: 520,
    protein: 14,
    carbs: 72,
    fat: 16,
    ingredients: [
      { name: "arroz bomba", quantity: 80, unit: "g" },
      { name: "judías verdes", quantity: 80, unit: "g" },
      { name: "alcachofa", quantity: 100, unit: "g" },
      { name: "pimiento rojo", quantity: 60, unit: "g" },
      { name: "tomate triturado", quantity: 100, unit: "g" },
      { name: "aceite de oliva", quantity: 20, unit: "ml" },
      { name: "azafrán", quantity: 0.1, unit: "g" },
      { name: "pimentón dulce", quantity: 5, unit: "g" },
      { name: "ajo", quantity: 3, unit: "unidades" },
      { name: "caldo de verduras", quantity: 400, unit: "ml" },
    ],
    instructions: "Sofreír el ajo y el pimiento troceados en aceite. Añadir las judías y alcachofas troceadas. Incorporar el tomate triturado y sofreír 5 minutos. Añadir el arroz, el pimentón y el azafrán. Verter el caldo caliente y cocer 18-20 minutos sin remover. Dejar reposar 5 minutos tapado.",
  },
  {
    dayOfWeek: 1,
    mealType: "dinner",
    name: "Merluza al horno con patatas panadera",
    description: "Lomos de merluza fresca al horno sobre cama de patatas y cebolla.",
    calories: 420,
    protein: 32,
    carbs: 35,
    fat: 14,
    ingredients: [
      { name: "merluza", quantity: 180, unit: "g" },
      { name: "patata", quantity: 150, unit: "g" },
      { name: "cebolla", quantity: 80, unit: "g" },
      { name: "aceite de oliva", quantity: 15, unit: "ml" },
      { name: "limón", quantity: 0.5, unit: "unidades" },
      { name: "perejil fresco", quantity: 5, unit: "g" },
      { name: "sal", quantity: undefined, unit: undefined },
      { name: "pimienta negra", quantity: undefined, unit: undefined },
    ],
    instructions: "Cortar las patatas y cebolla en rodajas finas, colocar en bandeja de horno con aceite y sal. Hornear 20 minutos a 200°C. Colocar los lomos de merluza encima, añadir zumo de limón, perejil, sal y pimienta. Hornear 12-15 minutos más hasta que el pescado esté hecho.",
  },

  // ── Wednesday (2) ──────────────────────────────────────────────────────
  {
    dayOfWeek: 2,
    mealType: "breakfast",
    name: "Porridge de avena con manzana y canela",
    description: "Copos de avena cocidos en leche con manzana rallada, canela y nueces.",
    calories: 340,
    protein: 10,
    carbs: 50,
    fat: 10,
    ingredients: [
      { name: "copos de avena", quantity: 50, unit: "g" },
      { name: "leche semidesnatada", quantity: 200, unit: "ml" },
      { name: "manzana", quantity: 80, unit: "g" },
      { name: "nueces", quantity: 15, unit: "g" },
      { name: "canela en polvo", quantity: 2, unit: "g" },
      { name: "miel", quantity: 10, unit: "g" },
    ],
    instructions: "Cocer los copos de avena en la leche a fuego lento removiendo hasta que espese. Añadir la manzana rallada, canela y miel. Servir con las nueces troceadas por encima.",
  },
  {
    dayOfWeek: 2,
    mealType: "mid_morning",
    name: "Tostada integral con aguacate y semillas",
    description: "Pan integral tostado con medio aguacate machacado, semillas de sésamo y un toque de limón.",
    calories: 260,
    protein: 7,
    carbs: 30,
    fat: 13,
    ingredients: [
      { name: "pan integral", quantity: 40, unit: "g" },
      { name: "aguacate", quantity: 70, unit: "g" },
      { name: "semillas de sésamo", quantity: 5, unit: "g" },
      { name: "zumo de limón", quantity: 5, unit: "ml" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Tostar el pan. Machacar el aguacate con un tenedor, añadir zumo de limón y sal. Extender sobre la tostada y espolvorear con semillas de sésamo.",
  },
  {
    dayOfWeek: 2,
    mealType: "lunch",
    name: "Pollo al horno con arroz integral y verduras",
    description: "Contramuslos de pollo al horno con hierbas provenzales, acompañados de arroz integral y pimientos asados.",
    calories: 560,
    protein: 40,
    carbs: 55,
    fat: 16,
    ingredients: [
      { name: "contramuslo de pollo deshuesado", quantity: 180, unit: "g" },
      { name: "arroz integral", quantity: 70, unit: "g" },
      { name: "pimiento rojo", quantity: 100, unit: "g" },
      { name: "pimiento verde", quantity: 80, unit: "g" },
      { name: "aceite de oliva", quantity: 15, unit: "ml" },
      { name: "hierbas provenzales", quantity: 3, unit: "g" },
      { name: "ajo en polvo", quantity: 2, unit: "g" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Adobar el pollo con aceite, hierbas provenzales, ajo en polvo y sal. Hornear a 200ºC durante 25-30 minutos. Cocer el arroz integral en agua con sal 35-40 minutos. Asar los pimientos en el horno junto al pollo los últimos 15 minutos.",
  },
  {
    dayOfWeek: 2,
    mealType: "dinner",
    name: "Gazpacho andaluz con tortilla francesa",
    description: "Gazpacho frío tradicional con tomate, pepino y pimiento, acompañado de una tortilla francesa de dos huevos.",
    calories: 380,
    protein: 18,
    carbs: 25,
    fat: 22,
    ingredients: [
      { name: "tomate maduro", quantity: 200, unit: "g" },
      { name: "pepino", quantity: 80, unit: "g" },
      { name: "pimiento verde", quantity: 50, unit: "g" },
      { name: "ajo", quantity: 1, unit: "unidades" },
      { name: "aceite de oliva virgen extra", quantity: 15, unit: "ml" },
      { name: "vinagre de vino", quantity: 10, unit: "ml" },
      { name: "huevos", quantity: 2, unit: "unidades" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Triturar el tomate, pepino, pimiento, ajo, aceite, vinagre y sal hasta obtener una crema fina. Refrigerar al menos 30 minutos. Batir los huevos y cuajar la tortilla francesa en una sartén con unas gotas de aceite. Servir el gazpacho frío con la tortilla aparte.",
  },

  // ── Thursday (3) ───────────────────────────────────────────────────────
  {
    dayOfWeek: 3,
    mealType: "breakfast",
    name: "Tostada con jamón serrano y tomate",
    description: "Pan de pueblo tostado con tomate natural restregado, jamón serrano y aceite de oliva.",
    calories: 310,
    protein: 16,
    carbs: 35,
    fat: 12,
    ingredients: [
      { name: "pan de pueblo", quantity: 60, unit: "g" },
      { name: "jamón serrano", quantity: 40, unit: "g" },
      { name: "tomate", quantity: 80, unit: "g" },
      { name: "aceite de oliva virgen extra", quantity: 5, unit: "ml" },
    ],
    instructions: "Tostar el pan. Restregar medio tomate sobre la tostada. Colocar las lonchas de jamón serrano y añadir un hilo de aceite de oliva.",
  },
  {
    dayOfWeek: 3,
    mealType: "mid_morning",
    name: "Manzana asada con canela y yogur",
    description: "Manzana asada al microondas con canela, acompañada de yogur natural.",
    calories: 190,
    protein: 5,
    carbs: 32,
    fat: 4,
    ingredients: [
      { name: "manzana", quantity: 150, unit: "g" },
      { name: "yogur natural", quantity: 125, unit: "g" },
      { name: "canela en polvo", quantity: 2, unit: "g" },
    ],
    instructions: "Cortar la manzana en trozos, espolvorear con canela y cocer en microondas 3-4 minutos hasta que esté tierna. Acompañar con el yogur.",
  },
  {
    dayOfWeek: 3,
    mealType: "lunch",
    name: "Macarrones integrales con verduras y atún",
    description: "Pasta integral con calabacín, berenjena, tomate cherry y atún al natural.",
    calories: 530,
    protein: 28,
    carbs: 65,
    fat: 14,
    ingredients: [
      { name: "macarrones integrales", quantity: 80, unit: "g" },
      { name: "atún al natural", quantity: 80, unit: "g" },
      { name: "calabacín", quantity: 100, unit: "g" },
      { name: "berenjena", quantity: 80, unit: "g" },
      { name: "tomate cherry", quantity: 80, unit: "g" },
      { name: "aceite de oliva", quantity: 15, unit: "ml" },
      { name: "ajo", quantity: 2, unit: "unidades" },
      { name: "albahaca fresca", quantity: 5, unit: "g" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Cocer la pasta en agua con sal según instrucciones del paquete. Saltear el ajo, calabacín y berenjena troceados en aceite. Añadir los tomates cherry partidos y cocinar 5 minutos. Incorporar el atún escurrido y la pasta cocida. Mezclar bien y servir con albahaca fresca.",
  },
  {
    dayOfWeek: 3,
    mealType: "dinner",
    name: "Salmón a la plancha con ensalada de aguacate",
    description: "Lomo de salmón fresco a la plancha con ensalada de aguacate, tomate y cebolla morada.",
    calories: 460,
    protein: 34,
    carbs: 12,
    fat: 30,
    ingredients: [
      { name: "salmón fresco", quantity: 150, unit: "g" },
      { name: "aguacate", quantity: 80, unit: "g" },
      { name: "tomate", quantity: 100, unit: "g" },
      { name: "cebolla morada", quantity: 30, unit: "g" },
      { name: "aceite de oliva", quantity: 10, unit: "ml" },
      { name: "limón", quantity: 0.5, unit: "unidades" },
      { name: "sal", quantity: undefined, unit: undefined },
      { name: "pimienta negra", quantity: undefined, unit: undefined },
    ],
    instructions: "Salpimentar el salmón y cocinar a la plancha con un poco de aceite 3-4 minutos por cada lado. Cortar el aguacate, tomate y cebolla morada en dados. Aliñar con aceite, zumo de limón y sal. Servir el salmón con la ensalada.",
  },

  // ── Friday (4) ────────────────────────────────────────────────────────
  {
    dayOfWeek: 4,
    mealType: "breakfast",
    name: "Huevos revueltos con champiñones y pan",
    description: "Dos huevos revueltos cremosos con champiñones salteados y pan tostado.",
    calories: 350,
    protein: 20,
    carbs: 30,
    fat: 16,
    ingredients: [
      { name: "huevos", quantity: 2, unit: "unidades" },
      { name: "champiñones", quantity: 80, unit: "g" },
      { name: "pan integral", quantity: 40, unit: "g" },
      { name: "aceite de oliva", quantity: 10, unit: "ml" },
      { name: "sal", quantity: undefined, unit: undefined },
      { name: "cebollino fresco", quantity: 3, unit: "g" },
    ],
    instructions: "Saltear los champiñones laminados en aceite hasta que suelten el agua. Batir los huevos y verter sobre los champiñones, removiendo a fuego bajo hasta que estén cremosos. Servir sobre la tostada y espolvorear con cebollino.",
  },
  {
    dayOfWeek: 4,
    mealType: "mid_morning",
    name: "Puñado de frutos secos y pasas",
    description: "Mezcla de almendras, nueces y pasas para un tentempié energético.",
    calories: 200,
    protein: 6,
    carbs: 20,
    fat: 12,
    ingredients: [
      { name: "almendras", quantity: 15, unit: "g" },
      { name: "nueces", quantity: 10, unit: "g" },
      { name: "pasas", quantity: 15, unit: "g" },
    ],
    instructions: "Mezclar todos los frutos secos en un bol pequeño. Ideal para llevar en un recipiente hermético.",
  },
  {
    dayOfWeek: 4,
    mealType: "lunch",
    name: "Garbanzos guisados con espinacas y bacalao",
    description: "Garbanzos cocidos en salsa suave de pimentón con espinacas frescas y bacalao desalado.",
    calories: 490,
    protein: 30,
    carbs: 50,
    fat: 16,
    ingredients: [
      { name: "garbanzos cocidos", quantity: 200, unit: "g" },
      { name: "espinacas frescas", quantity: 100, unit: "g" },
      { name: "bacalao desalado", quantity: 80, unit: "g" },
      { name: "cebolla", quantity: 60, unit: "g" },
      { name: "ajo", quantity: 2, unit: "unidades" },
      { name: "pimentón dulce", quantity: 5, unit: "g" },
      { name: "aceite de oliva", quantity: 15, unit: "ml" },
      { name: "laurel", quantity: 1, unit: "unidades" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Sofreír la cebolla y el ajo picados en aceite. Añadir el pimentón y remover rápido. Incorporar los garbanzos con su líquido y el laurel. Cocer 10 minutos. Añadir las espinacas y el bacalao troceado. Cocinar 5 minutos más hasta que las espinacas se ablanden y el bacalao esté hecho.",
  },
  {
    dayOfWeek: 4,
    mealType: "dinner",
    name: "Pizza casera de verduras",
    description: "Masa de pizza casera fina con tomate, mozzarella, champiñones y pimiento.",
    calories: 480,
    protein: 20,
    carbs: 55,
    fat: 20,
    ingredients: [
      { name: "harina integral", quantity: 100, unit: "g" },
      { name: "tomate triturado", quantity: 80, unit: "g" },
      { name: "mozzarella fresca", quantity: 60, unit: "g" },
      { name: "champiñones", quantity: 60, unit: "g" },
      { name: "pimiento verde", quantity: 40, unit: "g" },
      { name: "aceite de oliva", quantity: 10, unit: "ml" },
      { name: "levadura de panadería", quantity: 3, unit: "g" },
      { name: "orégano", quantity: 2, unit: "g" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Mezclar la harina con levadura, sal, aceite y agua tibia. Amasar 5-10 minutos y dejar reposar 30 minutos. Estirar la masa fina. Cubrir con tomate triturado, mozzarella troceada, champiñones laminados y pimiento en tiras. Espolvorear con orégano. Hornear a 220ºC durante 12-15 minutos.",
  },

  // ── Saturday (5) ───────────────────────────────────────────────────────
  {
    dayOfWeek: 5,
    mealType: "breakfast",
    name: "Tortitas de avena y plátano",
    description: "Tortitas sin azúcar añadido hechas con plátano, avena y huevo. Servidas con yogur y fruta.",
    calories: 370,
    protein: 14,
    carbs: 52,
    fat: 10,
    ingredients: [
      { name: "plátano maduro", quantity: 100, unit: "g" },
      { name: "copos de avena", quantity: 40, unit: "g" },
      { name: "huevos", quantity: 1, unit: "unidades" },
      { name: "yogur natural", quantity: 80, unit: "g" },
      { name: "fresas", quantity: 50, unit: "g" },
      { name: "aceite de coco", quantity: 5, unit: "ml" },
    ],
    instructions: "Triturar el plátano, avena y huevo en la batidora. Calentar una sartén antiadherente con aceite de coco. Verter pequeñas porciones y cocinar 2 minutos por cada lado. Servir las tortitas con yogur y fresas troceadas.",
  },
  {
    dayOfWeek: 5,
    mealType: "mid_morning",
    name: "Palitos de zanahoria y pepino con hummus",
    description: "Crudités de zanahoria y pepino acompañados de hummus casero de garbanzos.",
    calories: 180,
    protein: 8,
    carbs: 22,
    fat: 7,
    ingredients: [
      { name: "zanahoria", quantity: 80, unit: "g" },
      { name: "pepino", quantity: 80, unit: "g" },
      { name: "garbanzos cocidos", quantity: 60, unit: "g" },
      { name: "tahini", quantity: 10, unit: "g" },
      { name: "zumo de limón", quantity: 5, unit: "ml" },
      { name: "aceite de oliva", quantity: 5, unit: "ml" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Triturar los garbanzos con tahini, zumo de limón, aceite y sal hasta obtener una crema suave. Cortar la zanahoria y el pepino en palitos. Servir con el hummus.",
  },
  {
    dayOfWeek: 5,
    mealType: "lunch",
    name: "Arroz tres delicias con pollo",
    description: "Arroz salteado al wok con pollo, huevo, guisantes y zanahoria al estilo español.",
    calories: 540,
    protein: 32,
    carbs: 62,
    fat: 14,
    ingredients: [
      { name: "arroz basmati", quantity: 70, unit: "g" },
      { name: "pechuga de pollo", quantity: 120, unit: "g" },
      { name: "huevos", quantity: 1, unit: "unidades" },
      { name: "guisantes", quantity: 60, unit: "g" },
      { name: "zanahoria", quantity: 60, unit: "g" },
      { name: "aceite de oliva", quantity: 15, unit: "ml" },
      { name: "salsa de soja", quantity: 10, unit: "ml" },
      { name: "ajo", quantity: 2, unit: "unidades" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Cocer el arroz y reservar. Saltear el pollo troceado en aceite hasta que esté dorado, reservar. Hacer un huevo revuelto en el wok. Añadir el ajo, zanahoria en daditos y guisantes, saltear 3 minutos. Incorporar el arroz, el pollo y la salsa de soja. Saltear 2 minutos más.",
  },
  {
    dayOfWeek: 5,
    mealType: "dinner",
    name: "Crema de calabacín con queso fresco",
    description: "Crema suave de calabacín y puerro con queso fresco desmenuzado y picatostes.",
    calories: 320,
    protein: 14,
    carbs: 30,
    fat: 16,
    ingredients: [
      { name: "calabacín", quantity: 200, unit: "g" },
      { name: "puerro", quantity: 80, unit: "g" },
      { name: "patata", quantity: 60, unit: "g" },
      { name: "queso fresco de burgos", quantity: 50, unit: "g" },
      { name: "pan integral", quantity: 30, unit: "g" },
      { name: "aceite de oliva", quantity: 10, unit: "ml" },
      { name: "sal", quantity: undefined, unit: undefined },
      { name: "pimienta negra", quantity: undefined, unit: undefined },
    ],
    instructions: "Sofreír el puerro picado en aceite. Añadir el calabacín y la patata troceados, cubrir con agua y cocer 20 minutos. Triturar hasta obtener una crema fina. Salpimentar. Tostar el pan cortado en dados para hacer picatostes. Servir la crema con queso fresco desmenuzado y picatostes.",
  },

  // ── Sunday (6) ─────────────────────────────────────────────────────────
  {
    dayOfWeek: 6,
    mealType: "breakfast",
    name: "Tostada francesa con fruta fresca",
    description: "Pan empapado en huevo y leche, dorado a la plancha y servido con fruta fresca de temporada.",
    calories: 380,
    protein: 14,
    carbs: 52,
    fat: 12,
    ingredients: [
      { name: "pan integral", quantity: 80, unit: "g" },
      { name: "huevos", quantity: 1, unit: "unidades" },
      { name: "leche semidesnatada", quantity: 50, unit: "ml" },
      { name: "canela en polvo", quantity: 2, unit: "g" },
      { name: "fresas", quantity: 60, unit: "g" },
      { name: "plátano", quantity: 50, unit: "g" },
      { name: "miel", quantity: 10, unit: "g" },
    ],
    instructions: "Batir el huevo con la leche y la canela. Empapar el pan en la mezcla. Dorar en sartén antiadherente por ambos lados. Servir con las fresas y plátano laminados y un hilo de miel.",
  },
  {
    dayOfWeek: 6,
    mealType: "mid_morning",
    name: "Zumo de naranja natural con biscotes",
    description: "Zumo de naranja recién exprimido con dos biscotes integrales.",
    calories: 210,
    protein: 5,
    carbs: 40,
    fat: 3,
    ingredients: [
      { name: "naranja", quantity: 250, unit: "g" },
      { name: "biscotes integrales", quantity: 30, unit: "g" },
    ],
    instructions: "Exprimir las naranjas y servir el zumo recién hecho con los biscotes.",
  },
  {
    dayOfWeek: 6,
    mealType: "lunch",
    name: "Cocido madrileño (versión ligera)",
    description: "Garbanzos con verduras, pollo y un toque de jamón, servido en dos vuelcos: sopa y garbanzos.",
    calories: 580,
    protein: 38,
    carbs: 60,
    fat: 18,
    ingredients: [
      { name: "garbanzos cocidos", quantity: 200, unit: "g" },
      { name: "muslo de pollo", quantity: 120, unit: "g" },
      { name: "jamón serrano", quantity: 30, unit: "g" },
      { name: "zanahoria", quantity: 80, unit: "g" },
      { name: "patata", quantity: 100, unit: "g" },
      { name: "repollo", quantity: 80, unit: "g" },
      { name: "fideos finos", quantity: 30, unit: "g" },
      { name: "cebolla", quantity: 50, unit: "g" },
      { name: "aceite de oliva", quantity: 10, unit: "ml" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Cocer el pollo, jamón, cebolla y zanahoria en agua con sal durante 40 minutos. Retirar el pollo y jamón, desmenuzar. Colar el caldo, cocer los fideos en él 5 minutos y servir como sopa. En otra olla, saltear el repollo y añadir los garbanzos, patata cocida troceada, pollo y jamón desmenuzados. Servir como segundo vuelco.",
  },
  {
    dayOfWeek: 6,
    mealType: "dinner",
    name: "Ensalada templada de queso de cabra con frutos secos",
    description: "Mezcla de lechugas con queso de cabra gratinado, nueces caramelizadas y vinagreta de miel.",
    calories: 380,
    protein: 18,
    carbs: 20,
    fat: 26,
    ingredients: [
      { name: "queso de cabra en rulo", quantity: 60, unit: "g" },
      { name: "mezcla de lechugas", quantity: 100, unit: "g" },
      { name: "nueces", quantity: 20, unit: "g" },
      { name: "tomate cherry", quantity: 60, unit: "g" },
      { name: "aceite de oliva", quantity: 15, unit: "ml" },
      { name: "vinagre de manzana", quantity: 10, unit: "ml" },
      { name: "miel", quantity: 5, unit: "g" },
      { name: "sal", quantity: undefined, unit: undefined },
    ],
    instructions: "Colocar el queso de cabra en rodajas sobre las lechugas y gratinar 3-4 minutos en el horno hasta que se dore. Preparar la vinagreta mezclando aceite, vinagre, miel y sal. Añadir las nueces y los tomates cherry partidos. Aliñar y servir templada.",
  },
];

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Seeds an example weekly meal plan for the given user.
 *
 * - Deletes any existing meal plans for the user first.
 * - Creates 28 meals (7 days × 4 meal types) with realistic Spanish
 *   ingredients and cooking instructions.
 * - Sets the plan status to "active".
 * - Does not require a user profile.
 *
 * @param userId - The user to seed the plan for.
 * @returns The created meal plan ID and meal count.
 */
export async function seedExampleMealPlan(
  userId: string,
): Promise<{ mealPlanId: string; mealCount: number }> {
  // Calculate week boundaries (current week, Monday to Sunday)
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ...
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + mondayOffset);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  // Delete existing plans for the user (avoids unique constraint on userId+startDate)
  await prisma.mealPlan.deleteMany({ where: { userId } });

  // Create the meal plan with all meals in a transaction
  const mealPlan = await prisma.$transaction(async (tx) => {
    const plan = await tx.mealPlan.create({
      data: {
        userId,
        startDate,
        endDate,
        status: "active",
        totalCalories: SEED_MEALS.reduce((sum, m) => sum + m.calories, 0),
        meals: {
          createMany: {
            data: SEED_MEALS.map((m) => ({
              dayOfWeek: m.dayOfWeek,
              mealType: m.mealType,
              name: m.name,
              description: m.description,
              calories: m.calories,
              protein: m.protein,
              carbs: m.carbs,
              fat: m.fat,
              ingredients: m.ingredients as unknown as Prisma.InputJsonValue,
              instructions: m.instructions,
            })),
          },
        },
      },
    });

    return plan;
  });

  return {
    mealPlanId: mealPlan.id,
    mealCount: SEED_MEALS.length,
  };
}
