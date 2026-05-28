import { MuscleGroup } from "@prisma/client";

// ─── Exercise Catalog ────────────────────────────────────────────────────────
// Static, read-only typed catalog. Not stored in the database.

export const GYM_EXERCISES: Record<MuscleGroup, readonly string[]> = {
  legs: [
    "Sentadilla",
    "Prensa de piernas",
    "Extensión de cuádriceps",
    "Curl de femoral",
    "Elevación de gemelos",
    "Zancada",
    "Sentadilla búlgara",
  ],
  back: [
    "Jalón al pecho",
    "Remo con barra",
    "Remo en máquina",
    "Dominadas",
    "Remo con mancuerna",
    "Peso muerto",
    "Pull-over",
  ],
  chest: [
    "Press de banca",
    "Press inclinado",
    "Aperturas con mancuernas",
    "Crossover en polea",
    "Press en máquina",
    "Fondos",
  ],
  shoulders: [
    "Press militar",
    "Elevaciones laterales",
    "Elevaciones frontales",
    "Pájaro",
    "Press Arnold",
    "Remo al mentón",
  ],
  arms: [
    "Curl de bíceps",
    "Curl martillo",
    "Extensión de tríceps",
    "Fondos en paralelas",
    "Curl con barra",
    "Press francés",
  ],
  core: [
    "Plancha",
    "Crunch",
    "Elevación de piernas",
    "Rueda abdominal",
    "Oblicuos en polea",
    "Superman",
  ],
  cardio: [
    "Cinta",
    "Bicicleta estática",
    "Elíptica",
    "Remo ergómetro",
    "Saltar a la comba",
    "HIIT",
  ],
};

export const MuscleGroupLabels: Record<MuscleGroup, string> = {
  legs: "Piernas",
  back: "Espalda",
  chest: "Pecho",
  shoulders: "Hombros",
  arms: "Brazos",
  core: "Core",
  cardio: "Cardio",
};

// ─── Catalog Helpers ─────────────────────────────────────────────────────────

export interface GymExercise {
  name: string;
  muscleGroup: MuscleGroup;
  isFromCatalog: true;
}

/**
 * Returns true if the given exercise name exists in the catalog for the
 * given muscle group. Comparison is case-insensitive.
 */
export function isExerciseInCatalog(name: string, group: MuscleGroup): boolean {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return GYM_EXERCISES[group].some(
    (exercise) => exercise.toLowerCase() === lowerName
  );
}

/**
 * Returns all exercises from the catalog for the given muscle groups,
 * each tagged with their group and isFromCatalog=true.
 * Deduplicates if the same group appears multiple times in the input.
 */
export function getCatalogByMuscleGroups(groups: MuscleGroup[]): GymExercise[] {
  const seen = new Set<MuscleGroup>();
  const result: GymExercise[] = [];

  for (const group of groups) {
    if (seen.has(group)) continue;
    seen.add(group);

    for (const name of GYM_EXERCISES[group]) {
      result.push({ name, muscleGroup: group, isFromCatalog: true });
    }
  }

  return result;
}

export type { MuscleGroup };
