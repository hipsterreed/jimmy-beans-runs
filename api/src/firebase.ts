import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const QUEST_ID = "april-quest";

export function initFirebase() {
  if (getApps().length > 0) return;

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Bun reads .env literally, so replace escaped newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export function getDb() {
  return getFirestore();
}

export interface Run {
  id: string;
  runnerId: string;
  miles: number;
  runDate: string;
  createdAtMs: number;
}

export interface Runner {
  id: string;
  name: string;
  characterKey: string;
  goalMiles: number;
}

export async function getRunner(runnerId: string): Promise<Runner | null> {
  const db = getDb();
  const doc = await db
    .collection("quests")
    .doc(QUEST_ID)
    .collection("runners")
    .doc(runnerId)
    .get();

  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name ?? "Unknown Runner",
    characterKey: data.characterKey ?? "sam",
    goalMiles: data.goalMiles ?? 30,
  };
}

export function listenForNewRuns(onNewRun: (run: Run) => void): () => void {
  const db = getDb();
  let initialized = false;

  const unsubscribe = db
    .collection("quests")
    .doc(QUEST_ID)
    .collection("runs")
    .onSnapshot((snapshot) => {
      // Skip the initial population of existing docs
      if (!initialized) {
        initialized = true;
        return;
      }

      for (const change of snapshot.docChanges()) {
        if (change.type !== "added") continue;

        const data = change.doc.data();
        onNewRun({
          id: change.doc.id,
          runnerId: data.runnerId ?? "",
          miles: Number(data.miles) ?? 0,
          runDate: data.runDate ?? "",
          createdAtMs: Number(data.createdAtMs) ?? Date.now(),
        });
      }
    });

  return unsubscribe;
}
