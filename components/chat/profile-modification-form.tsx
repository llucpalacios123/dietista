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
import { Edit2, Save, X } from "lucide-react";
import type { UserProfileSchema } from "@/lib/schemas";

// ─── Types ────────────────────────────────────────────────────────────────

interface ProfileModificationFormProps {
  /** Current profile data. */
  profile: UserProfileSchema;
  /** Field(s) the user wants to edit. */
  fieldsToEdit: Array<keyof UserProfileSchema>;
  /** Callback to save modified fields. */
  onSave: (changes: Partial<UserProfileSchema>) => void;
  /** Callback to cancel and go back. */
  onCancel: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  weight: "Peso (kg)",
  height: "Altura (cm)",
  age: "Edad",
  trainingRoutine: "Rutina de entrenamiento",
  targetCalories: "Calorías objetivo",
  targetProtein: "Proteína (g)",
  targetCarbs: "Carbohidratos (g)",
  targetFat: "Grasas (g)",
};

const ENUM_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  sex: [
    { value: "male", label: "Masculino" },
    { value: "female", label: "Femenino" },
  ],
  goal: [
    { value: "lose", label: "Bajar de peso" },
    { value: "maintain", label: "Mantener" },
    { value: "gain", label: "Subir de peso" },
  ],
  activityLevel: [
    { value: "sedentary", label: "Sedentario" },
    { value: "light", label: "Ligero" },
    { value: "moderate", label: "Moderado" },
    { value: "active", label: "Activo" },
    { value: "veryActive", label: "Muy activo" },
  ],
  dietType: [
    { value: "omnivore", label: "Omnívoro" },
    { value: "vegetarian", label: "Vegetariano" },
    { value: "vegan", label: "Vegano" },
    { value: "pescatarian", label: "Pescetariano" },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────

/**
 * ProfileModificationForm — Step 2: Profile Modification
 *
 * Shows an inline editable form for only the fields the user selected
 * to modify. Numeric fields use Input, enum fields use Select.
 */
export function ProfileModificationForm({
  profile,
  fieldsToEdit,
  onSave,
  onCancel,
}: ProfileModificationFormProps) {
  const [changes, setChanges] = useState<Record<string, string | number>>({});

  const handleChange = useCallback(
    (field: string, value: string) => {
      setChanges((prev) => {
        // Parse numeric fields
        const numericFields = [
          "weight",
          "height",
          "age",
          "targetCalories",
          "targetProtein",
          "targetCarbs",
          "targetFat",
          "cookingTimeAvailable",
        ];
        if (numericFields.includes(field)) {
          const num = Number(value);
          if (value === "" || isNaN(num)) {
            const next = { ...prev };
            delete next[field];
            return next;
          }
          return { ...prev, [field]: num };
        }
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave(changes as Partial<UserProfileSchema>);
    },
    [changes, onSave],
  );

  const hasChanges = Object.keys(changes).length > 0;

  // We only show fields the user clicked "Edit" on
  if (fieldsToEdit.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Edit2 className="h-5 w-5" />
          Modificar Perfil
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Editá solo los campos que necesitás cambiar. El resto se mantiene igual.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fieldsToEdit.map((field) => {
            const currentValue = profile[field];
            const label = FIELD_LABELS[field] ?? field;
            const enumOptions = ENUM_OPTIONS[field];

            return (
              <div key={field} className="space-y-1">
                <label className="text-sm font-medium block">
                  {label}
                </label>

                {enumOptions ? (
                  <Select
                    value={
                      changes[field] !== undefined
                        ? String(changes[field])
                        : currentValue !== null && currentValue !== undefined
                          ? String(currentValue)
                          : ""
                    }
                    onValueChange={(value) => handleChange(field, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`Seleccionar ${label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {enumOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={
                      field === "age" ? "number" : field === "weight" || field === "height"
                        ? "number"
                        : "text"
                    }
                    placeholder={
                      currentValue !== null && currentValue !== undefined
                        ? String(currentValue)
                        : ""
                    }
                    onChange={(e) => handleChange(field, e.target.value)}
                    step={field === "weight" || field === "height" ? "0.1" : "1"}
                    min={0}
                  />
                )}

                {/* Show current value for reference */}
                {currentValue !== null && currentValue !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Valor actual:{" "}
                    {typeof currentValue === "boolean"
                      ? currentValue
                        ? "Sí"
                        : "No"
                      : String(currentValue)}
                  </p>
                )}
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} size="sm">
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-1" />
              Guardar cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
