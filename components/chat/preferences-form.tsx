"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { NutritionistPreferencesSchema } from "@/lib/schemas";
import { ChefHat, BadgeDollarSign, Apple, Clock, Heart } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface PreferencesFormProps {
  /** Initial preference values (for re-editing). */
  initialValues?: Partial<NutritionistPreferencesSchema>;
  /** Callback when user submits preferences. */
  onSubmit: (preferences: NutritionistPreferencesSchema) => void;
}

// ─── Default Values ───────────────────────────────────────────────────────

const DEFAULTS: NutritionistPreferencesSchema = {
  allergies: [],
  dislikedFoods: [],
  dietType: null,
  budgetFriendly: false,
  weeklyBudget: null,
  mealComplexity: null,
  mealsPerDay: 3,
  includeSnacks: false,
  varietyPreference: null,
  favoriteFoods: [],
  eatingOutFrequency: null,
  cookingTimeAvailable: null,
};

// ─── Component ────────────────────────────────────────────────────────────

/**
 * PreferencesForm — Step 3: Preferences Collection
 *
 * Structured form to collect food preferences: allergies, diet type,
 * budget settings, meal complexity, meals per day, snacks, variety,
 * and favorite foods.
 */
export function PreferencesForm({
  initialValues = {},
  onSubmit,
}: PreferencesFormProps) {
  const [values, setValues] = useState<NutritionistPreferencesSchema>({
    ...DEFAULTS,
    ...initialValues,
  });
  const [allergyInput, setAllergyInput] = useState("");
  const [dislikeInput, setDislikeInput] = useState("");
  const [favoriteInput, setFavoriteInput] = useState("");

  const update = useCallback(
    <K extends keyof NutritionistPreferencesSchema>(
      key: K,
      value: NutritionistPreferencesSchema[K],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const addItem = useCallback(
    (key: "allergies" | "dislikedFoods" | "favoriteFoods", input: string, clearFn: () => void) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      setValues((prev) => ({
        ...prev,
        [key]: [...prev[key], trimmed],
      }));
      clearFn();
    },
    [],
  );

  const removeItem = useCallback(
    (key: "allergies" | "dislikedFoods" | "favoriteFoods", index: number) => {
      setValues((prev) => ({
        ...prev,
        [key]: prev[key].filter((_, i) => i !== index),
      }));
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(values);
    },
    [values, onSubmit],
  );

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          Tus Preferencias Alimenticias
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Contame qué te gusta, qué no, y cómo preferís tus comidas.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Allergies */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Apple className="h-4 w-4" />
              Alergias alimentarias
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: maní, mariscos"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("allergies", allergyInput, () => setAllergyInput(""));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem("allergies", allergyInput, () => setAllergyInput(""))}
              >
                Agregar
              </Button>
            </div>
            {values.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.allergies.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeItem("allergies", i)}
                      className="hover:text-destructive"
                      aria-label={`Eliminar ${a}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Disliked Foods */}
          <div className="space-y-2">
            <Label>Comidas que NO te gustan</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: hígado, berenjena"
                value={dislikeInput}
                onChange={(e) => setDislikeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("dislikedFoods", dislikeInput, () => setDislikeInput(""));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem("dislikedFoods", dislikeInput, () => setDislikeInput(""))}
              >
                Agregar
              </Button>
            </div>
            {values.dislikedFoods.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.dislikedFoods.map((d, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => removeItem("dislikedFoods", i)}
                      className="hover:text-destructive"
                      aria-label={`Eliminar ${d}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Diet Type */}
          <div className="space-y-1.5">
            <Label>Tipo de dieta</Label>
            <Select
              value={values.dietType ?? ""}
              onValueChange={(v) =>
                update("dietType", v as NutritionistPreferencesSchema["dietType"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de dieta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="omnivore">Omnívoro</SelectItem>
                <SelectItem value="vegetarian">Vegetariano</SelectItem>
                <SelectItem value="vegan">Vegano</SelectItem>
                <SelectItem value="pescatarian">Pescetariano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget Friendly */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <BadgeDollarSign className="h-4 w-4" />
              ¿Modo económico?
            </Label>
            <Select
              value={values.budgetFriendly ? "true" : "false"}
              onValueChange={(v) => update("budgetFriendly", v === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No, estándar</SelectItem>
                <SelectItem value="true">Sí, quiero ahorrar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weekly Budget */}
          {values.budgetFriendly && (
            <div className="space-y-1.5">
              <Label>Presupuesto semanal ($)</Label>
              <Input
                type="number"
                placeholder="Ej: 50"
                value={values.weeklyBudget ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  update("weeklyBudget", val ? Number(val) : null);
                }}
                min={0}
                step={5}
              />
            </div>
          )}

          {/* Meal Complexity */}
          <div className="space-y-1.5">
            <Label>Complejidad de las comidas</Label>
            <Select
              value={values.mealComplexity ?? ""}
              onValueChange={(v) =>
                update("mealComplexity", v as NutritionistPreferencesSchema["mealComplexity"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="¿Cuánto tiempo querés cocinar?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple (20 min o menos)</SelectItem>
                <SelectItem value="moderate">Moderada (30-45 min)</SelectItem>
                <SelectItem value="advanced">Avanzada (sin límite)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meals Per Day */}
          <div className="space-y-1.5">
            <Label>Comidas por día</Label>
            <Select
              value={String(values.mealsPerDay)}
              onValueChange={(v) => update("mealsPerDay", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} comidas
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Include Snacks */}
          <div className="space-y-1.5">
            <Label>¿Incluir snacks?</Label>
            <Select
              value={values.includeSnacks ? "true" : "false"}
              onValueChange={(v) => update("includeSnacks", v === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Sí</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variety Preference */}
          <div className="space-y-1.5">
            <Label>Nivel de variedad</Label>
            <Select
              value={values.varietyPreference ?? ""}
              onValueChange={(v) =>
                update("varietyPreference", v as NutritionistPreferencesSchema["varietyPreference"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="¿Cuánta variedad querés?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja (repetir comidas)</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta (máxima variedad)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Favorite Foods */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              Comidas favoritas
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: pizza, sushi"
                value={favoriteInput}
                onChange={(e) => setFavoriteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("favoriteFoods", favoriteInput, () => setFavoriteInput(""));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem("favoriteFoods", favoriteInput, () => setFavoriteInput(""))}
              >
                Agregar
              </Button>
            </div>
            {values.favoriteFoods.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.favoriteFoods.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => removeItem("favoriteFoods", i)}
                      className="hover:text-destructive"
                      aria-label={`Eliminar ${f}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Eating Out Frequency */}
          <div className="space-y-1.5">
            <Label>¿Comés fuera de casa?</Label>
            <Select
              value={values.eatingOutFrequency ?? ""}
              onValueChange={(v) =>
                update("eatingOutFrequency", v as NutritionistPreferencesSchema["eatingOutFrequency"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Frecuencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Nunca</SelectItem>
                <SelectItem value="rarely">Rara vez</SelectItem>
                <SelectItem value="sometimes">A veces</SelectItem>
                <SelectItem value="often">Seguido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cooking Time Available */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Tiempo disponible para cocinar (min/día)
            </Label>
            <Input
              type="number"
              placeholder="Ej: 45"
              value={values.cookingTimeAvailable ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                update("cookingTimeAvailable", val ? Number(val) : null);
              }}
              min={5}
              step={5}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg">
              Continuar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
