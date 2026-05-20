/* eslint-disable */
// data.jsx — Fake but realistic data for our Argentinian persona

// Persona: Sofía, 28F, Buenos Aires. Goal: lose weight. Target 1650 kcal.
const PERSONA = {
  name: 'Sofía',
  initials: 'SC',
  age: 28,
  sex: 'female',
  weight: 64.2,
  startWeight: 68.1,
  targetWeight: 60,
  height: 165,
  goal: 'lose',
  activity: 'moderate',
  diet: 'omnivore',
  city: 'Buenos Aires',
};

const TARGETS = {
  cal: 1650,
  pro: 124,   // ~30% / 4
  carb: 165,  // ~40% / 4
  fat: 55,    // ~30% / 9
};

// Today's totals
const TODAY = {
  cal: 1187,
  pro: 92,
  carb: 118,
  fat: 41,
  meals: [
    {
      type: 'breakfast',
      time: '8:12',
      summary: 'Yogur con granola y banana',
      calories: 312, protein: 18, carbs: 42, fat: 8,
      foods: [
        { name: 'Yogur natural descremado', quantity: 200, unit: 'g', cal: 120, confidence: 0.95 },
        { name: 'Granola casera', quantity: 30, unit: 'g', cal: 132, confidence: 0.82 },
        { name: 'Banana', quantity: 1, unit: ' u', cal: 60, confidence: 0.98 },
      ],
    },
    {
      type: 'mid_morning',
      time: '11:05',
      summary: 'Mate con galletitas',
      calories: 142, protein: 4, carbs: 24, fat: 4,
      foods: [
        { name: 'Mate (yerba)', quantity: 1, unit: ' inf.', cal: 5, confidence: 0.7 },
        { name: 'Galletitas de avena', quantity: 3, unit: ' u', cal: 137, confidence: 0.78 },
      ],
    },
    {
      type: 'lunch',
      time: '13:40',
      summary: 'Milanesa al horno con ensalada',
      calories: 538, protein: 48, carbs: 32, fat: 22,
      foods: [
        { name: 'Milanesa de pollo al horno', quantity: 150, unit: 'g', cal: 340, confidence: 0.88 },
        { name: 'Ensalada mixta (lechuga, tomate, zanahoria)', quantity: 200, unit: 'g', cal: 78, confidence: 0.92 },
        { name: 'Aceite de oliva', quantity: 1, unit: ' cda', cal: 120, confidence: 0.96 },
      ],
    },
    {
      type: 'snack',
      time: '17:30',
      summary: 'Manzana y puñado de almendras',
      calories: 195, protein: 6, carbs: 20, fat: 7,
      foods: [
        { name: 'Manzana', quantity: 1, unit: ' u', cal: 95, confidence: 0.97 },
        { name: 'Almendras', quantity: 15, unit: 'g', cal: 100, confidence: 0.9 },
      ],
    },
  ],
};

// Week data (Mon=L .. Sun=D)
const WEEK = [
  { label: 'L', num: 18, cal: 1610, pro: 118, carb: 162, fat: 53, met: true },
  { label: 'M', num: 19, cal: 1722, pro: 130, carb: 175, fat: 58, met: true },
  { label: 'M', num: 20, cal: 1487, pro: 102, carb: 148, fat: 49, met: false, partial: true },
  { label: 'J', num: 21, cal: 1650, pro: 124, carb: 165, fat: 55, met: true },
  { label: 'V', num: 22, cal: 2010, pro: 95, carb: 220, fat: 78, met: false },
  { label: 'S', num: 23, cal: 1812, pro: 142, carb: 180, fat: 60, met: true },
  { label: 'D', num: 24, cal: 1187, pro: 92, carb: 118, fat: 41, met: false, partial: true, today: true },
];

// 30 days of weight data (gentle downward trend)
const WEIGHT_DATA = (() => {
  const out = [];
  const start = 66.3;
  for (let i = 0; i < 30; i++) {
    const noise = (Math.sin(i * 0.7) * 0.25) + (Math.cos(i * 1.3) * 0.15);
    const trend = -i * 0.07;
    const v = +(start + trend + noise).toFixed(1);
    const dayNum = 25 + i;
    const month = dayNum > 30 ? 'may' : 'abr';
    const realNum = dayNum > 30 ? dayNum - 30 : dayNum;
    out.push({
      label: i % 5 === 0 ? `${realNum} ${month}` : '',
      v,
    });
  }
  return out;
})();

// 30 days of macro stack data
const MACRO_TREND = (() => {
  const out = [];
  const labels = ['L','M','M','J','V','S','D'];
  for (let i = 0; i < 14; i++) {
    out.push({
      label: labels[i % 7],
      pro: Math.round(100 + Math.sin(i * 0.9) * 25 + Math.random() * 15),
      carb: Math.round(155 + Math.cos(i * 0.7) * 30 + Math.random() * 20),
      fat: Math.round(50 + Math.sin(i * 1.2) * 12 + Math.random() * 8),
    });
  }
  return out;
})();

// Adherence heatmap: 13 weeks x 7 days = 91 cells
const ADHERENCE = (() => {
  const out = [];
  for (let i = 0; i < 91; i++) {
    const r = Math.random();
    let status;
    if (i < 7) status = 'none';                          // future
    else if (r < 0.45) status = 'great';
    else if (r < 0.7) status = 'ok';
    else if (r < 0.88) status = 'off';
    else status = 'none';
    out.push({ status });
  }
  return out;
})();

// Active meal plan
const PLAN = {
  name: 'Plan Mediterráneo + Alta Proteína',
  start: '17 may', end: '23 may',
  status: 'active',
  avgCal: 1665,
  daysLogged: 5,
  todayMeals: [
    { type: 'breakfast', name: 'Omelette de claras con espinaca', cal: 280 },
    { type: 'lunch', name: 'Salmón al horno con quinoa y palta', cal: 540 },
    { type: 'snack', name: 'Yogur griego con frutos rojos', cal: 180 },
    { type: 'dinner', name: 'Wok de vegetales con tofu', cal: 460 },
  ],
};

// Past meal plans
const PAST_PLANS = [
  { name: 'Plan Equilibrado 1.700 kcal', start: '10 may', end: '16 may', status: 'completed', avgCal: 1698, adherence: 86 },
  { name: 'Plan Vegetariano Liviano',     start: '3 may',  end: '9 may',  status: 'completed', avgCal: 1623, adherence: 79 },
  { name: 'Plan de Reseteo Semanal',      start: '26 abr', end: '2 may',  status: 'completed', avgCal: 1810, adherence: 64 },
];

// Full 7-day meal plan (for wizard review)
const WEEK_PLAN = [
  { day: 'Lunes', date: '20 may', meals: [
    { type: 'breakfast', name: 'Omelette de claras con espinaca y tomate', cal: 280, p: 28, c: 10, f: 12 },
    { type: 'mid_morning', name: 'Manzana + 10 almendras', cal: 145, p: 4, c: 22, f: 6 },
    { type: 'lunch', name: 'Salmón al horno con quinoa y palta', cal: 540, p: 38, c: 42, f: 22 },
    { type: 'snack', name: 'Yogur griego con frutos rojos', cal: 180, p: 18, c: 14, f: 4 },
    { type: 'dinner', name: 'Wok de vegetales con tofu', cal: 460, p: 28, c: 38, f: 18 },
  ]},
  { day: 'Martes', date: '21 may', meals: [
    { type: 'breakfast', name: 'Tostadas integrales con palta y huevo', cal: 340, p: 18, c: 32, f: 16 },
    { type: 'mid_morning', name: 'Yogur natural con avena', cal: 165, p: 10, c: 22, f: 4 },
    { type: 'lunch', name: 'Pollo grillado con arroz integral y ensalada', cal: 560, p: 42, c: 52, f: 16 },
    { type: 'snack', name: 'Banana + mantequilla de maní', cal: 200, p: 6, c: 28, f: 8 },
    { type: 'dinner', name: 'Pescado blanco con batata asada', cal: 420, p: 32, c: 38, f: 12 },
  ]},
];

// Shopping lists
const CATEGORIES = [
  { id: 'carnes',    label: 'Carnes',           icon: '🥩', color: '#f43f5e' },
  { id: 'pescados',  label: 'Pescados y mariscos', icon: '🐟', color: '#3b82f6' },
  { id: 'lacteos',   label: 'Lácteos y huevos', icon: '🥛', color: '#fbbf24' },
  { id: 'frutver',   label: 'Frutas y verduras',icon: '🥬', color: '#22c55e' },
  { id: 'panaderia', label: 'Panadería',        icon: '🥖', color: '#d97706' },
  { id: 'almacen',   label: 'Almacén',          icon: '🍝', color: '#a855f7' },
  { id: 'otros',     label: 'Otros',            icon: '🛒', color: '#6b7280' },
];

const ACTIVE_SHOPPING = {
  id: 'sl_1',
  planName: 'Plan del 17 al 23 may',
  status: 'reviewed',
  itemsTotal: 18,
  itemsMatched: 14,
  totalEstimate: 12450,
  budget: 18000,
  uploadedAt: 'hace 2 días',
  items: [
    // Carnes
    { name: 'Pollo (pechuga)', qty: '1 kg', price: 1850, confidence: 'high', checked: true, matched: true, category: 'carnes' },
    { name: 'Carne magra picada', qty: '500 g', price: 1620, confidence: 'high', checked: true, matched: true, category: 'carnes' },
    // Pescados
    { name: 'Salmón fresco', qty: '500 g', price: 2400, confidence: 'high', checked: true, matched: true, category: 'pescados' },
    { name: 'Atún en lata', qty: '3 u', price: 980, confidence: 'high', checked: false, matched: true, category: 'pescados' },
    // Lácteos
    { name: 'Yogur griego natural', qty: '500 g', price: 540, confidence: 'medium', checked: true, matched: true, category: 'lacteos' },
    { name: 'Huevos', qty: '12 u', price: 1240, confidence: 'high', checked: true, matched: true, category: 'lacteos' },
    { name: 'Queso cottage', qty: '250 g', price: 680, confidence: 'high', checked: false, matched: true, category: 'lacteos' },
    { name: 'Leche descremada', qty: '1 L', price: 420, confidence: 'high', checked: false, matched: false, category: 'lacteos' },
    // Frutas y verduras
    { name: 'Palta Hass', qty: '4 u', price: 720, confidence: 'high', checked: true, matched: true, category: 'frutver' },
    { name: 'Espinaca', qty: '1 atado', price: 380, confidence: 'high', checked: false, matched: true, category: 'frutver' },
    { name: 'Tomate cherry', qty: '500 g', price: 480, confidence: 'low', checked: false, matched: false, category: 'frutver' },
    { name: 'Limón', qty: '6 u', price: 320, confidence: 'high', checked: true, matched: false, category: 'frutver' },
    { name: 'Banana', qty: '1 kg', price: 450, confidence: 'medium', checked: true, matched: true, category: 'frutver' },
    { name: 'Manzana verde', qty: '1 kg', price: 520, confidence: 'high', checked: false, matched: true, category: 'frutver' },
    // Panadería
    { name: 'Pan integral', qty: '1 u', price: 620, confidence: 'medium', checked: true, matched: true, category: 'panaderia' },
    // Almacén
    { name: 'Quinoa', qty: '500 g', price: 980, confidence: 'high', checked: true, matched: true, category: 'almacen' },
    { name: 'Aceite de oliva', qty: '500 ml', price: 1850, confidence: 'high', checked: true, matched: true, category: 'almacen' },
    { name: 'Almendras', qty: '200 g', price: 950, confidence: 'high', checked: true, matched: true, category: 'almacen' },
  ],
};

const PAST_LISTS = [
  { id: 'sl_2', date: '10 may', total: 7980, status: 'purchased', items: 12 },
  { id: 'sl_3', date: '3 may', total: 9120, status: 'purchased', items: 15 },
];

// Detected items (for the "AI just processed" state)
const DETECTED_ITEMS = [
  { name: 'Pollo (pechuga)', qty: '1 kg', price: 1850, confidence: 'high' },
  { name: 'Arroz integral', qty: '1 kg', price: 720, confidence: 'high' },
  { name: 'Atún en lata', qty: '3 u', price: 980, confidence: 'high' },
  { name: 'Huevos', qty: '12 u', price: 1240, confidence: 'high' },
  { name: 'Banana', qty: '1 kg', price: 450, confidence: 'medium' },
  { name: 'Brócoli', qty: '1 cab.', price: 380, confidence: 'medium' },
  { name: 'Aceite oliva', qty: '500 ml', price: 1850, confidence: 'high' },
  { name: 'Pan integral', qty: '1 u', price: 620, confidence: 'low' },
];

// Wizard preferences (defaults)
const PREFS = {
  alimentacion: { dieta: 'Omnívora', comidas: 4, snacks: true },
  restricciones: { alergias: [], evitar: ['Vísceras'] },
  estilo: { presupuesto: 18000, complejidad: 'Moderada', tiempo: 30, fuera: 'Pocas veces' },
  gustos: { variedad: 'Media', favoritos: ['Salmón', 'Palta', 'Quinoa', 'Yogur griego'] },
};

Object.assign(window, { PERSONA, TARGETS, TODAY, WEEK, WEIGHT_DATA, MACRO_TREND, ADHERENCE, PLAN, PAST_PLANS, WEEK_PLAN, ACTIVE_SHOPPING, PAST_LISTS, DETECTED_ITEMS, PREFS, CATEGORIES });
