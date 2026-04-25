import { useEffect, useRef } from "react";
import { combinedMiles, totalGoalMiles } from "../lib/selectors";
import { useQuestStore } from "../store/questStore";

export function useEndingSync() {
  const runners = useQuestStore((s) => s.runners);
  const runs = useQuestStore((s) => s.runs);
  const devMode = useQuestStore((s) => s.devMode);
  const endingModal = useQuestStore((s) => s.modals.ending);
  const openEnding = useQuestStore((s) => s.openEndingModal);
  const closeEnding = useQuestStore((s) => s.closeEndingModal);

  const shownForGoalKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const goal = totalGoalMiles({ runners, runs });
    const complete = goal > 0 && combinedMiles({ runners, runs }) >= goal;
    const goalKey = String(goal);

    if (!complete) {
      shownForGoalKeyRef.current = null;
    }

    // Bennett's refinement: dev mode opens preview when forced or not complete.
    if (devMode && !complete) {
      if (!endingModal) openEnding(false);
      return;
    }

    if (!devMode && endingModal && !complete) {
      closeEnding();
      return;
    }

    if (complete && shownForGoalKeyRef.current !== goalKey) {
      shownForGoalKeyRef.current = goalKey;
      openEnding(true);
    }
  }, [runners, runs, devMode, endingModal, openEnding, closeEnding]);
}
