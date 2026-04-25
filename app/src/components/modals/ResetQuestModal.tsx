import { useState } from "react";
import { resetQuest } from "../../lib/firebase";
import { useQuestStore } from "../../store/questStore";
import { ModalShell } from "./ModalShell";

export function ResetQuestModal() {
  const open = useQuestStore((s) => s.modals.reset);
  const close = useQuestStore((s) => s.closeResetModal);
  const setSyncState = useQuestStore((s) => s.setSyncState);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    setSyncState({ message: "Clearing the shared quest log...", status: "loading" });
    try {
      await resetQuest();
      close();
    } catch (error) {
      console.error(error);
      setSyncState({
        message: "Could not reset the quest. Check Firestore rules.",
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={close}
      ariaLabelledBy="resetTitle"
      ariaDescribedBy="resetDescription"
    >
      <p className="eyebrow">Danger Zone</p>
      <h2 id="resetTitle">Reset all logged miles?</h2>
      <p id="resetDescription" className="supporting">
        This deletes every shared run entry but keeps the current fellowship roster and each runner's goal.
      </p>
      <div className="modal-actions">
        <button id="cancelResetButton" type="button" className="ghost-button" onClick={close}>
          Keep Quest
        </button>
        <button
          id="confirmResetButton"
          type="button"
          className="reset-button"
          onClick={handleConfirm}
          disabled={submitting}
        >
          Confirm Reset
        </button>
      </div>
    </ModalShell>
  );
}
