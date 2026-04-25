import { useState } from "react";
import { deleteRun } from "../../lib/firebase";
import { useQuestStore } from "../../store/questStore";
import { ModalShell } from "./ModalShell";

export function DeleteRunModal() {
  const modal = useQuestStore((s) => s.modals.deleteRun);
  const close = useQuestStore((s) => s.closeDeleteRunModal);
  const [submitting, setSubmitting] = useState(false);

  const open = modal !== null;

  async function handleConfirm() {
    if (!modal) return;
    setSubmitting(true);
    try {
      await deleteRun(modal.runId);
      close();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={close}
      ariaLabelledBy="deleteRunTitle"
      ariaDescribedBy="deleteRunDescription"
    >
      <p className="eyebrow">Remove Entry</p>
      <h2 id="deleteRunTitle">Delete this run?</h2>
      <p id="deleteRunDescription" className="supporting">
        {modal ? `${modal.miles.toFixed(1)} mi on ${modal.date}` : ""}
      </p>
      <div className="modal-actions">
        <button id="cancelDeleteRunButton" type="button" className="ghost-button" onClick={close}>
          Keep It
        </button>
        <button
          id="confirmDeleteRunButton"
          type="button"
          className="reset-button"
          onClick={handleConfirm}
          disabled={submitting}
        >
          Delete Run
        </button>
      </div>
    </ModalShell>
  );
}
