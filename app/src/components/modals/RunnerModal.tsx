import { useEffect, useState } from "react";
import { CHARACTER_OPTIONS, DEFAULT_RUNNER_GOAL } from "../../lib/data";
import { addRunner, updateRunner } from "../../lib/firebase";
import { runnerById } from "../../lib/selectors";
import { useQuestStore } from "../../store/questStore";
import { ModalShell } from "./ModalShell";

export function RunnerModal() {
  const modal = useQuestStore((s) => s.modals.runner);
  const close = useQuestStore((s) => s.closeRunnerModal);
  const setSyncState = useQuestStore((s) => s.setSyncState);
  const runners = useQuestStore((s) => s.runners);
  const runs = useQuestStore((s) => s.runs);

  const open = modal !== null;
  const isEdit = modal?.mode === "edit";
  const editingRunner = modal?.runnerId ? runnerById({ runners, runs }, modal.runnerId) : null;

  const [name, setName] = useState("");
  const [characterKey, setCharacterKey] = useState<string>(CHARACTER_OPTIONS[0].key);
  const [goalMiles, setGoalMiles] = useState<string>(String(DEFAULT_RUNNER_GOAL));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit && editingRunner) {
      setName(editingRunner.name);
      setCharacterKey(editingRunner.characterKey);
      setGoalMiles(String(editingRunner.goalMiles));
    } else {
      setName("");
      setCharacterKey(CHARACTER_OPTIONS[0].key);
      setGoalMiles(String(DEFAULT_RUNNER_GOAL));
    }
  }, [open, isEdit, editingRunner]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const goalNumber = Number.parseInt(goalMiles, 10);
    if (!trimmed || !Number.isFinite(goalNumber) || goalNumber <= 0) return;

    setSubmitting(true);
    setSyncState({
      message: isEdit ? "Updating fellowship member..." : "Adding a new fellowship member...",
      status: "loading",
    });
    try {
      if (isEdit && editingRunner) {
        await updateRunner({ id: editingRunner.id, name: trimmed, characterKey, goalMiles: goalNumber });
      } else {
        await addRunner({ name: trimmed, characterKey, goalMiles: goalNumber });
      }
      close();
    } catch (error) {
      console.error(error);
      setSyncState({
        message: "Could not save runner changes. Check Firestore rules.",
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
      ariaLabelledBy="runnerTitle"
      ariaDescribedBy="runnerDescription"
    >
      <p id="runnerModalEyebrow" className="eyebrow">
        {isEdit ? "Edit Fellowship Member" : "New Fellowship Member"}
      </p>
      <h2 id="runnerTitle">{isEdit ? "Update this runner" : "Add a runner to the quest"}</h2>
      <p id="runnerDescription" className="supporting">
        Pick a name, claim a character, and set the number of miles this runner wants to conquer this month.
      </p>

      <form id="runnerForm" className="stack-form" onSubmit={handleSubmit}>
        <label htmlFor="runnerName">Runner name</label>
        <input
          id="runnerName"
          name="runnerName"
          type="text"
          maxLength={24}
          placeholder="Merry Miles"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <label htmlFor="characterSelect">Character</label>
        <select
          id="characterSelect"
          name="characterKey"
          required
          value={characterKey}
          onChange={(event) => setCharacterKey(event.target.value)}
        >
          {CHARACTER_OPTIONS.map((character) => (
            <option key={character.key} value={character.key}>
              {character.label}
            </option>
          ))}
        </select>

        <label htmlFor="runnerGoal">Monthly goal (miles)</label>
        <input
          id="runnerGoal"
          name="goalMiles"
          type="number"
          min="1"
          step="1"
          required
          value={goalMiles}
          onChange={(event) => setGoalMiles(event.target.value)}
        />

        <div className="modal-actions">
          <button id="cancelRunnerButton" type="button" className="ghost-button" onClick={close}>
            Cancel
          </button>
          <button id="saveRunnerButton" type="submit" disabled={submitting}>
            {isEdit ? "Save Changes" : "Add To Fellowship"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
