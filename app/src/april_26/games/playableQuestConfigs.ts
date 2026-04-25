import type { InputState, QuestScratch, UpdateResult } from "./shared";

export type CanvasQuestConfig = {
  engine: "canvas";
  controlsText: string;
  objectiveText: string;
  introText: string;
  runningText: string;
  successText: string;
  failureText: string;
  durationMs: number;
  setup(scratch: QuestScratch): void;
  update(deltaMs: number, scratch: QuestScratch, input: InputState): UpdateResult;
  draw(ctx: CanvasRenderingContext2D, scratch: QuestScratch): void;
};

export type ThreeQuestCallbacks = {
  onStatus?: (message: string) => void;
  onProgress?: (count: number, target: number) => void;
  onLadderLanded?: () => void;
  onComplete?: (message: string) => void;
};

export type ThreeQuestSession = {
  start(): void;
  destroy(): void;
  clearLadderAfterTrivia?: () => void;
};

export type ThreeQuestConfig = {
  engine: "three";
  controlsText: string;
  objectiveText: string;
  introText: string;
  runningText: string;
  successText: string;
  failureText: string;
  targetLadders: number;
  mount(host: HTMLElement, callbacks: ThreeQuestCallbacks): ThreeQuestSession;
};

export type PlayableQuestConfig = CanvasQuestConfig | ThreeQuestConfig;

import { flightToTheFordConfig } from "./flightToTheFord";
import { intoMoriaConfig } from "./intoMoria";
import { helmsDeepConfig } from "./helmsDeepThree";
import { shelobsLairConfig } from "./shelobsLair";
import { marchAcrossGorgorothConfig } from "./marchAcrossGorgoroth";
import { ringDestroyedConfig } from "./ringDestroyed";

export const PLAYABLE_QUEST_CONFIGS: Record<string, PlayableQuestConfig> = {
  "Flight to the Ford": flightToTheFordConfig,
  "Into Moria": intoMoriaConfig,
  "Helm's Deep Stand": helmsDeepConfig,
  "Shelob's Lair": shelobsLairConfig,
  "March Across Gorgoroth": marchAcrossGorgorothConfig,
  "Ring Destroyed": ringDestroyedConfig,
};
