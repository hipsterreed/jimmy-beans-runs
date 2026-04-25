import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { DEFAULT_RUNNERS, DEFAULT_RUNNER_GOAL, QUEST_ID } from "./data";
import { FIREBASE_CONFIG } from "./firebaseConfig";
import type { Run, Runner, RunDoc, RunnerDoc, SyncState } from "./types";
import { todayIsoDate } from "./utils";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
  }
  if (!db) {
    db = getFirestore(app);
  }
  return db;
}

function runnersCollection() {
  return collection(getDb(), "quests", QUEST_ID, "runners");
}

function runsCollection() {
  return collection(getDb(), "quests", QUEST_ID, "runs");
}

export async function ensureDefaultRunners(): Promise<void> {
  const snapshot = await getDocs(runnersCollection());
  if (!snapshot.empty) return;

  await Promise.all(
    DEFAULT_RUNNERS.map((runner) =>
      setDoc(doc(getDb(), "quests", QUEST_ID, "runners", runner.id), {
        name: runner.name,
        characterKey: runner.characterKey,
        goalMiles: runner.goalMiles,
        createdAtMs: runner.createdAtMs,
      }),
    ),
  );
}

export async function addRunner(runner: {
  name: string;
  characterKey: string;
  goalMiles: number;
}): Promise<void> {
  await addDoc(runnersCollection(), {
    name: runner.name,
    characterKey: runner.characterKey,
    goalMiles: runner.goalMiles,
    createdAtMs: Date.now(),
  });
}

export async function updateRunner(runner: {
  id: string;
  name: string;
  characterKey: string;
  goalMiles: number;
}): Promise<void> {
  await updateDoc(doc(getDb(), "quests", QUEST_ID, "runners", runner.id), {
    name: runner.name,
    characterKey: runner.characterKey,
    goalMiles: runner.goalMiles,
  });
}

export async function addRun(
  runnerId: string,
  miles: number,
  runDate: string,
): Promise<void> {
  await addDoc(runsCollection(), {
    runnerId,
    miles,
    runDate,
    createdAtMs: Date.now(),
  });
}

export async function deleteRun(runId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "quests", QUEST_ID, "runs", runId));
}

export async function resetQuest(): Promise<void> {
  const snapshot = await getDocs(runsCollection());
  await Promise.all(snapshot.docs.map((runDoc) => deleteDoc(runDoc.ref)));
}

type QuestSubscription = {
  onRunners: (runners: Runner[]) => void;
  onRuns: (runs: Run[]) => void;
  onSyncState: (sync: SyncState) => void;
};

export function subscribeToQuest({ onRunners, onRuns, onSyncState }: QuestSubscription): () => void {
  const unsubscribeRunners = onSnapshot(
    runnersCollection(),
    (snapshot) => {
      const runners: Runner[] = snapshot.docs.map((runnerDoc) => {
        const data = runnerDoc.data() as RunnerDoc;
        return {
          id: runnerDoc.id,
          name: data.name || "Unnamed Runner",
          characterKey: data.characterKey || "sam",
          goalMiles: Number(data.goalMiles) || DEFAULT_RUNNER_GOAL,
          createdAtMs: Number(data.createdAtMs) || Date.now(),
        };
      });
      onRunners(runners);
      onSyncState({
        message: "Live sync active. The fellowship ledger is shared.",
        status: "connected",
      });
    },
    (error) => {
      console.error(error);
      onSyncState({
        message: "Runner sync failed. Check Firestore rules.",
        status: "error",
      });
    },
  );

  const unsubscribeRuns = onSnapshot(
    runsCollection(),
    (snapshot) => {
      const runs: Run[] = snapshot.docs.map((runDoc) => {
        const data = runDoc.data() as RunDoc;
        let runnerId = data.runnerId;
        if (!runnerId && data.runner === "sam") runnerId = "runner-sam";
        if (!runnerId && data.runner === "frodo") runnerId = "runner-frodo";

        return {
          id: runDoc.id,
          runnerId: runnerId || "",
          miles: Number(data.miles) || 0,
          runDate: data.runDate || data.createdAtIso?.slice(0, 10) || todayIsoDate(),
          createdAtMs: Number(data.createdAtMs) || Date.now(),
        };
      });
      onRuns(runs);
      onSyncState({
        message: "Live sync active. The fellowship ledger is shared.",
        status: "connected",
      });
    },
    (error) => {
      console.error(error);
      onSyncState({
        message: "Run sync failed. Check Firestore rules.",
        status: "error",
      });
    },
  );

  return () => {
    unsubscribeRunners();
    unsubscribeRuns();
  };
}
