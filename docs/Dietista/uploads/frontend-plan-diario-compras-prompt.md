# Dietista — Plan Wizard, Diario & Lista de Compra (Prompt para Claude Design)

## Contexto

Dietista es una app de nutrición con IA (Next.js 15, React 19, TypeScript strict, Prisma 6, PostgreSQL, OpenAI gpt-4o-mini, shadcn/ui + Tailwind 3.4). Ya existe un frontend funcional pero básico. Este prompt cubre **tres features nuevos** que el otro prompt NO incluye:

1. **Plan Wizard rediseñado** — el flujo de creación de plan necesita UX pulida
2. **Diario alimenticio** — vista por día, semana, etc. con macros tracking
3. **Lista de compra por foto** — subir foto del ticket/lista y que la IA extraiga alimentos

---

## Stack técnico (ya en producción)

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 App Router |
| Runtime | React 19 |
| Language | TypeScript strict |
| ORM | Prisma 6 |
| DB | PostgreSQL 16 (Docker) |
| Auth | NextAuth v5 (credentials, JWT) |
| AI | OpenAI SDK (gpt-4o-mini) |
| Validation | Zod |
| Forms | react-hook-form + @hookform/resolvers |
| UI | shadcn/ui (Radix) + Tailwind 3.4 |
| Icons | lucide-react |
| Charts | Recharts (nuevo — instalar) |
| Testing | Vitest + Playwright |

---

## Feature 1: Plan Wizard Rediseñado

### Estado actual

El wizard existe en `app/(dashboard)/meal-plans/new/wizard-client.tsx` con 6 pasos:

1. `PROFILE_REVIEW` — Muestra perfil con botones de editar
2. `PROFILE_MODIFICATION` — Edita campos seleccionados
3. `PREFERENCES_COLLECTION` — Formulario largo de preferencias
4. `GENERATION` — Loading con skeleton animado
5. `REVIEW_MODIFICATION` — Revisa plan generado, permite modificar comidas
6. `CONFIRMATION` — Confirmación con redirect

**Problemas actuales:**
- No hay stepper visual claramente visible (solo un texto "Paso X de 6")
- El formulario de preferencias es muy largo y monótono (un solo scroll infinito)
- La generación no muestra progreso real, solo un spinner
- La review del plan no permite modificar comidas individuales (stubs)
- La confirmación muestra JSON crudo — imposible de leer para un usuario
- No hay capacidad de regresar a pasos anteriores (forward-only)

### Requisitos del rediseño

#### Stepper visual

- Stepper horizontal en desktop, vertical en mobile
- Cada paso con número, ícono, label corto, y estado: completed / current / upcoming
- Steps: Perfil → Preferencias → Generando → Revisar → Confirmado
- Se合并 PROFILE_REVIEW + PROFILE_MODIFICATION en un solo paso con edición inline
- Total: 4 pasos visibles al usuario (no 6)

```
  [1. Perfil] ─── [2. Preferencias] ─── [3. Tu Plan] ─── [4. Listo]
       ✓                ✓                   ●                    ○
```

#### Paso 1: Perfil (merge de review + modification)

**Desktop**: Card con datos del perfil a la izquierda, resumen visual a la derecha (BMR, TDEE, macros objetivo calculados en tiempo real).

**Mobile**: Card plegable. Click en "Editar" → los campos se vuelven editables inline (no nueva página). Al guardar se recalculan macros.

Mostrar:
- Datos personales: peso, altura, edad, sexo
- Objetivo: perder/mantener/subir con indicador visual
- Nivel de actividad: iconografía clara (sedentario → muy activo)
- Macros calculados: calorías, proteína, carbs, grasas — con edición manual posible
- Botón "Recalcular" que usa Mifflin-St Jeor (ya existe en `lib/diet-service.ts`)

#### Paso 2: Preferencias

**Dividir en secciones colapsables** en vez de un solo scroll:

1. **Alimentación** — Tipo de dieta, comidas por día, snacks sí/no
2. **Restricciones** — Alergias, comidas no deseadas (tags con chip input)
3. **Estilo de vida** — Presupuesto, complejidad, tiempo de cocina, comer fuera
4. **Gustos** — Comidas favoritas, nivel de variedad

Cada sección con ícono, título, y resumen de lo seleccionado cuando está colapsada. La section expandida muestra el formulario. Animación suave al expandir/colapsar.

Progress: "4 de 4 secciones completadas" — solo habilitar "Generar plan" cuando las secciones obligatorias estén llenas.

#### Paso 3: Generación

Reemplazar el skeleton genérico con:

- **Barra de progreso animada** con etapas reales (si el backend las soporta) o fake progress con easing
- **Tips rotativos** mientras genera — "Buscando recetas con tus favoritos...", "Ajustando proteínas a tu objetivo...", "Verificando alergenos..."
- **Tiempo estimado** basado en generación previa (~15-30s típicamente)
- Botón "Cancelar" visible (no escondido)
- Si timeout (2 min): botón "Reintentar" prominente + mensaje claro en español

#### Paso 4: Revisión del plan

**Vista principal: Calendario semanal**

- 7 columnas (Lun-Dom) con las comidas de cada día
- Toggle de vista: "Por día" (1 día grande) / "Semana completa" (7 columnas compactas)
- Cada comida muestra: nombre, calorías, macro bar mini (P/C/F)
- Click/tap en una comida → expande descripción + macros completos
- Botón "Modificar esta comida" → modal con opciones:
  - "No me gusta" → regenera esa comida
  - "Alergia" → regenera evitando el alergeno
  - "Muy complicada" → genera alternativa más simple
  - "Otra razón" → campo libre + regeneración
- Botón "Regenerar día completo" → confirma con diálogo
- **Resumen semanal** al fondo: calorías totales, promedio diario, macros promedio

#### Confirmación

- Card con checkmark animado
- Resumen: "Tu plan del {fecha inicio} al {fecha fin} está listo"
- Macros diarios promedio: calorías / proteína / carbs / grasas
- CTAs: "Ver mi plan" (→ Diario) | "Ir a la lista de compra" (→ Lista)
- NO mostrar JSON crudo nunca

### Modelo de datos existente

```prisma
MealPlan: userId, templateId?, startDate, endDate, status (draft/active/completed), totalCalories
Meal: mealPlanId, dayOfWeek (0=Lun..6=Dom), mealType (breakfast/mid_morning/lunch/dinner/snack),
      name, description, calories, protein, carbs, fat, selectedOptions (Json)
ConversationState: userId, currentStep, profileData (Json), preferences (Json),
                   generatedPlan (Json), modifications (Json), validatedJson (Json)
```

### Server Actions existentes (reutilizar)

- `generateWizardPlan()` — genera el plan via diet-service
- `updateWizardProfile()` — actualiza campos del perfil desde el wizard
- `createMealLog()` — interpreta texto libre con OpenAI

### API routes existentes (reutilizar)

- `POST /api/meal-plans/generate` — enqueue async job
- `GET /api/meal-plans/jobs/[id]` — check job status
- `POST /api/meal-plans/[id]/confirm` — confirm draft → active

---

## Feature 2: Diario Alimenticio

### Rutas propuestas

```
/dashboard/diario           — Vista del día actual
/dashboard/diario/[date]   — Vista de un día específico (YYYY-MM-DD)
/dashboard/diario/semanal   — Vista semanal
```

### Vista diaria (`/dashboard/diario`)

**Layout:**

```
┌─────────────────────────────────────────────────┐
│  Tue 21 May 2025              ◄ May 2025 ►     │
├─────────────────────────────────────────────────┤
│                                                 │
│     ┌─────────┐  ┌─────────┐                   │
│     │ 1,850    │  │ 120g    │                   │
│ │ Calorías  │  │ Proteína│                   │
│     │  /2,200  │  │  /150g  │                   │
│     └─────────┘  └─────────┘                   │
│     ┌─────────┐  ┌─────────┐                   │
│     │ 200g    │  │  65g    │                   │
│     │ Carbs   │  │  Grasa  │                   │
│     │  /250g  │  │  /70g   │                   │
│     └─────────┘  └─────────┘                   │
│                                                 │
├─────────────────────────────────────────────────┤
│  + Registrar comida                   [📷 Foto] │
├─────────────────────────────────────────────────┤
│                                                 │
│  🌅 Desayuno                    420 kcal       │
│  ├ Avena con banana y miel                     │
│  │  P: 12g  C: 65g  F: 8g  Confianza: alta    │
│                                                 │
│  ☀️ Almuerzo                    650 kcal       │
│  ├ Pollo a la plancha, arroz, ensalada         │
│  │  P: 45g  C: 70g  F: 15g  Confianza: alta   │
│                                                 │
│  🌙 Cena                        —              │
│  No registrado                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Componentes:**

1. **DateSelector** — Header con fecha actual, flechas izq/der para navegar días, tap en fecha para abrir date picker. Atajo "Hoy".
2. **MacroRings** — 4 circular progress rings (SVG): Calorías (azul), Proteína (verde), Carbs (ámbar), Grasa (rosa). Cada uno muestra `consumido / objetivo`. Probabilidad de gradiente en el progreso. El ring de calorías es más grande (el principal).
3. **QuickLogFAB** — Botón flotante "+" para registrar comida. Abre modal con:
   - Selector de tipo de comida (Desayuno / Almuerzo / Merienda / Cena / Snack)
   - Textarea: "¿Qué comiste?" — texto libre, la IA interpreta
   - Botón "Subir foto" → abre Feature 3 (lista de compra)
4. **MealTimeline** — Lista cronológica de comidas del día. Cada entrada:
   - Ícono del tipo de comida + hora (si está disponible)
   - Nombre/platillo
   - Calorías totales del meal
   - Expandir: ver cada alimento individual con macros y confianza
   - Editar/Eliminar (swipe en mobile)
5. **RemainingCalories** — Al fondo: "Te quedan 350 kcal para hoy" con macro breakdown

### Vista semanal (`/dashboard/diario/semanal`)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Semana del 19 al 25 May 2025            ◄ Semana ►        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Lun  │  Mar  │  Mié  │  Jue  │  Vie  │  Sáb  │  Dom       │
│  ✅   │  ✅   │  🔵   │       │       │       │            │
│ 2100  │ 2050  │ 1850  │       │       │       │            │
│ ████  │ ████  │ ████  │       │       │       │            │
│                                                             │
│  Promedio semanal: 2,000 kcal                              │
│  Adherencia: ████████░░ 80%                                 │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**

1. **WeekSelector** — Flechas para navegar semanas. Click en la semana para abrir date picker. Atajo "Esta semana".
2. **WeekGrid** — 7 columnas (o filas en mobile). Cada día:
   - Nombre del día + fecha
   - Indicador: ✅ dentro de objetivo, ⚠️ ligeramente fuera, ❌ muy fuera, 🔵 hoy
   - Calorías totales del día
   - Barra mini de macros (P/C/F proporcionales)
   - Click → navega a vista diaria de ese día
3. **WeeklySummary** — Al pie: promedio semanal de calorías y macros, % adherencia, comparación con objetivo
4. **MiniChart** — Gráfico de líneas (Recharts) mostrando calorías por día de la semana con línea horizontal del objetivo

### Modelo de datos: MealLog (ya existe)

```prisma
MealLog: userId, date, mealType, rawInput, 
         interpretedFoods (Json: [{foodName, quantity, unit, calories, protein, carbs, fat, confidence}]),
         totalCalories
```

### Nuevos Server Actions necesarios

```typescript
// actions/diario.ts
getDailyMacros(date: Date): Promise<DailyMacroSummary>
  // Agrega todos los MealLogs del día por mealType
  // Calcula totales y compara con Profile.targetCalories, etc.

getWeeklyMacros(startOfWeek: Date): Promise<WeeklyMacroSummary>
  // 7 días de DailyMacroSummary

deleteMealLog(id: string): Promise<void>
  // Eliminar un log registrado

updateMealLog(id: string, data: UpdateMealLogInput): Promise<MealLog>
  // Editar un log existente

logMealFromText(input: { date: string, mealType: MealType, rawInput: string }): Promise<MealLog>
  // Envolver createMealLog existente con mejor UX
```

### Nuevos API endpoints

```
GET  /api/diario/daily?date=YYYY-MM-DD     → DailyMacroSummary
GET  /api/diario/weekly?start=YYYY-MM-DD   → WeeklyMacroSummary
DELETE /api/meal-logs/[id]                  → Eliminar log
PATCH /api/meal-logs/[id]                  → Actualizar log
```

---

## Feature 3: Lista de Compra por Foto

### Concepto

El usuario sube una foto del ticket de compra / lista de compras escrita a mano. La IA (OpenAI Vision) extrae:
- Los alimentos mencionados
- Cantidades si están disponibles
- Precios si son legibles (del ticket)
- Códigos de barra si son visibles (bonus)

La app cruz estos datos con la base de datos `Food` y el plan de comidas activo para:
- Identificar qué alimentos del plan faltan por comprar
- Estimar costo total vs. presupuesto semanal
- Auto-popular ingredientes en el diario si el usuario quiere

### Flujo de usuario

```
1. Usuario tap "📷 Subir foto" (desde el Diario o la Lista de Compra)
2. Selecciona: cámara o galería
3. Preview de la imagen con indicador de carga
4. IA procesa → muestra lista extraída:
   ┌─────────────────────────────────────────┐
   │  📋 Lista detectada                    │
   │                                         │
   │  ☑ Leche 1L          ~$1.20            │
   │  ☑ Pollo 500g        ~$3.50            │
   │  ☑ Arroz 1kg         ~$1.00            │
   │  ☐ Pan integral      ~$2.00            │
   │  ☑ Huevos x12        ~$2.50            │
   │  ? Manzana (confianza baja) ~$1.50     │
   │                                         │
   │  Total estimado: $11.70                 │
   │  Budget semanal: $50 (23% usado)        │
   │                                         │
   │  [Agregar al diario]  [Guardar lista]   │
   └─────────────────────────────────────────┘
5. Usuario corrige/aprueba items
6. Acción: "Agregar al diario" → crea MealLog con los alimentos
            "Guardar lista" → asocia al MealPlan actual
```

### Componentes nuevos

1. **PhotoUploader** — Componente de upload con:
   - Input type="file" accept="image/*" capture="environment" (abre cámara en mobile)
   - Drag & drop zone para desktop
   - Preview de la imagen antes de enviar
   - Indicador de carga animado durante procesamiento
   - Output: lista de `DetectedFoodItem[]`

2. **DetectedFoodList** — Lista editable de items detectados:
   - Cada item: checkbox, nombre, cantidad, precio estimado
   - Confidence indicator: 🟢 alta, 🟡 media, 🔴 baja
   - Editar nombre, cantidad, eliminar items
   - Agregar items manualmente si la IA no los detectó
   - Total estimado actualizado en tiempo real

3. **ShoppingListSummary** — Resumen:
   - Total estimado del ticket
   - Comparación con presupuesto semanal
   - Items que coinciden con el plan actual
   - Items faltantes del plan que no están en la lista

### Modelo de datos nuevo

```prisma
model ShoppingList {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mealPlanId  String?  // vinculado a un plan activo (opcional)
  mealPlan    MealPlan? @relation(fields: [mealPlanId], references: [id], onDelete: SetNull)
  imageUrl    String   // URL de la imagen subida (S3/Cloudflare R2)
  status      ShoppingListStatus @default(pending)
  totalEstimate Float?  // precio total estimado
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items       ShoppingListItem[]
}

model ShoppingListItem {
  id             String   @id @default(cuid())
  shoppingListId String
  shoppingList   ShoppingList @relation(fields: [shoppingListId], references: [id], onDelete: Cascade)
  foodName       String   // nombre detectado por la IA
  quantity       String?  // "500g", "1L", "x12"
  estimatedPrice Float?  // precio si se detectó
  confidence      String  @default("medium")  // high, medium, low
  matchedFoodId   String? // match contra tabla Food
  matchedFood     Food?   @relation(fields: [matchedFoodId], references: [id], onDelete: SetNull)
  checked         Boolean @default(false) // el usuario lo tildó
  addedToDiary    Boolean @default(false) // se agregó al diario
  createdAt      DateTime @default(now())

  @@index([shoppingListId])
}

enum ShoppingListStatus {
  pending         // esperando revisión del usuario
  reviewed        // el usuario aprobó/corrigió
  purchased       // se compró todo
  partially_purchased  // se compró parcialmente
}
```

### OpenAI Vision integration

Nuevo prompt en `lib/openai.ts`:

```typescript
export const SHOPPING_LIST_INTERPRET_SYSTEM = `You are a nutrition assistant that analyzes images of shopping lists and receipts.
Extract all food items with:
- foodName: the food item name (in Spanish if the image is in Spanish)
- quantity: amount detected (e.g., "500g", "1L", "x12") or null
- estimatedPrice: price if visible (number, in the local currency) or null
- confidence: "high" (clearly visible), "medium" (partially visible or ambiguous), "low" (guess)

Also provide:
- totalEstimate: estimated total price of all items (or null if not visible)

Return as JSON: { items: [...], totalEstimate: number | null }

Focus ONLY on food items. Ignore non-food items like cleaning products, toiletries, etc.
If the image is not a shopping list or receipt, return { items: [], totalEstimate: null }.`;
```

Necesita usar la API de Vision de OpenAI:

```typescript
// Nuevo endpoint en lib/openai.ts
export async function interpretShoppingListImage(
  base64Image: string
): Promise<ShoppingListInterpretation> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // soporta vision
    messages: [
      { role: "system", content: SHOPPING_LIST_INTERPRET_SYSTEM },
      {
        role: "user",
        content: [
          { type: "text", text: "Analizá esta lista de compras o ticket de compra." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 2000,
  });
  // parse, validate, return
}
```

### Server Actions nuevos

```typescript
// actions/shopping-list.ts
uploadShoppingList(image: FormData): Promise<ShoppingList>
  // 1. Upload imagen a storage (S3/R2/Uploadthing)
  // 2. Enviar a OpenAI Vision
  // 3. Crear ShoppingList + ShoppingListItems
  // 4. Retornar lista con items detectados

reviewShoppingList(listId: string, corrections: ShoppingListCorrection[]): Promise<ShoppingList>
  // Aplicar correcciones del usuario (renombrar, eliminar, agregar items)
  // Intentar match contra tabla Food

addShoppingListToDiary(listId: string, date: string, mealType: MealType): Promise<MealLog[]>
  // Convertir items checked del shopping list en un MealLog

markAsPurchased(listId: string, purchasedItemIds: string[]): Promise<void>
  // Marcar items como comprados
```

### Image Storage

Para MVP: usar **Uploadthing** (ya tiene integración con Next.js) o **Cloudflare R2** con presigned URLs.

Para empezar rápido: guardar la imagen como base64 en la DB (solo para demo, máx 5MB) y migrar a storage real después.

### Rutas propuestas

```
/dashboard/compras                    — Lista de compra actual + historial
/dashboard/compras/nueva              — Subir foto o crear manual
/dashboard/compras/[id]               — Ver/editar lista específica
```

### Vista principal (`/dashboard/compras`)

```
┌──────────────────────────────────────────────────┐
│  Lista de Compra                      [+ Nueva]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  📋 Semana actual                                │
│  ┌────────────────────────────────────────────┐  │
│  │ Plan: "Plan del 19-25 May"                 │  │
│  │ Estado: 🟡 Pendiente de revisión           │  │
│  │ Items: 12 detectados, 8 con match          │  │
│  │ Total: ~$35.50 (presupuesto: $50)          │  │
│  │                                            │  │
│  │ [Revisar]  [Marcar como comprado]           │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  📋 Listas anteriores                            │
│  ┌ 18 May — $42.30 ── ✅ Comprado            ┐  │
│  └ 11 May — $38.00 ── ✅ Comprado            ┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Vista de subir foto (`/dashboard/compras/nueva`)

```
┌──────────────────────────────────────────────────┐
│  Nueva Lista de Compra                            │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │                                            │  │
│  │     📷                                     │  │
│  │     Subí una foto de tu ticket            │  │
│  │     o lista de compras                     │  │
│  │                                            │  │
│  │     [Seleccionar foto]  [Usar cámara]      │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ─── o escribí manualmente ───                   │
│                                                  │
│  [Crear lista vacía]                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Consideraciones de diseño generales

### Idioma

Todo el UI en **español rioplatense**:
- "Tú" → "vos"
- "Registra" → "Regist rá"
- "Comida" no "Meal"
- "Desayuno", "Almuerzo", "Merienda", "Cena", "Snack" (este sí en inglés)
- "Lista de compra" no "Shopping list"
- "Presupuesto" no "Budget"

### Colores y tema

Extender los existing CSS variables con:

```css
:root {
  /* Macros */
  --macro-calories: #3b82f6;    /* blue-500 */
  --macro-protein: #10b981;     /* emerald-500 */
  --macro-carbs: #f59e0b;       /* amber-500 */
  --macro-fat: #f43f5e;         /* rose-500 */

  /* Adherencia */
  --adherence-good: #22c55e;     /* green-500 — within 10% */
  --adherence-warning: #eab308;  /* yellow-500 — within 20% */
  --adherence-bad: #ef4444;     /* red-500 — off target */
  --adherence-empty: #6b7280;   /* gray-500 — no data */

  /* Estados */
  --status-draft: #eab308;
  --status-active: #22c55e;
  --status-completed: #6b7280;
}

.dark {
  --macro-calories: #60a5fa;    /* blue-400 */
  --macro-protein: #34d399;     /* emerald-400 */
  --macro-carbs: #fbbf24;       /* amber-400 */
  --macro-fat: #fb7185;         /* rose-400 */
}
```

### Mobile-first

- Bottom navigation en mobile (5 items: Inicio, Diario, Planes, Compras, Perfil)
- Sidebar en desktop (colapsable a icons)
- Sheets modales (bottom sheets en mobile, centered modals en desktop)
- Swipe gestures para navegación entre días
- haptic feedback en acciones importantes (confirmar plan, registrar comida)

### Animaciones

- Macro rings: animación de fill al cargar datos (spring animation, no linear)
- Page transitions: fade + slide (30ms)
- Meal log cards: entrance animation (staggered 50ms)
- Stepper: transición suave entre steps (slide izquierda/derecha)
- Photo upload: progress ring durante procesamiento

### Accesibilidad

- Todos los colores tienen un label asociado (no solo color como indicador)
- Los gráficos tienen `aria-label` descriptivos
- Los rings de macro tienen `role="progressbar"` con `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Formularios con `aria-invalid` y `aria-describedby` para errores
- Navegación por teclado completa en el wizard

### Performance

- Lazy load de Recharts (todos los charts con `next/dynamic` + `ssr: false`)
- Image upload: compresión client-side antes de enviar (max 1MB para OpenAI Vision)
- Debounce en el date picker del diario
- Virtual scrolling en lista de comidas si >50 entries
- Cache de macros diarios con React Query / SWR (stale-while-revalidate)

---

## Endpoints nuevos necesarios

```
POST   /api/shopping-lists              — Crear lista (con o sin imagen)
POST   /api/shopping-lists/upload       — Upload imagen + procesar con Vision
GET    /api/shopping-lists              — Listar listas del usuario
GET    /api/shopping-lists/[id]         — Ver lista con items
PATCH  /api/shopping-lists/[id]         — Actualizar lista (corregir items)
POST   /api/shopping-lists/[id]/purchase — Marcar como comprado
POST   /api/shopping-lists/[id]/to-diary — Convertir items a MealLog

GET    /api/diario/daily?date=YYYY-MM-DD     — Macros del día
GET    /api/diario/weekly?start=YYYY-MM-DD   — Macros de la semana

DELETE /api/meal-logs/[id]               — Eliminar log
PATCH  /api/meal-logs/[id]               — Actualizar log
```

---

## Prisma models nuevos requeridos

```prisma
// Ya existe: MealLog, Meal, MealPlan, Food, Profile, etc.

// NUEVOS:
model WeightLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime @default(now())
  weight    Float
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, date])
  @@index([userId, date])
}

model ShoppingList {
  id             String              @id @default(cuid())
  userId         String
  user           User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  mealPlanId     String?
  mealPlan       MealPlan?           @relation(fields: [mealPlanId], references: [id], onDelete: SetNull)
  imageUrl       String?
  status         ShoppingListStatus  @default(pending)
  totalEstimate  Float?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  items          ShoppingListItem[]

  @@index([userId])
  @@index([userId, status])
}

model ShoppingListItem {
  id              String   @id @default(cuid())
  shoppingListId  String
  shoppingList    ShoppingList @relation(fields: [shoppingListId], references: [id], onDelete: Cascade)
  foodName        String
  quantity        String?
  estimatedPrice  Float?
  confidence       String   @default("medium")
  matchedFoodId   String?
  matchedFood     Food?    @relation(fields: [matchedFoodId], references: [id], onDelete: SetNull)
  checked         Boolean  @default(false)
  addedToDiary    Boolean  @default(false)
  createdAt       DateTime @default(now())

  @@index([shoppingListId])
}

enum ShoppingListStatus {
  pending
  reviewed
  purchased
  partially_purchased
}

// Agregar a User:
// model User {
//   ...
//   weightLogs     WeightLog[]
//   shoppingLists  ShoppingList[]
// }

// Agregar a MealPlan:
// model MealPlan {
//   ...
//   shoppingLists  ShoppingList[]
// }

// Agregar a Food:
// model Food {
//   ...
//   shoppingListItems ShoppingListItem[]
// }
```

---

## Hooks personalizados necesarios

```typescript
// hooks/use-daily-macros.ts
useDailyMacros(date: Date): {
  consumed: { calories, protein, carbs, fat }
  targets: { calories, protein, carbs, fat }
  remaining: { calories, protein, carbs, fat }
  percentage: { calories, protein, carbs, fat }
  meals: MealLogByType[]
}

// hooks/use-weekly-macros.ts
useWeeklyMacros(startOfWeek: Date): {
  days: DailyMacroSummary[]
  averages: { calories, protein, carbs, fat }
  adherence: number // 0-100
}

// hooks/use-shopping-list.ts
useShoppingList(id: string): {
  list: ShoppingListWithItems
  updateItem: (itemId: string, changes: Partial<ShoppingListItem>) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  checkItem: (itemId: string) => Promise<void>
  addToDiary: (itemIds: string[], date: string, mealType: MealType) => Promise<void>
  markAsPurchased: () => Promise<void>
}

// hooks/use-shopping-list-upload.ts
useShoppingListUpload(): {
  upload: (file: File) => Promise<ShoppingList>
  isProcessing: boolean
  progress: number
  error: string | null
}

// hooks/use-weight-log.ts
useWeightLog(): {
  logs: WeightLog[]
  addEntry: (weight: number, date?: Date, notes?: string) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
}
```

---

## Entregables esperados

1. **Wizard rediseñado** — Componentes de stepper, pasos con edición inline, generación con tips, review con calendario, confirmación sin JSON
2. **Diario diario/semanal** — Macro rings, meal timeline, week grid, date navigation
3. **Lista de compra por foto** — PhotoUploader, DetectedFoodList, ShoppingListSummary, integración con OpenAI Vision
4. **Modelos Prisma** — WeightLog, ShoppingList, ShoppingListItem con migración
5. **Server Actions** — diario.ts, shopping-list.ts, weight.ts
6. **API endpoints** — diario, shopping-lists, meal-logs CRUD
7. **Custom hooks** — useDailyMacros, useWeeklyMacros, useShoppingList, useShoppingListUpload, useWeightLog
8. **CSS variables** — Macro colors, adherence colors, status colors
9. **Mobile-first responsive** — Bottom nav, sheets, swipe gestures
10. **OpenAI Vision integration** — interpretShoppingListImage en lib/openai.ts

### Constraints

- **No `any`** — TypeScript strict
- **Server Components por defecto** — `'use client'` solo cuando sea necesario
- **Server Actions para mutaciones** — API routes solo para consumidores externos
- **Prisma only** — No raw SQL
- **shadcn/ui** — Componentes existentes + nuevos via `npx shadcn-ui@latest add`
- **Recharts** — Para todos los gráficos
- **Español rioplatense** — Todo el UI copy
- **Conventional commits** — Un cambio lógico por commit