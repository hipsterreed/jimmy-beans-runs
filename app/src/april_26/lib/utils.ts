import { CHARACTER_OPTIONS, CUSTOM_CHARACTER_IMAGES, CUSTOM_RUNNER_IMAGES } from "./data";
import type { Character, Runner } from "./types";

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMiles(miles: number | null | undefined): string {
  return Number(miles || 0).toFixed(1);
}

export function parseDateLabel(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "Unknown";
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function characterFor(key: string): Character {
  return (
    (CHARACTER_OPTIONS.find((character) => character.key === key) as Character | undefined) ||
    (CHARACTER_OPTIONS[0] as Character)
  );
}

export function normalizeRunnerKey(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function customImageForRunner(runner: Runner): string | null {
  return (
    CUSTOM_RUNNER_IMAGES[runner.id] ||
    CUSTOM_RUNNER_IMAGES[normalizeRunnerKey(runner.name)] ||
    CUSTOM_CHARACTER_IMAGES[runner.characterKey] ||
    null
  );
}
