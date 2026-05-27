"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Local form schema — date is a "YYYY-MM-DD" string (from <input type="date">)
const formSchema = z.object({
  weight: z.coerce.number().positive().min(30, "Min 30 kg").max(300, "Max 300 kg"),
  date: z.string().min(1, "Fecha requerida"),
  notes: z.string().max(280).optional(),
});

type FormValues = z.infer<typeof formSchema>;

/** Returns today's date as "YYYY-MM-DD" in local time. */
function todayLocalDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function WeightEntryForm(): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("Progress");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weight: "" as unknown as number,
      date: todayLocalDate(),
      notes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);

    // Normalize date to UTC midnight before sending to the API
    const payload = {
      weight: values.weight,
      date: `${values.date}T00:00:00.000Z`,
      notes: values.notes || undefined,
    };

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Error al guardar");
        return;
      }

      form.reset({
        weight: "" as unknown as number,
        date: todayLocalDate(),
        notes: "",
      });
      router.refresh();
    } catch {
      setError("Error de conexión");
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
      <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
        {t("logWeight")}
      </h2>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30">
          {error}
        </p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="flex gap-3">
            {/* Weight input */}
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-xs">{t("weightLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min={30}
                      max={300}
                      placeholder={t("weightPlaceholder")}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date input */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-xs">{t("dateLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notes input */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t("notesLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={t("notesPlaceholder")}
                    disabled={isSubmitting}
                    maxLength={280}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("saving") : t("save")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
