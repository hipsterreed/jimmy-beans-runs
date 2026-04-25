import { useEffect } from "react";
import { ensureDefaultRunners, subscribeToQuest } from "../lib/firebase";
import { hasFirebaseConfig } from "../lib/firebaseConfig";
import { useQuestStore } from "../store/questStore";

export function useFirestoreQuest(): { configured: boolean } {
  const setRunners = useQuestStore((s) => s.setRunners);
  const setRuns = useQuestStore((s) => s.setRuns);
  const setSyncState = useQuestStore((s) => s.setSyncState);

  const configured = hasFirebaseConfig();

  useEffect(() => {
    if (!configured) {
      setSyncState({
        message: "Firebase config missing. Set VITE_FIREBASE_* env vars.",
        status: "error",
      });
      return;
    }

    const unsubscribe = subscribeToQuest({
      onRunners: setRunners,
      onRuns: setRuns,
      onSyncState: setSyncState,
    });

    ensureDefaultRunners().catch((error) => {
      console.error(error);
      setSyncState({
        message: "Could not bootstrap default runners. Check Firestore rules.",
        status: "error",
      });
    });

    return unsubscribe;
  }, [configured, setRunners, setRuns, setSyncState]);

  return { configured };
}
