export type Runner = {
  id: string;
  name: string;
  characterKey: string;
  goalMiles: number;
  createdAtMs: number;
  imageUrl?: string;
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

export type ChapterStatus = "upcoming" | "active" | "complete";

export type Chapter = {
  id: string;
  title: string;
  themeKey: string;
  order: number;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  defaultGoalMiles: number;
  status: ChapterStatus;
  createdAtMs: number;
};

export type ChapterDoc = {
  title?: string;
  themeKey?: string;
  order?: number;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  defaultGoalMiles?: number;
  status?: ChapterStatus;
  createdAtMs?: number;
};

export type User = {
  id: string;
  displayName: string;
  createdAtMs: number;
};

export type UserDoc = {
  displayName?: string;
  createdAtMs?: number;
};

export type ParticipantDoc = {
  userId?: string;
  displayName?: string;
  characterKey?: string;
  goalMiles?: number;
  createdAtMs?: number;
  imageUrl?: string;
};

export type ChapterCharacter = {
  key: string;
  label: string;
  flavor: string;
  accent: string;
  imageUrl?: string;
  createdAtMs: number;
};

export type ChapterCharacterDoc = {
  label?: string;
  flavor?: string;
  accent?: string;
  imageUrl?: string;
  createdAtMs?: number;
};

export type ChapterRunDoc = {
  userId?: string;
  miles?: number;
  runDate?: string;
  createdAtMs?: number;
};
