"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Check, User, Target, Activity, Dumbbell, Utensils } from "lucide-react";
import type { UserProfileSchema } from "@/lib/schemas";

// ─── Types ────────────────────────────────────────────────────────────────

interface ProfileReviewCardProps {
  /** Current user profile data (already hydrated from server). */
  profile: UserProfileSchema;
  /** Callback when user wants to edit a specific field. */
  onEditField: (field: keyof UserProfileSchema) => void;
  /** Callback when user confirms all data is correct. */
  onAllCorrect: () => void;
}

// ─── Field Display Helpers ────────────────────────────────────────────────

const FIELD_LABELS: Partial<Record<keyof UserProfileSchema, string>> = {
  weight: "Peso",
  height: "Altura",
  age: "Edad",
  sex: "Sexo",
  goal: "Objetivo",
  activityLevel: "Nivel de actividad",
  trainingRoutine: "Rutina de entrenamiento",
  dietType: "Tipo de dieta",
  mealsPerDay: "Comidas por día",
  varietyPreference: "Variedad",
  targetCalories: "Calorías objetivo",
  targetProtein: "Proteína (g)",
  targetCarbs: "Carbohidratos (g)",
  targetFat: "Grasas (g)",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return String(Math.round(value));
  if (typeof value === "string") {
    // Translate common values
    const translations: Record<string, string> = {
      male: "Masculino",
      female: "Femenino",
      lose: "Bajar de peso",
      maintain: "Mantener",
      gain: "Subir de peso",
      sedentary: "Sedentario",
      light: "Ligero",
      moderate: "Moderado",
      active: "Activo",
      veryActive: "Muy activo",
      omnivore: "Omnívoro",
      vegetarian: "Vegetariano",
      vegan: "Vegano",
      pescatarian: "Pescetariano",
      low: "Baja",
      medium: "Media",
      high: "Alta",
    };
    return translations[value] ?? value;
  }
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "Ninguno";
  return String(value);
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * ProfileReviewCard — Step 1: Profile Review
 *
 * Displays the user's current profile data in a readable format.
 * Each field has an optional "Edit" button. A prominent "All Correct"
 * button allows the user to proceed without modifications.
 */
export function ProfileReviewCard({
  profile,
  onEditField,
  onAllCorrect,
}: ProfileReviewCardProps) {
  const mainFields: Array<keyof UserProfileSchema> = [
    "weight",
    "height",
    "age",
    "sex",
    "goal",
    "activityLevel",
    "trainingRoutine",
    "dietType",
    "targetCalories",
    "targetProtein",
    "targetCarbs",
    "targetFat",
  ];

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Tu Perfil Actual
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Revisá tus datos. Si algo cambió, podés editarlo. Si está todo bien, continuamos.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {mainFields.map((field) => {
            const value = profile[field];
            const label = FIELD_LABELS[field] ?? field;
            return (
              <div
                key={field}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="font-medium truncate">
                    {formatValue(value)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => onEditField(field)}
                  aria-label={`Editar ${label}`}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* All Correct CTA */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={onAllCorrect}
            size="lg"
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Todo correcto, continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
