import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { FIREBASE_CONFIG } from "./firebaseConfig";
import type {
  ChapterRunDoc,
  ParticipantDoc,
  Run,
  Runner,
  SyncState,
  UserDoc,
} from "./types";
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

export type DefaultParticipant = {
  userId: string;
  displayName: string;
  characterKey: string;
  goalMiles: number;
  createdAtMs: number;
};

export type ChapterApiConfig = {
  chapterId: string;
  defaultParticipants: readonly DefaultParticipant[];
  defaultParticipantGoal: number;
  defaultCharacterKey: string;
  legacyParticipantIdMap?: Record<string, string>;
  connectedMessage?: string;
};

export type ChapterSubscription = {
  onParticipants: (participants: Runner[]) => void;
  onRuns: (runs: Run[]) => void;
  onSyncState: (sync: SyncState) => void;
};

export type AddParticipantInput = {
  userId?: string;
  displayName: string;
  characterKey: string;
  goalMiles: number;
  imageUrl?: string;
};

export type UpdateParticipantInput = {
  userId: string;
  displayName: string;
  characterKey: string;
  goalMiles: number;
  imageUrl?: string;
};

export type ChapterApi = {
  ensureDefaultParticipants: () => Promise<void>;
  addParticipant: (input: AddParticipantInput) => Promise<void>;
  updateParticipant: (input: UpdateParticipantInput) => Promise<void>;
  deleteParticipant: (userId: string) => Promise<void>;
  addRun: (userId: string, miles: number, runDate: string) => Promise<void>;
  deleteRun: (runId: string) => Promise<void>;
  resetChapter: () => Promise<void>;
  subscribeToChapter: (sub: ChapterSubscription) => () => void;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateUserId(displayName: string): string {
  const slug = slugify(displayName) || "anon";
  return `user-${slug}-${Date.now()}`;
}

async function upsertUser(userId: string, displayName: string): Promise<void> {
  const ref = doc(getDb(), "users", userId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const current = existing.data() as UserDoc;
    if (current.displayName !== displayName) {
      await updateDoc(ref, { displayName });
    }
    return;
  }
  await setDoc(ref, {
    displayName,
    createdAtMs: Date.now(),
  } satisfies UserDoc);
}

export function createChapterApi(config: ChapterApiConfig): ChapterApi {
  const {
    chapterId,
    defaultParticipants,
    defaultParticipantGoal,
    defaultCharacterKey,
    legacyParticipantIdMap,
    connectedMessage = "Live sync active.",
  } = config;

  const participantsCollection = () =>
    collection(getDb(), "chapters", chapterId, "participants");
  const runsCollection = () =>
    collection(getDb(), "chapters", chapterId, "runs");
  const participantDoc = (userId: string) =>
    doc(getDb(), "chapters", chapterId, "participants", userId);
  const runDoc = (runId: string) =>
    doc(getDb(), "chapters", chapterId, "runs", runId);

  return {
    async ensureDefaultParticipants() {
      const snapshot = await getDocs(participantsCollection());
      if (!snapshot.empty) return;

      await Promise.all(
        defaultParticipants.map(async (participant) => {
          await upsertUser(participant.userId, participant.displayName);
          await setDoc(participantDoc(participant.userId), {
            userId: participant.userId,
            displayName: participant.displayName,
            characterKey: participant.characterKey,
            goalMiles: participant.goalMiles,
            createdAtMs: participant.createdAtMs,
          } satisfies ParticipantDoc);
        }),
      );
    },

    async addParticipant(input) {
      const userId = input.userId || generateUserId(input.displayName);
      await upsertUser(userId, input.displayName);
      const payload: ParticipantDoc = {
        userId,
        displayName: input.displayName,
        characterKey: input.characterKey,
        goalMiles: input.goalMiles,
        createdAtMs: Date.now(),
      };
      if (input.imageUrl) payload.imageUrl = input.imageUrl;
      await setDoc(participantDoc(userId), payload);
    },

    async updateParticipant(input) {
      await upsertUser(input.userId, input.displayName);
      const payload: Partial<ParticipantDoc> = {
        displayName: input.displayName,
        characterKey: input.characterKey,
        goalMiles: input.goalMiles,
      };
      if (input.imageUrl !== undefined) payload.imageUrl = input.imageUrl;
      await updateDoc(participantDoc(input.userId), payload);
    },

    async deleteParticipant(userId) {
      await deleteDoc(participantDoc(userId));
    },

    async addRun(userId, miles, runDate) {
      await addDoc(runsCollection(), {
        userId,
        miles,
        runDate,
        createdAtMs: Date.now(),
      } satisfies ChapterRunDoc);
    },

    async deleteRun(runId) {
      await deleteDoc(runDoc(runId));
    },

    async resetChapter() {
      const snapshot = await getDocs(runsCollection());
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    },

    subscribeToChapter({ onParticipants, onRuns, onSyncState }) {
      const unsubscribeParticipants = onSnapshot(
        participantsCollection(),
        (snapshot) => {
          const participants: Runner[] = snapshot.docs.map((d) => {
            const data = d.data() as ParticipantDoc;
            const runner: Runner = {
              id: d.id,
              name: data.displayName || "Unnamed Runner",
              characterKey: data.characterKey || defaultCharacterKey,
              goalMiles: Number(data.goalMiles) || defaultParticipantGoal,
              createdAtMs: Number(data.createdAtMs) || Date.now(),
            };
            if (data.imageUrl) runner.imageUrl = data.imageUrl;
            return runner;
          });
          onParticipants(participants);
          onSyncState({ message: connectedMessage, status: "connected" });
        },
        (error) => {
          console.error(error);
          onSyncState({
            message: "Participant sync failed. Check Firestore rules.",
            status: "error",
          });
        },
      );

      const unsubscribeRuns = onSnapshot(
        runsCollection(),
        (snapshot) => {
          const runs: Run[] = snapshot.docs.map((d) => {
            const data = d.data() as ChapterRunDoc & {
              runner?: string;
              runnerId?: string;
              createdAtIso?: string;
            };
            let userId = data.userId || data.runnerId || "";
            if (!userId && data.runner && legacyParticipantIdMap?.[data.runner]) {
              userId = legacyParticipantIdMap[data.runner];
            }
            return {
              id: d.id,
              runnerId: userId,
              miles: Number(data.miles) || 0,
              runDate:
                data.runDate || data.createdAtIso?.slice(0, 10) || todayIsoDate(),
              createdAtMs: Number(data.createdAtMs) || Date.now(),
            };
          });
          onRuns(runs);
          onSyncState({ message: connectedMessage, status: "connected" });
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
        unsubscribeParticipants();
        unsubscribeRuns();
      };
    },
  };
}
