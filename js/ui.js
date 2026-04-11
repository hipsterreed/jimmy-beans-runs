import { CHARACTER_OPTIONS, CELEBRATION_MESSAGES, DEFAULT_RUNNER_GOAL } from "./data.js";
import { runnerById } from "./state.js";
import { todayIsoDate } from "./utils.js";
import { addRunner, updateRunner, addRun, deleteRun, resetQuest } from "./firebase.js";

const elements = {
  setupPanel: document.getElementById("setupPanel"),
  addRunnerButton: document.getElementById("addRunnerButton"),
  runnerGrid: document.getElementById("runnerGrid"),
  runnerModal: document.getElementById("runnerModal"),
  runnerForm: document.getElementById("runnerForm"),
  runnerId: document.getElementById("runnerId"),
  runnerName: document.getElementById("runnerName"),
  characterSelect: document.getElementById("characterSelect"),
  runnerGoal: document.getElementById("runnerGoal"),
  runnerModalEyebrow: document.getElementById("runnerModalEyebrow"),
  cancelRunnerButton: document.getElementById("cancelRunnerButton"),
  saveRunnerButton: document.getElementById("saveRunnerButton"),
  resetButton: document.getElementById("resetButton"),
  resetModal: document.getElementById("resetModal"),
  cancelResetButton: document.getElementById("cancelResetButton"),
  confirmResetButton: document.getElementById("confirmResetButton"),
  celebrationModal: document.getElementById("celebrationModal"),
  celebrationMessage: document.getElementById("celebrationMessage"),
  closeCelebrationButton: document.getElementById("closeCelebrationButton"),
};

let runnerModalMode = "create";

export function setSyncState(_message, _status) {
  // sync banner removed from UI
}

export function hasFirebaseConfig(config) {
  return Object.values(config).every(
    (value) => typeof value === "string" && value.length > 0 && !value.startsWith("YOUR_"),
  );
}

export function populateCharacterOptions() {
  elements.characterSelect.innerHTML = "";

  CHARACTER_OPTIONS.forEach((character) => {
    const option = document.createElement("option");
    option.value = character.key;
    option.textContent = `${character.label} - ${character.flavor}`;
    elements.characterSelect.appendChild(option);
  });
}

function openModal(modalElement, focusElement) {
  modalElement.classList.add("is-open");
  if (focusElement) {
    focusElement.focus();
  }
}

function closeModal(modalElement, focusElement) {
  modalElement.classList.remove("is-open");
  if (focusElement) {
    focusElement.focus();
  }
}

function randomCelebrationMessage() {
  return CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
}

function openCelebration(runnerName, miles) {
  elements.celebrationMessage.textContent = `${runnerName} logged ${miles.toFixed(1)} miles. ${randomCelebrationMessage()}`;
  openModal(elements.celebrationModal, elements.closeCelebrationButton);

  if (window.Tenor?.render) {
    window.Tenor.render();
  }
}

export function bindModalClose() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (elements.runnerModal.classList.contains("is-open")) {
      closeModal(elements.runnerModal, elements.addRunnerButton);
    }

    if (elements.resetModal.classList.contains("is-open")) {
      closeModal(elements.resetModal, elements.resetButton);
    }

    if (elements.celebrationModal.classList.contains("is-open")) {
      closeModal(elements.celebrationModal, elements.addRunnerButton);
    }
  });

  elements.runnerModal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-runner")) {
      closeModal(elements.runnerModal, elements.addRunnerButton);
    }
  });

  elements.resetModal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-reset")) {
      closeModal(elements.resetModal, elements.resetButton);
    }
  });

  elements.celebrationModal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-celebration")) {
      closeModal(elements.celebrationModal, elements.addRunnerButton);
    }
  });
}

export function bindUi(db) {
  elements.addRunnerButton.addEventListener("click", () => {
    runnerModalMode = "create";
    elements.runnerForm.reset();
    elements.runnerId.value = "";
    elements.runnerGoal.value = String(DEFAULT_RUNNER_GOAL);
    elements.runnerModalEyebrow.textContent = "New Fellowship Member";
    document.getElementById("runnerTitle").textContent = "Add a runner to the quest";
    elements.saveRunnerButton.textContent = "Add To Fellowship";
    openModal(elements.runnerModal, elements.runnerName);
  });

  elements.cancelRunnerButton.addEventListener("click", () => {
    closeModal(elements.runnerModal, elements.addRunnerButton);
  });

  elements.runnerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const runnerId = elements.runnerId.value;
    const name = elements.runnerName.value.trim();
    const characterKey = elements.characterSelect.value;
    const goalMiles = Number.parseInt(elements.runnerGoal.value, 10);

    if (!name || !Number.isFinite(goalMiles) || goalMiles <= 0) {
      return;
    }

    elements.saveRunnerButton.disabled = true;
    setSyncState(
      runnerModalMode === "edit" ? "Updating fellowship member..." : "Adding a new fellowship member...",
      "loading",
    );

    try {
      if (runnerModalMode === "edit" && runnerId) {
        await updateRunner(db, { id: runnerId, name, characterKey, goalMiles });
      } else {
        await addRunner(db, { name, characterKey, goalMiles });
      }
      closeModal(elements.runnerModal, elements.addRunnerButton);
    } catch (error) {
      console.error(error);
      setSyncState("Could not save runner changes. Check Firestore rules.", "error");
    } finally {
      elements.saveRunnerButton.disabled = false;
    }
  });

  elements.runnerGrid.addEventListener("click", async (event) => {
    const editButton = event.target.closest(".edit-runner-button");
    const deleteRunButton = event.target.closest(".delete-run-button");

    if (editButton) {
      const runner = runnerById(editButton.dataset.runnerId);
      if (!runner) {
        return;
      }

      runnerModalMode = "edit";
      elements.runnerId.value = runner.id;
      elements.runnerName.value = runner.name;
      elements.characterSelect.value = runner.characterKey;
      elements.runnerGoal.value = String(runner.goalMiles);
      elements.runnerModalEyebrow.textContent = "Edit Fellowship Member";
      document.getElementById("runnerTitle").textContent = "Update this runner";
      elements.saveRunnerButton.textContent = "Save Changes";
      openModal(elements.runnerModal, elements.runnerName);
      return;
    }

    if (deleteRunButton) {
      const runId = deleteRunButton.dataset.runId;
      if (!runId) {
        return;
      }

      deleteRunButton.disabled = true;
      setSyncState("Removing logged run...", "loading");

      try {
        await deleteRun(db, runId);
      } catch (error) {
        console.error(error);
        setSyncState("Could not remove run. Check Firestore rules.", "error");
      } finally {
        deleteRunButton.disabled = false;
      }
    }
  });

  elements.runnerGrid.addEventListener("submit", async (event) => {
    const form = event.target.closest(".mile-form");
    if (!form) {
      return;
    }

    event.preventDefault();

    const miles = Number.parseFloat(form.elements.miles.value);
    const runDate = form.elements.runDate.value || todayIsoDate();
    const runnerId = form.dataset.runnerId;
    const runner = runnerById(runnerId);

    if (!runnerId || !Number.isFinite(miles) || miles <= 0) {
      return;
    }

    const submitButton = form.querySelector("button");
    submitButton.disabled = true;
    setSyncState("Writing to the fellowship ledger...", "loading");

    try {
      await addRun(db, runnerId, miles, runDate);
      form.reset();
      form.elements.runDate.value = todayIsoDate();
      openCelebration(runner?.name || "A fellowship member", miles);
    } catch (error) {
      console.error(error);
      setSyncState("Could not log miles. Check Firestore rules.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  elements.resetButton.addEventListener("click", () => {
    openModal(elements.resetModal, elements.confirmResetButton);
  });

  elements.cancelResetButton.addEventListener("click", () => {
    closeModal(elements.resetModal, elements.resetButton);
  });

  elements.closeCelebrationButton.addEventListener("click", () => {
    closeModal(elements.celebrationModal, elements.addRunnerButton);
  });

  elements.confirmResetButton.addEventListener("click", async () => {
    elements.confirmResetButton.disabled = true;
    elements.cancelResetButton.disabled = true;
    setSyncState("Clearing the shared quest log...", "loading");

    try {
      await resetQuest(db);
      closeModal(elements.resetModal, elements.resetButton);
    } catch (error) {
      console.error(error);
      setSyncState("Could not reset the quest. Check Firestore rules.", "error");
    } finally {
      elements.confirmResetButton.disabled = false;
      elements.cancelResetButton.disabled = false;
    }
  });

  bindModalClose();

  return elements.setupPanel;
}
