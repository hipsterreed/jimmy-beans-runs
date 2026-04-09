import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
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
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";

const QUEST_ID = "april-quest";
const DEFAULT_RUNNER_GOAL = 30;
const MILESTONE_STEP = 5;

const CHARACTER_OPTIONS = [
  { key: "sam", label: "Samwise", flavor: "Second breakfast loyalist. Keeps the whole squad moving.", accent: "warm" },
  { key: "frodo", label: "Frodo", flavor: "Quiet grit. Carries the burden and still gets the miles in.", accent: "green" },
  { key: "aragorn", label: "Aragorn", flavor: "Strider miles. Ranger pace. Zero fear of elevation.", accent: "steel" },
  { key: "gimli", label: "Gimli", flavor: "Short stride, huge engine, absolutely thrives on stubborn climbs.", accent: "bark" },
  { key: "legolas", label: "Legolas", flavor: "Light feet, elite cadence, suspiciously fresh after long runs.", accent: "leaf" },
  { key: "gandalf", label: "Gandalf", flavor: "Shows up late, drops a huge effort, vanishes mysteriously.", accent: "mist" },
  { key: "eowyn", label: "Eowyn", flavor: "Unbothered by doubt. Absolutely dusts the Witch-king split.", accent: "rose" },
  { key: "merry", label: "Merry", flavor: "Underrated pace merchant. Quietly stacks consistent miles.", accent: "warm" },
  { key: "pippin", label: "Pippin", flavor: "Chaotic training plan, but somehow still gets it done.", accent: "sun" },
  { key: "sauron", label: "Sauron", flavor: "Big eye on the leaderboard. Dramatic and impossible to ignore.", accent: "ember" },
  { key: "tom-bombadil", label: "Tom Bombadil", flavor: "Chaotic woodland energy. Runs for the vibes alone.", accent: "sun" },
  { key: "treebeard", label: "Treebeard", flavor: "Slow to start, impossible to stop once moving.", accent: "bark" },
  { key: "gollum", label: "Gollum", flavor: "Questionable form. Exceptional obsession with the finish.", accent: "swamp" },
  { key: "balrog", label: "Balrog", flavor: "Hot pace, dramatic entrances, absolutely no chill.", accent: "ember" },
];

const DEFAULT_RUNNERS = [
  { id: "runner-sam", name: "Hipster Sam", characterKey: "sam", goalMiles: 30, createdAtMs: 1 },
  { id: "runner-frodo", name: "Frodo Bean", characterKey: "frodo", goalMiles: 30, createdAtMs: 2 },
];

const CUSTOM_RUNNER_IMAGES = {
  "runner-sam": "./assets/hipster_sam.jpg",
  "frodo bean": "./assets/frodo_bean.JPG",
  breezy: "./assets/breezy.JPG",
  "con bombadil": "./assets/con_bombadil.JPG",
  "tanner the treacherous": "./assets/tanner_the_treacherous.JPG",
  mason: "./assets/mason.JPG",
};

const MISSION_COPY = [
  { title: "Leave the Shire", description: "Breakfast complete. The quest is officially on." },
  { title: "Bree Bound", description: "Pints avoided. The road is already looking stronger." },
  { title: "Rivendell Rally", description: "Council approved. Mileage diplomacy succeeds." },
  { title: "Moria Miles", description: "Dark patch crossed. Legs still moving." },
  { title: "Lothlorien Lift", description: "Recovery glow. Form looks elven." },
  { title: "Rohan Run Club", description: "Open-country miles. Turnover is sharp." },
  { title: "Gondor Calls", description: "The beacon is lit. No excuses now." },
  { title: "Morgul March", description: "Hostile road. Discipline wins." },
  { title: "Cirith Ungol", description: "Climbing section. Grit over comfort." },
  { title: "Gorgoroth Grind", description: "Ash in the air. Finish line ahead." },
];

const elements = {
  totalMiles: document.getElementById("totalMiles"),
  goalMiles: document.getElementById("goalMiles"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  ringToken: document.getElementById("ringToken"),
  ringText: document.getElementById("ringText"),
  missions: document.getElementById("missions"),
  runnerGrid: document.getElementById("runnerGrid"),
  runnerCardTemplate: document.getElementById("runnerCardTemplate"),
  logItemTemplate: document.getElementById("logItemTemplate"),
  syncBanner: document.getElementById("syncBanner"),
  syncMessage: document.getElementById("syncMessage"),
  setupPanel: document.getElementById("setupPanel"),
  addRunnerButton: document.getElementById("addRunnerButton"),
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
};

const state = {
  runners: [],
  runs: [],
};

let runnerModalMode = "create";

function hasFirebaseConfig() {
  return Object.values(FIREBASE_CONFIG).every(
    (value) => typeof value === "string" && value.length > 0 && !value.startsWith("YOUR_"),
  );
}

function runnersCollection(db) {
  return collection(db, "quests", QUEST_ID, "runners");
}

function runsCollection(db) {
  return collection(db, "quests", QUEST_ID, "runs");
}

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMiles(miles) {
  return Number(miles || 0).toFixed(1);
}

function parseDateLabel(isoDate) {
  if (!isoDate) {
    return "Unknown";
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function setSyncState(message, status) {
  elements.syncMessage.textContent = message;
  elements.syncBanner.dataset.status = status;
}

function characterFor(key) {
  return CHARACTER_OPTIONS.find((character) => character.key === key) || CHARACTER_OPTIONS[0];
}

function normalizeRunnerKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function customImageForRunner(runner) {
  return CUSTOM_RUNNER_IMAGES[runner.id] || CUSTOM_RUNNER_IMAGES[normalizeRunnerKey(runner.name)] || null;
}

function runnerRuns(runnerId) {
  return state.runs.filter((run) => run.runnerId === runnerId);
}

function totalMilesForRunner(runnerId) {
  return runnerRuns(runnerId).reduce((sum, run) => sum + run.miles, 0);
}

function totalGoalMiles() {
  return state.runners.reduce((sum, runner) => sum + runner.goalMiles, 0);
}

function combinedMiles() {
  return state.runs.reduce((sum, run) => sum + run.miles, 0);
}

function runnerNarration(runner) {
  const goal = Math.max(runner.goalMiles, 1);
  const progress = totalMilesForRunner(runner.id) / goal;

  if (progress >= 1) return "Goal cleared. Officially returning from Mordor.";
  if (progress >= 0.75) return "Final stretch. Lava glow in sight.";
  if (progress >= 0.4) return "Mid-quest form. Fellowship pace is healthy.";
  if (progress > 0) return "Early miles are on the board.";
  return "Fresh quest. No miles logged yet.";
}

function ringNarration(progressRatio, goal) {
  if (goal <= 0) return "The ring waits for the fellowship to form.";
  if (progressRatio >= 1) return "The ring is gone. Mount Doom claims another jewelry victim.";
  if (progressRatio >= 0.8) return "The lava glow is visible. Final push to the crater.";
  if (progressRatio >= 0.6) return "Mordor is near. The road looks hostile but runnable.";
  if (progressRatio >= 0.4) return "Past Rivendell. The fellowship pace is holding.";
  if (progressRatio >= 0.2) return "Beyond the Shire. Bree is in sight.";
  return "The ring has barely left the Shire.";
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

function populateCharacterOptions() {
  elements.characterSelect.innerHTML = "";

  CHARACTER_OPTIONS.forEach((character) => {
    const option = document.createElement("option");
    option.value = character.key;
    option.textContent = `${character.label} - ${character.flavor}`;
    elements.characterSelect.appendChild(option);
  });
}

function runnerById(runnerId) {
  return state.runners.find((runner) => runner.id === runnerId) || null;
}

function buildMissionSteps(goalMiles) {
  if (goalMiles <= 0) {
    return [];
  }

  const steps = [];
  let miles = MILESTONE_STEP;
  let index = 0;

  while (miles < goalMiles) {
    const copy = MISSION_COPY[index % MISSION_COPY.length];
    steps.push({
      miles,
      title: copy.title,
      description: copy.description,
    });
    miles += MILESTONE_STEP;
    index += 1;
  }

  steps.push({
    miles: goalMiles,
    title: "Mount Doom",
    description: "Quest complete. The fellowship reached the fire.",
  });

  return steps;
}

function renderRunnerCards() {
  elements.runnerGrid.innerHTML = "";

  if (state.runners.length === 0) {
    const emptyCard = document.createElement("article");
    emptyCard.className = "character-card empty-card";
    emptyCard.innerHTML = `
      <p class="eyebrow">No Runners Yet</p>
      <h2>Start the fellowship</h2>
      <p class="supporting">Add a runner, pick a character, and set the first monthly goal.</p>
    `;
    elements.runnerGrid.appendChild(emptyCard);
    return;
  }

  const orderedRunners = [...state.runners].sort((a, b) => a.createdAtMs - b.createdAtMs);

  orderedRunners.forEach((runner, index) => {
    const character = characterFor(runner.characterKey);
    const miles = totalMilesForRunner(runner.id);
    const entries = runnerRuns(runner.id)
      .slice()
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
    const card = elements.runnerCardTemplate.content.firstElementChild.cloneNode(true);
    const sprite = card.querySelector(".sprite");
    const roleLabel = card.querySelector(".runner-role");
    const nameLabel = card.querySelector(".runner-name");
    const flavorLabel = card.querySelector(".runner-flavor");
    const mileValue = card.querySelector(".runner-mile-value");
    const goalValue = card.querySelector(".runner-goal-value");
    const entryCount = card.querySelector(".runner-entry-count");
    const form = card.querySelector(".mile-form");
    const runDateInput = form.elements.runDate;
    const log = card.querySelector(".run-log");
    const editRunnerButton = card.querySelector(".edit-runner-button");

    card.dataset.character = character.accent;
    card.dataset.runnerId = runner.id;
    const customImage = customImageForRunner(runner);
    if (customImage) {
      sprite.classList.add("sprite-photo");
      sprite.style.backgroundImage = `url("${customImage}")`;
    } else {
      sprite.classList.add(`sprite-${character.key}`);
    }
    roleLabel.textContent = `Runner ${index + 1} · ${character.label}`;
    nameLabel.textContent = runner.name;
    flavorLabel.textContent = character.flavor;
    mileValue.textContent = formatMiles(miles);
    goalValue.textContent = String(runner.goalMiles);
    entryCount.textContent = String(entries.length);
    form.dataset.runnerId = runner.id;
    runDateInput.value = todayIsoDate();
    editRunnerButton.dataset.runnerId = runner.id;

    const summaryItem = document.createElement("li");
    summaryItem.className = "log-item summary-item";
    summaryItem.innerHTML = `<span class="log-miles">Quest Mood</span><span class="log-date">${runnerNarration(runner)}</span>`;
    log.appendChild(summaryItem);

    entries.forEach((entry) => {
      const item = elements.logItemTemplate.content.firstElementChild.cloneNode(true);
      item.querySelector(".log-miles").textContent = `${formatMiles(entry.miles)} mi`;
      item.querySelector(".log-date").textContent = parseDateLabel(entry.runDate);
      const deleteButton = item.querySelector(".delete-run-button");
      deleteButton.dataset.runId = entry.id;
      deleteButton.textContent = "X";
      log.appendChild(item);
    });

    elements.runnerGrid.appendChild(card);
  });
}

function renderProgress() {
  const totalMiles = combinedMiles();
  const goalMiles = totalGoalMiles();
  const progressRatio = goalMiles > 0 ? Math.min(totalMiles / goalMiles, 1) : 0;
  const remaining = Math.max(goalMiles - totalMiles, 0);
  const xPosition = 8 + progressRatio * 72;
  const yLift = Math.min(progressRatio * 10, 7);

  elements.totalMiles.textContent = formatMiles(totalMiles);
  elements.goalMiles.textContent = formatMiles(goalMiles);
  elements.progressFill.style.width = `${progressRatio * 100}%`;
  elements.ringToken.style.left = `${xPosition}%`;
  elements.ringToken.style.bottom = `${16 + yLift}px`;
  elements.ringToken.style.transform = progressRatio >= 1 ? "scale(1.15) rotate(12deg)" : "none";
  elements.ringText.textContent = ringNarration(progressRatio, goalMiles);

  if (goalMiles <= 0) {
    elements.progressText.textContent = "Recruit runners to begin the quest.";
  } else if (remaining > 0) {
    elements.progressText.textContent = `${formatMiles(remaining)} miles to Mount Doom`;
  } else {
    elements.progressText.textContent = "Quest complete. The fellowship reached Mount Doom.";
  }
}

function renderMissions() {
  const steps = buildMissionSteps(totalGoalMiles());
  const totalMiles = combinedMiles();

  elements.missions.innerHTML = "";

  if (steps.length === 0) {
    const empty = document.createElement("article");
    empty.className = "mission-card unlocked";
    empty.innerHTML = "<h3>Waiting On The Fellowship</h3><p>Add a runner to generate the quest path.</p>";
    elements.missions.appendChild(empty);
    return;
  }

  steps.forEach((step) => {
    const card = document.createElement("article");
    card.className = "mission-card";

    if (totalMiles >= step.miles) {
      card.classList.add("unlocked");
    }

    const title = document.createElement("h3");
    title.textContent = `${formatMiles(step.miles)} Miles`;

    const body = document.createElement("p");
    body.textContent = totalMiles >= step.miles
      ? `${step.title}: ${step.description}`
      : `Locked until mile ${formatMiles(step.miles)}.`;

    card.append(title, body);
    elements.missions.appendChild(card);
  });
}

function render() {
  renderRunnerCards();
  renderProgress();
  renderMissions();
}

async function ensureDefaultRunners(db) {
  const snapshot = await getDocs(runnersCollection(db));
  if (!snapshot.empty) {
    return;
  }

  await Promise.all(
    DEFAULT_RUNNERS.map((runner) =>
      setDoc(doc(db, "quests", QUEST_ID, "runners", runner.id), {
        name: runner.name,
        characterKey: runner.characterKey,
        goalMiles: runner.goalMiles,
        createdAtMs: runner.createdAtMs,
      }),
    ),
  );
}

async function addRunner(db, runner) {
  await addDoc(runnersCollection(db), {
    name: runner.name,
    characterKey: runner.characterKey,
    goalMiles: runner.goalMiles,
    createdAtMs: Date.now(),
  });
}

async function updateRunner(db, runner) {
  await updateDoc(doc(db, "quests", QUEST_ID, "runners", runner.id), {
    name: runner.name,
    characterKey: runner.characterKey,
    goalMiles: runner.goalMiles,
  });
}

async function addRun(db, runnerId, miles, runDate) {
  await addDoc(runsCollection(db), {
    runnerId,
    miles,
    runDate,
    createdAtMs: Date.now(),
  });
}

async function deleteRun(db, runId) {
  await deleteDoc(doc(db, "quests", QUEST_ID, "runs", runId));
}

async function resetQuest(db) {
  const snapshot = await getDocs(runsCollection(db));
  await Promise.all(snapshot.docs.map((runDoc) => deleteDoc(runDoc.ref)));
}

function subscribeToQuest(db) {
  onSnapshot(
    runnersCollection(db),
    (snapshot) => {
      state.runners = snapshot.docs.map((runnerDoc) => {
        const data = runnerDoc.data();
        return {
          id: runnerDoc.id,
          name: data.name || "Unnamed Runner",
          characterKey: data.characterKey || "sam",
          goalMiles: Number(data.goalMiles) || DEFAULT_RUNNER_GOAL,
          createdAtMs: Number(data.createdAtMs) || Date.now(),
        };
      });

      render();
      setSyncState("Live sync active. The fellowship ledger is shared.", "connected");
    },
    (error) => {
      console.error(error);
      setSyncState("Runner sync failed. Check Firestore rules.", "error");
    },
  );

  onSnapshot(
    runsCollection(db),
    (snapshot) => {
      state.runs = snapshot.docs.map((runDoc) => {
        const data = runDoc.data();
        let runnerId = data.runnerId;

        if (!runnerId && data.runner === "sam") {
          runnerId = "runner-sam";
        }

        if (!runnerId && data.runner === "frodo") {
          runnerId = "runner-frodo";
        }

        return {
          id: runDoc.id,
          runnerId,
          miles: Number(data.miles) || 0,
          runDate: data.runDate || data.createdAtIso?.slice(0, 10) || todayIsoDate(),
          createdAtMs: Number(data.createdAtMs) || Date.now(),
        };
      });

      render();
      setSyncState("Live sync active. The fellowship ledger is shared.", "connected");
    },
    (error) => {
      console.error(error);
      setSyncState("Run sync failed. Check Firestore rules.", "error");
    },
  );
}

function bindModalClose() {
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
}

function bindUi(db) {
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
}

async function init() {
  populateCharacterOptions();
  render();

  if (!hasFirebaseConfig()) {
    elements.setupPanel.hidden = false;
    setSyncState("Firebase config missing. Fill in firebase-config.js.", "error");
    return;
  }

  const app = initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);

  bindUi(db);
  subscribeToQuest(db);

  try {
    await ensureDefaultRunners(db);
  } catch (error) {
    console.error(error);
    setSyncState("Could not bootstrap default runners. Check Firestore rules.", "error");
  }
}

init();
