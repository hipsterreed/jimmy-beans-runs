import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  getFirestore,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";

const GOAL_MILES = 60;
const RUNNER_GOAL_MILES = 30;
const QUEST_ID = "april-quest";

const missions = [
  { miles: 5, title: "Leave the Shire", description: "Breakfast complete. The quest is officially on." },
  { miles: 10, title: "Bree Bound", description: "Pints avoided. Strider energy unlocked." },
  { miles: 15, title: "Rivendell Rally", description: "Elrond approves this cardio block." },
  { miles: 20, title: "Mines of Moria", description: "Legs heavy. Fellowship still moving." },
  { miles: 25, title: "Shelob Split", description: "Dark miles behind you. Keep the ring steady." },
  { miles: 30, title: "Anduin Push", description: "Halfway there. The ring is getting restless." },
  { miles: 35, title: "Rohan Run Club", description: "Horse-lord cardio. Strong turnover on open ground." },
  { miles: 40, title: "Gondor Calls", description: "The beacon is lit. No skipping recovery now." },
  { miles: 45, title: "Morgul March", description: "The miles feel cursed, but the quest moves on." },
  { miles: 50, title: "Cirith Ungol", description: "Steep section. Grit beats comfort from here." },
  { miles: 55, title: "Across Gorgoroth", description: "Ash in the air. Finish line in sight." },
  { miles: 60, title: "Mount Doom", description: "Ring destroyed. Both hobbits clear 30. April conquered." },
];

const defaultState = {
  sam: [],
  frodo: [],
};

const elements = {
  totalMiles: document.getElementById("totalMiles"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  ringToken: document.getElementById("ringToken"),
  ringText: document.getElementById("ringText"),
  missions: document.getElementById("missions"),
  resetButton: document.getElementById("resetButton"),
  samMiles: document.getElementById("samMiles"),
  samEntries: document.getElementById("samEntries"),
  frodoMiles: document.getElementById("frodoMiles"),
  frodoEntries: document.getElementById("frodoEntries"),
  samLog: document.getElementById("samLog"),
  frodoLog: document.getElementById("frodoLog"),
  logItemTemplate: document.getElementById("logItemTemplate"),
  syncBanner: document.getElementById("syncBanner"),
  syncMessage: document.getElementById("syncMessage"),
  setupPanel: document.getElementById("setupPanel"),
};

let state = structuredClone(defaultState);

function hasFirebaseConfig() {
  return Object.values(FIREBASE_CONFIG).every(
    (value) => typeof value === "string" && value.length > 0 && !value.startsWith("YOUR_"),
  );
}

function questRunsCollection(db) {
  return collection(db, "quests", QUEST_ID, "runs");
}

function totalMilesFor(runner) {
  return state[runner].reduce((sum, entry) => sum + entry.miles, 0);
}

function combinedMiles() {
  return totalMilesFor("sam") + totalMilesFor("frodo");
}

function formatMiles(miles) {
  return miles.toFixed(1);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function ringNarration(progress) {
  if (progress >= 100) return "The ring is gone. Mount Doom claims another jewelry victim.";
  if (progress >= 80) return "The lava glow is visible. Final push to the crater.";
  if (progress >= 60) return "Mordor is near. The road looks hostile but runnable.";
  if (progress >= 40) return "Past Rivendell. The fellowship pace is holding.";
  if (progress >= 20) return "Beyond the Shire. Bree is in sight.";
  return "The ring has barely left the Shire.";
}

function runnerNarration(miles) {
  if (miles >= RUNNER_GOAL_MILES) return "30-mile quest complete.";
  if (miles >= 20) return "Closing in on the final 10.";
  if (miles >= 10) return "Strong April base is building.";
  return "Early miles are on the board.";
}

function setSyncState(message, status) {
  elements.syncMessage.textContent = message;
  elements.syncBanner.dataset.status = status;
}

function renderRunner(runner) {
  const miles = totalMilesFor(runner);
  const entries = state[runner].length;
  const milesElement = runner === "sam" ? elements.samMiles : elements.frodoMiles;
  const entriesElement = runner === "sam" ? elements.samEntries : elements.frodoEntries;
  const logElement = runner === "sam" ? elements.samLog : elements.frodoLog;

  milesElement.textContent = formatMiles(miles);
  entriesElement.textContent = String(entries);
  logElement.innerHTML = "";

  const runnerCopy = document.createElement("li");
  runnerCopy.className = "log-item summary-item";
  runnerCopy.innerHTML = `<span class="log-miles">Quest Mood</span><span class="log-date">${runnerNarration(miles)}</span>`;
  logElement.appendChild(runnerCopy);

  [...state[runner]]
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .forEach((entry) => {
      const item = elements.logItemTemplate.content.firstElementChild.cloneNode(true);
      item.querySelector(".log-miles").textContent = `${formatMiles(entry.miles)} mi`;
      item.querySelector(".log-date").textContent = formatDate(entry.createdAtIso);
      logElement.appendChild(item);
    });
}

function renderMissions(totalMiles) {
  elements.missions.innerHTML = "";

  missions.forEach((mission) => {
    const card = document.createElement("article");
    card.className = "mission-card";

    if (totalMiles >= mission.miles) {
      card.classList.add("unlocked");
    }

    const title = document.createElement("h3");
    title.textContent = `${mission.miles} Miles`;

    const body = document.createElement("p");
    body.textContent = totalMiles >= mission.miles
      ? `${mission.title}: ${mission.description}`
      : `Locked until mile ${mission.miles}.`;

    card.append(title, body);
    elements.missions.appendChild(card);
  });
}

function renderProgress() {
  const total = combinedMiles();
  const progress = Math.min((total / GOAL_MILES) * 100, 100);
  const remaining = Math.max(GOAL_MILES - total, 0);
  const xPosition = 8 + progress * 0.72;
  const yLift = Math.min(progress / 10, 7);

  elements.totalMiles.textContent = formatMiles(total);
  elements.progressFill.style.width = `${progress}%`;
  elements.progressText.textContent = remaining > 0
    ? `${formatMiles(remaining)} miles to Mount Doom`
    : "Quest complete. April belongs to the fellowship.";
  elements.ringToken.style.left = `${xPosition}%`;
  elements.ringToken.style.bottom = `${16 + yLift}px`;
  elements.ringToken.style.transform = total >= GOAL_MILES ? "scale(1.15) rotate(12deg)" : "none";
  elements.ringText.textContent = ringNarration(progress);

  renderMissions(total);
}

function render() {
  renderRunner("sam");
  renderRunner("frodo");
  renderProgress();
}

async function addMiles(db, runner, miles) {
  await addDoc(questRunsCollection(db), {
    runner,
    miles,
    createdAtIso: new Date().toISOString(),
    createdAtMs: Date.now(),
  });
}

async function resetQuest(db) {
  const snapshot = await getDocs(questRunsCollection(db));
  await Promise.all(snapshot.docs.map((runDoc) => deleteDoc(runDoc.ref)));
}

function subscribeToRuns(db) {
  return onSnapshot(
    questRunsCollection(db),
    (snapshot) => {
      state = structuredClone(defaultState);

      snapshot.forEach((runDoc) => {
        const data = runDoc.data();
        if (data.runner !== "sam" && data.runner !== "frodo") {
          return;
        }

        state[data.runner].push({
          miles: Number(data.miles) || 0,
          createdAtIso: data.createdAtIso || new Date(data.createdAtMs || Date.now()).toISOString(),
          createdAtMs: Number(data.createdAtMs) || Date.now(),
        });
      });

      render();
      setSyncState("Live sync active. The fellowship ledger is shared.", "connected");
    },
    (error) => {
      console.error(error);
      setSyncState("Firestore connection failed. Check config and rules.", "error");
    },
  );
}

function bindUi(db) {
  document.querySelectorAll(".mile-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const runner = form.dataset.runner;
      const input = form.elements.miles;
      const miles = Number.parseFloat(input.value);

      if (!Number.isFinite(miles) || miles <= 0) {
        input.focus();
        return;
      }

      form.querySelector("button").disabled = true;
      setSyncState("Writing to the fellowship ledger...", "loading");

      try {
        await addMiles(db, runner, miles);
        form.reset();
      } catch (error) {
        console.error(error);
        setSyncState("Could not log miles. Check Firestore rules.", "error");
      } finally {
        form.querySelector("button").disabled = false;
      }
    });
  });

  elements.resetButton.addEventListener("click", async () => {
    elements.resetButton.disabled = true;
    setSyncState("Clearing the shared quest log...", "loading");

    try {
      await resetQuest(db);
    } catch (error) {
      console.error(error);
      setSyncState("Could not reset the quest. Check Firestore rules.", "error");
    } finally {
      elements.resetButton.disabled = false;
    }
  });
}

function init() {
  render();

  if (!hasFirebaseConfig()) {
    elements.setupPanel.hidden = false;
    setSyncState("Firebase config missing. Fill in firebase-config.js.", "error");
    return;
  }

  const app = initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);

  bindUi(db);
  subscribeToRuns(db);
}

init();
