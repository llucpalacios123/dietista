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
import { useTranslations } from "next-intl";
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

// ─── Field definitions — which fields are numeric vs enum ──────────────────

const NUMERIC_FIELDS = new Set([
  "weight",
  "height",
  "age",
  "targetCalories",
  "targetProtein",
  "targetCarbs",
  "targetFat",
  "cookingTimeAvailable",
]);

const ENUM_FIELDS = new Set([
  "sex",
  "goal",
  "activityLevel",
  "dietType",
]);

const FIELD_KEYS: Record<string, string> = {
  weight: "weight",
  height: "height",
  age: "age",
  trainingRoutine: "trainingRoutine",
  targetCalories: "targetCalories",
  targetProtein: "targetProtein",
  targetCarbs: "targetCarbs",
  targetFat: "targetFat",
  sex: "sex",
  goal: "goal",
  activityLevel: "activityLevel",
  dietType: "dietType",
};

const ENUM_VALUE_KEYS: Record<string, string[]> = {
  sex: ["male", "female"],
  goal: ["lose", "maintain", "gain"],
  activityLevel: ["sedentary", "light", "moderate", "active", "veryActive"],
  dietType: ["omnivore", "vegetarian", "vegan", "pescatarian"],
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
  const t = useTranslations("Profile");
  const tc = useTranslations("Common");
  const [changes, setChanges] = useState<Record<string, string | number>>({});

  const handleChange = useCallback(
    (field: string, value: string) => {
      setChanges((prev) => {
        if (NUMERIC_FIELDS.has(field)) {
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
          {t("updateProfile")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("updateDescription")}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fieldsToEdit.map((field) => {
            const currentValue = profile[field];
            const labelKey = FIELD_KEYS[field];
            const label = labelKey ? t(labelKey) : field;
            const isEnum = ENUM_FIELDS.has(field);
            const enumValueKeys = ENUM_VALUE_KEYS[field];

            return (
              <div key={field} className="space-y-1">
                <label className="text-sm font-medium block">
                  {label}
                </label>

                {isEnum && enumValueKeys ? (
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
                      <SelectValue placeholder={label} />
                    </SelectTrigger>
                    <SelectContent>
                      {enumValueKeys.map((valueKey) => (
                        <SelectItem key={valueKey} value={valueKey}>
                          {t(valueKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={
                      field === "age" || field === "weight" || field === "height"
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
                    {t("currentValue")}{" "}
                    {typeof currentValue === "boolean"
                      ? currentValue
                        ? t("yes")
                        : t("no")
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
              {tc("cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-1" />
              {tc("save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
