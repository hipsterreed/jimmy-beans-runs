import { create } from "zustand";
import type { Run, Runner, SyncState } from "../lib/types";

const DEV_MODE_STORAGE_KEY = "jimmy-bean-runs-dev-mode";

function readDevMode(): boolean {
  try {
    return window.localStorage.getItem(DEV_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function persistDevMode(value: boolean) {
  try {
    window.localStorage.setItem(DEV_MODE_STORAGE_KEY, String(value));
  } catch {
    // ignore storage failures
  }
}

export type ModalState = {
  runner: { mode: "add" | "edit"; runnerId?: string } | null;
  deleteRun: { runId: string; miles: number; date: string } | null;
  reset: boolean;
  questGame: { questTitle: string } | null;
  ending: { auto: boolean } | null;
};

type QuestStore = {
  runners: Runner[];
  runs: Run[];
  devMode: boolean;
  syncState: SyncState;
  modals: ModalState;
  setRunners: (runners: Runner[]) => void;
  setRuns: (runs: Run[]) => void;
  setSyncState: (sync: SyncState) => void;
  toggleDevMode: () => void;
  openRunnerModal: (mode: "add" | "edit", runnerId?: string) => void;
  closeRunnerModal: () => void;
  openDeleteRunModal: (run: { runId: string; miles: number; date: string }) => void;
  closeDeleteRunModal: () => void;
  openResetModal: () => void;
  closeResetModal: () => void;
  openQuestGame: (questTitle: string) => void;
  closeQuestGame: () => void;
  openEndingModal: (auto: boolean) => void;
  closeEndingModal: () => void;
};

export const useQuestStore = create<QuestStore>((set) => ({
  runners: [],
  runs: [],
  devMode: readDevMode(),
  syncState: { message: "", status: "idle" },
  modals: {
    runner: null,
    deleteRun: null,
    reset: false,
    questGame: null,
    ending: null,
  },
  setRunners: (runners) => set({ runners }),
  setRuns: (runs) => set({ runs }),
  setSyncState: (sync) => set({ syncState: sync }),
  toggleDevMode: () =>
    set((state) => {
      const next = !state.devMode;
      persistDevMode(next);
      return { devMode: next };
    }),
  openRunnerModal: (mode, runnerId) =>
    set((state) => ({ modals: { ...state.modals, runner: { mode, runnerId } } })),
  closeRunnerModal: () =>
    set((state) => ({ modals: { ...state.modals, runner: null } })),
  openDeleteRunModal: (payload) =>
    set((state) => ({ modals: { ...state.modals, deleteRun: payload } })),
  closeDeleteRunModal: () =>
    set((state) => ({ modals: { ...state.modals, deleteRun: null } })),
  openResetModal: () =>
    set((state) => ({ modals: { ...state.modals, reset: true } })),
  closeResetModal: () =>
    set((state) => ({ modals: { ...state.modals, reset: false } })),
  openQuestGame: (questTitle) =>
    set((state) => ({ modals: { ...state.modals, questGame: { questTitle } } })),
  closeQuestGame: () =>
    set((state) => ({ modals: { ...state.modals, questGame: null } })),
  openEndingModal: (auto) =>
    set((state) => ({ modals: { ...state.modals, ending: { auto } } })),
  closeEndingModal: () =>
    set((state) => ({ modals: { ...state.modals, ending: null } })),
}));
