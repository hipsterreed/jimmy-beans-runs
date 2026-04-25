import { CHARACTER_OPTIONS, CUSTOM_CHARACTER_IMAGES, CUSTOM_RUNNER_IMAGES } from "./data";
import type { Character, Runner } from "./types";
import { normalizeRunnerKey } from "../../shared/lib/utils";

export {
  formatMiles,
  normalizeRunnerKey,
  parseDateLabel,
  todayIsoDate,
} from "../../shared/lib/utils";

export function characterFor(key: string): Character {
  return (
    (CHARACTER_OPTIONS.find((character) => character.key === key) as Character | undefined) ||
    (CHARACTER_OPTIONS[0] as Character)
  );
}

export function customImageForRunner(runner: Runner): string | null {
  return (
    runner.imageUrl ||
    CUSTOM_RUNNER_IMAGES[runner.id] ||
    CUSTOM_RUNNER_IMAGES[normalizeRunnerKey(runner.name)] ||
    CUSTOM_CHARACTER_IMAGES[runner.characterKey] ||
    null
  );
}
