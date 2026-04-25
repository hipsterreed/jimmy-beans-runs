import type { CHARACTER_OPTIONS } from "./data";

export type CharacterKey = (typeof CHARACTER_OPTIONS)[number]["key"];

export type CharacterAccent =
  | "warm"
  | "green"
  | "steel"
  | "bark"
  | "leaf"
  | "mist"
  | "sun"
  | "rose"
  | "ember"
  | "swamp";

export type Character = {
  key: string;
  label: string;
  flavor: string;
  accent: CharacterAccent;
};

export type Runner = {
  id: string;
  name: string;
  characterKey: string;
  goalMiles: number;
  createdAtMs: number;
};

export type Run = {
  id: string;
  runnerId: string;
  miles: number;
  runDate: string;
  createdAtMs: number;
};

export type SyncStatus = "idle" | "loading" | "connected" | "error";

export type SyncState = {
  message: string;
  status: SyncStatus;
};

export type RunnerDoc = {
  name?: string;
  characterKey?: string;
  goalMiles?: number;
  createdAtMs?: number;
};

export type RunDoc = {
  runnerId?: string;
  runner?: string;
  miles?: number;
  runDate?: string;
  createdAtIso?: string;
  createdAtMs?: number;
};

export type SideQuest = {
  title: string;
  description: string;
};

export type PlayableQuestMeta = {
  title: string;
  description: string;
};
