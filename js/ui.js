import { CHARACTER_OPTIONS, DEFAULT_RUNNER_GOAL, PLAYABLE_SIDE_QUESTS } from "./data.js";
import { combinedMiles, runnerById, setDevMode, state, totalGoalMiles } from "./state.js";
import { todayIsoDate } from "./utils.js";
import { addRunner, updateRunner, addRun, deleteRun, resetQuest } from "./firebase.js";
import { render } from "./render.js";
import { createHelmsDeepGame } from "./three-games.js";

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
  deleteRunModal: document.getElementById("deleteRunModal"),
  deleteRunDescription: document.getElementById("deleteRunDescription"),
  cancelDeleteRunButton: document.getElementById("cancelDeleteRunButton"),
  confirmDeleteRunButton: document.getElementById("confirmDeleteRunButton"),
  missions: document.getElementById("missions"),
  questGameModal: document.getElementById("questGameModal"),
  questGameTitle: document.getElementById("questGameTitle"),
  questGameDescription: document.getElementById("questGameDescription"),
  questGameControls: document.getElementById("questGameControls"),
  questGameObjective: document.getElementById("questGameObjective"),
  questGameStatus: document.getElementById("questGameStatus"),
  questTriviaPanel: document.getElementById("questTriviaPanel"),
  questTriviaPrompt: document.getElementById("questTriviaPrompt"),
  questTriviaOptions: document.getElementById("questTriviaOptions"),
  questGameThreeHost: document.getElementById("questGameThreeHost"),
  questGameCanvas: document.getElementById("questGameCanvas"),
  startQuestGameButton: document.getElementById("startQuestGameButton"),
  closeQuestGameButton: document.getElementById("closeQuestGameButton"),
  endingModal: document.getElementById("endingModal"),
  endingCanvas: document.getElementById("endingCanvas"),
  endingStatus: document.getElementById("endingStatus"),
  endingProgressFill: document.getElementById("endingProgressFill"),
  playEndingButton: document.getElementById("playEndingButton"),
  closeEndingButton: document.getElementById("closeEndingButton"),
  closeEndingIconButton: document.getElementById("closeEndingIconButton"),
  devModeButton: document.getElementById("devModeButton"),
};

let runnerModalMode = "create";
let questGameState = {
  activeQuestKey: null,
  activeQuest: null,
  animationFrameId: null,
  running: false,
  keys: new Set(),
  lastTick: 0,
  elapsedMs: 0,
  player: { x: 84, y: 288, width: 24, height: 24 },
  playerVy: 0,
  onGround: true,
  worldProgress: 0,
  hazards: [],
  spawnTimerMs: 0,
  laneIndex: 1,
  questData: {},
};

const QUEST_GAME_CANVAS_WIDTH = 640;
const QUEST_GAME_CANVAS_HEIGHT = 360;
const QUEST_GAME_LANES = [156, 308, 460];
const ENDING_CANVAS_WIDTH = 720;
const ENDING_CANVAS_HEIGHT = 404;
const ENDING_DURATION_MS = 12000;
const HELMS_TRIVIA_QUESTIONS = [
  {
    prompt: "Who leads the defense at Helm's Deep alongside Aragorn?",
    options: ["Eomer", "Theoden", "Faramir", "Denethor"],
    answer: "Theoden",
  },
  {
    prompt: "What explosive weapon do the Uruk-hai use at Helm's Deep?",
    options: ["Dragon fire", "Black powder bomb", "Oil catapult", "Morgul flare"],
    answer: "Black powder bomb",
  },
  {
    prompt: "Who arrives at dawn to turn the battle?",
    options: ["Gandalf", "Elrond", "Boromir", "Treebeard"],
    answer: "Gandalf",
  },
  {
    prompt: "Which people defend Helm's Deep with Rohan?",
    options: ["Dwarves", "Elves", "Hobbits", "Corsairs"],
    answer: "Elves",
  },
  {
    prompt: "What kingdom does Helm's Deep belong to?",
    options: ["Gondor", "Mordor", "Rohan", "Dale"],
    answer: "Rohan",
  },
  {
    prompt: "Who says 'So it begins' at Helm's Deep?",
    options: ["Aragorn", "Theoden", "Legolas", "Gimli"],
    answer: "Theoden",
  },
  {
    prompt: "What is the fortress also called?",
    options: ["The Hornburg", "Minas Keep", "Barad Hall", "The White Wall"],
    answer: "The Hornburg",
  },
  {
    prompt: "Who keeps count with Legolas during the battle?",
    options: ["Aragorn", "Gimli", "Haldir", "Eowyn"],
    answer: "Gimli",
  },
];

let endingVideoState = {
  animationFrameId: null,
  playing: false,
  startedAtMs: 0,
  frameMs: 0,
  shownForGoalKey: null,
};
let helmsDeepSession = null;

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

function updateDevModeButton() {
  elements.devModeButton.textContent = state.devMode ? "< DEV MODE: ON >" : "< DEV MODE >";
  elements.devModeButton.classList.toggle("is-active", state.devMode);
  elements.devModeButton.setAttribute("aria-pressed", String(state.devMode));
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

function questCanvasContext() {
  return elements.questGameCanvas?.getContext("2d");
}

function setQuestGameStatus(message) {
  elements.questGameStatus.textContent = message;
}

function setQuestTriviaState(visible, prompt = "", options = []) {
  elements.questTriviaPanel.hidden = !visible;
  elements.questTriviaPrompt.textContent = prompt;
  elements.questTriviaOptions.innerHTML = "";

  if (!visible) return;

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quest-trivia-option";
    button.textContent = option;
    button.dataset.triviaOption = option;
    elements.questTriviaOptions.appendChild(button);
  });
}

function setQuestRenderMode(mode) {
  const useThree = mode === "three";
  elements.questGameThreeHost.hidden = !useThree;
  elements.questGameCanvas.hidden = useThree;
}

function destroyExternalQuestSession() {
  if (helmsDeepSession) {
    helmsDeepSession.destroy();
    helmsDeepSession = null;
  }
}

function stopQuestGameLoop() {
  if (questGameState.animationFrameId) {
    cancelAnimationFrame(questGameState.animationFrameId);
    questGameState.animationFrameId = null;
  }
  questGameState.running = false;
  questGameState.lastTick = 0;
}

function activeQuestConfig() {
  return questGameState.activeQuestKey ? PLAYABLE_QUEST_CONFIGS[questGameState.activeQuestKey] : null;
}

function resetQuestGameModel() {
  questGameState.elapsedMs = 0;
  questGameState.spawnTimerMs = 0;
  questGameState.hazards = [];
  questGameState.player = { x: 84, y: 288, width: 24, height: 24 };
  questGameState.playerVy = 0;
  questGameState.onGround = true;
  questGameState.worldProgress = 0;
  questGameState.laneIndex = 1;
  questGameState.questData = {};
}

function drawPixelRect(ctx, x, y, width, height, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function intersectRect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function currentInput() {
  const left = questGameState.keys.has("ArrowLeft") || questGameState.keys.has("a") || questGameState.keys.has("A");
  const right = questGameState.keys.has("ArrowRight") || questGameState.keys.has("d") || questGameState.keys.has("D");
  const jump =
    questGameState.keys.has(" ") ||
    questGameState.keys.has("Space") ||
    questGameState.keys.has("Spacebar") ||
    questGameState.keys.has("ArrowUp") ||
    questGameState.keys.has("w") ||
    questGameState.keys.has("W");

  return {
    left,
    right,
    jump,
  };
}

function currentDirectionInput() {
  if (questGameState.keys.has("ArrowUp") || questGameState.keys.has("w") || questGameState.keys.has("W")) return "up";
  if (questGameState.keys.has("ArrowDown") || questGameState.keys.has("s") || questGameState.keys.has("S")) return "down";
  if (questGameState.keys.has("ArrowLeft") || questGameState.keys.has("a") || questGameState.keys.has("A")) return "left";
  if (questGameState.keys.has("ArrowRight") || questGameState.keys.has("d") || questGameState.keys.has("D")) return "right";
  return null;
}

function movePlayerHorizontal(deltaMs, speed, minX = 12, maxX = QUEST_GAME_CANVAS_WIDTH - 40) {
  const input = currentInput();
  if (input.left) {
    questGameState.player.x -= speed * deltaMs;
  }
  if (input.right) {
    questGameState.player.x += speed * deltaMs;
  }
  questGameState.player.x = Math.max(minX, Math.min(maxX, questGameState.player.x));
}

function movePlayerByLane(deltaMs, lockY) {
  const input = currentInput();
  if (input.left && questGameState.player.x > QUEST_GAME_LANES[questGameState.laneIndex] - 6) {
    questGameState.laneIndex = Math.max(0, questGameState.laneIndex - 1);
  }
  if (input.right && questGameState.player.x < QUEST_GAME_LANES[questGameState.laneIndex] + 6) {
    questGameState.laneIndex = Math.min(QUEST_GAME_LANES.length - 1, questGameState.laneIndex + 1);
  }

  const targetX = QUEST_GAME_LANES[questGameState.laneIndex];
  questGameState.player.x += (targetX - questGameState.player.x) * Math.min(1, 0.018 * deltaMs);
  questGameState.player.y = lockY;
}

function drawProgressBar(ctx, durationMs, label, color = "#d4922a") {
  const progress = Math.min(questGameState.elapsedMs / durationMs, 1);
  const progressWidth = Math.round(progress * 260);
  drawPixelRect(ctx, 18, 18, 264, 12, "#2b180f");
  drawPixelRect(ctx, 20, 20, progressWidth, 8, color);
  drawPixelRect(ctx, 20 + progressWidth, 20, Math.max(260 - progressWidth, 0), 8, "#57371a");
  ctx.fillStyle = "#fff2c7";
  ctx.font = '16px "VT323"';
  ctx.fillText(label, 518, 338);
}

function drawRatioBar(ctx, ratio, label, color = "#d4922a") {
  const clamped = Math.max(0, Math.min(ratio, 1));
  const progressWidth = Math.round(clamped * 260);
  drawPixelRect(ctx, 18, 18, 264, 12, "#2b180f");
  drawPixelRect(ctx, 20, 20, progressWidth, 8, color);
  drawPixelRect(ctx, 20 + progressWidth, 20, Math.max(260 - progressWidth, 0), 8, "#57371a");
  ctx.fillStyle = "#fff2c7";
  ctx.font = '16px "VT323"';
  ctx.fillText(label, 504, 338);
}

function drawHero(ctx, player, palette = { skin: "#f0e1bf", hair: "#6b4f2f", tunic: "#4f7a35", accent: "#e0f0ff" }) {
  drawPixelRect(ctx, player.x, player.y, player.width, player.height, palette.skin);
  drawPixelRect(ctx, player.x + 4, player.y + 4, 16, 8, palette.hair);
  drawPixelRect(ctx, player.x + 6, player.y + 12, 12, 8, palette.tunic);
  drawPixelRect(ctx, player.x + 20, player.y + 8, 8, 14, palette.accent);
}

function drawHazardBlock(ctx, hazard, palette = { outer: "#191013", inner: "#3d2736", glow: "#c51f1f" }) {
  drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, palette.outer);
  drawPixelRect(ctx, hazard.x + 4, hazard.y + 4, Math.max(hazard.width - 8, 4), Math.max(hazard.height - 10, 6), palette.inner);
  drawPixelRect(ctx, hazard.x + Math.max(Math.floor(hazard.width / 2) - 3, 1), hazard.y + hazard.height - 10, 6, 6, palette.glow);
}

function endingCanvasContext() {
  return elements.endingCanvas?.getContext("2d");
}

function setEndingStatus(message) {
  elements.endingStatus.textContent = message;
}

function setEndingProgress(progressRatio) {
  elements.endingProgressFill.style.width = `${Math.max(0, Math.min(progressRatio, 1)) * 100}%`;
}

function stopEndingPlayback() {
  if (endingVideoState.animationFrameId) {
    cancelAnimationFrame(endingVideoState.animationFrameId);
    endingVideoState.animationFrameId = null;
  }
  endingVideoState.playing = false;
  elements.playEndingButton.disabled = false;
}

function drawPixelText(ctx, text, x, y, color = "#f7e7bf") {
  ctx.fillStyle = color;
  ctx.font = '20px "VT323"';
  ctx.fillText(text, x, y);
}

function drawEndingCharacter(ctx, x, y, palette, frame = 0, facing = 1) {
  drawPixelRect(ctx, x + 6, y, 12, 10, palette.hair);
  drawPixelRect(ctx, x + 4, y + 8, 16, 14, palette.skin);
  drawPixelRect(ctx, x + 4, y + 20, 16, 16, palette.body);
  drawPixelRect(ctx, x + (facing > 0 ? 18 : 0), y + 10, 6, 10, palette.accent);
  drawPixelRect(ctx, x + 6, y + 36, 5, 10, palette.leg);
  drawPixelRect(ctx, x + 13, y + 36, 5, 10, palette.leg);
  if (frame % 2 === 0) {
    drawPixelRect(ctx, x + 2, y + 38, 4, 8, palette.leg);
    drawPixelRect(ctx, x + 18, y + 38, 4, 8, palette.leg);
  }
}

function drawMasegoth(ctx, x, y, frame = 0) {
  drawPixelRect(ctx, x + 6, y, 20, 12, "#463038");
  drawPixelRect(ctx, x + 4, y + 10, 24, 18, "#826877");
  drawPixelRect(ctx, x + 2, y + 28, 28, 20, "#5d4350");
  drawPixelRect(ctx, x, y + 18, 8, 18, "#3c2224");
  drawPixelRect(ctx, x + 24, y + 18, 8, 18, "#3c2224");
  drawPixelRect(ctx, x + 10, y + 50, 6, 12, "#3c2224");
  drawPixelRect(ctx, x + 18, y + 50, 6, 12, "#3c2224");
  drawPixelRect(ctx, x + 10, y + 8, 3, 3, "#ffd36d");
  drawPixelRect(ctx, x + 19, y + 8, 3, 3, "#ffd36d");
  if (frame % 2 === 0) {
    drawPixelRect(ctx, x + 30, y + 12, 8, 18, "#ff7a2f");
  }
}

function drawRing(ctx, x, y) {
  drawPixelRect(ctx, x, y + 2, 10, 6, "#d99f25");
  drawPixelRect(ctx, x + 2, y, 6, 2, "#ffd66a");
  drawPixelRect(ctx, x + 2, y + 8, 6, 2, "#ffd66a");
  drawPixelRect(ctx, x + 3, y + 3, 4, 4, "#2a1a10");
}

function drawLavaBurst(ctx, x, y, scale = 1) {
  drawPixelRect(ctx, x, y, 8 * scale, 14 * scale, "#ff7a2f");
  drawPixelRect(ctx, x + 2 * scale, y - 4 * scale, 4 * scale, 6 * scale, "#ffd36d");
}

function drawEndingFrame(frameMs) {
  const ctx = endingCanvasContext();
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ENDING_CANVAS_WIDTH, ENDING_CANVAS_HEIGHT);

  const beat = Math.floor(frameMs / 220);
  if (frameMs < 8600) {
    drawPixelRect(ctx, 0, 0, ENDING_CANVAS_WIDTH, 160, "#2a1712");
    drawPixelRect(ctx, 0, 160, ENDING_CANVAS_WIDTH, 244, "#1a110d");
    drawPixelRect(ctx, 0, 312, ENDING_CANVAS_WIDTH, 92, "#4a2116");
    drawPixelRect(ctx, 0, 344, ENDING_CANVAS_WIDTH, 60, "#ff7a2f");
    drawPixelRect(ctx, 70, 110, 160, 80, "#25140f");
    drawPixelRect(ctx, 510, 96, 130, 94, "#25140f");
    drawPixelRect(ctx, 308, 70, 120, 120, "#362117");
    drawPixelRect(ctx, 348, 38, 42, 40, "#26160f");
    drawPixelRect(ctx, 364, 8, 10, 36, "#ff7a2f");
    drawPixelRect(ctx, 360, 0, 18, 12, "#ffd36d");
    for (let i = 0; i < 14; i += 1) {
      drawPixelRect(ctx, 20 + i * 54, 298 + (i % 2) * 6, 28, 14, "#5f4029");
    }

    if (frameMs < 3600) {
      const walk = frameMs / 3600;
      const frodoX = 90 + walk * 230;
      const samX = 42 + walk * 220;
      drawEndingCharacter(ctx, samX, 254 + (beat % 2), { skin: "#f0dfbf", hair: "#734325", body: "#4b7a35", accent: "#c8e0f7", leg: "#5e3e24" }, beat, 1);
      drawEndingCharacter(ctx, frodoX, 248 + ((beat + 1) % 2), { skin: "#f0dfbf", hair: "#5e3a22", body: "#7684a5", accent: "#f8f1ce", leg: "#5e3e24" }, beat, 1);
      drawRing(ctx, frodoX + 24, 268);
      drawPixelText(ctx, "Mount Doom", 536, 56, "#f0c75e");
    } else if (frameMs < 6200) {
      const attack = (frameMs - 3600) / 2600;
      const frodoX = 320;
      const samX = 258;
      const maseX = 560 - attack * 180;
      const maseY = 212 - Math.sin(attack * Math.PI) * 74;
      drawEndingCharacter(ctx, samX, 255 + (beat % 2), { skin: "#f0dfbf", hair: "#734325", body: "#4b7a35", accent: "#c8e0f7", leg: "#5e3e24" }, beat, 1);
      drawEndingCharacter(ctx, frodoX, 249, { skin: "#f0dfbf", hair: "#5e3a22", body: "#7684a5", accent: "#f8f1ce", leg: "#5e3e24" }, beat, 1);
      drawRing(ctx, frodoX + 24, 268);
      drawMasegoth(ctx, maseX, maseY, beat);
      drawPixelText(ctx, "MaseGoth attacks", 26, 44, "#ffd36d");
    } else {
      const toss = (frameMs - 6200) / 2400;
      const frodoX = 330;
      const samX = 268;
      const arcX = 390 + toss * 120;
      const arcY = 224 - Math.sin(toss * Math.PI) * 102;
      drawEndingCharacter(ctx, samX, 255 + (beat % 2), { skin: "#f0dfbf", hair: "#734325", body: "#4b7a35", accent: "#c8e0f7", leg: "#5e3e24" }, beat, 1);
      drawEndingCharacter(ctx, frodoX, 248, { skin: "#f0dfbf", hair: "#5e3a22", body: "#7684a5", accent: "#f8f1ce", leg: "#5e3e24" }, beat, 1);
      drawMasegoth(ctx, arcX, arcY, beat);
      drawRing(ctx, arcX + 34, arcY + 16);
      drawLavaBurst(ctx, 548, 312 - (beat % 3) * 6, 2);
      drawPixelText(ctx, "Frodo Bean throws him in", 24, 44, "#ffd36d");
    }
  } else {
    drawPixelRect(ctx, 0, 0, ENDING_CANVAS_WIDTH, 180, "#224b2b");
    drawPixelRect(ctx, 0, 180, ENDING_CANVAS_WIDTH, 224, "#3b271b");
    drawPixelRect(ctx, 0, 322, ENDING_CANVAS_WIDTH, 82, "#6f4322");
    for (let i = 0; i < 10; i += 1) {
      drawPixelRect(ctx, 32 + i * 68, 54, 12, 110, "#2f381f");
      drawPixelRect(ctx, 12 + i * 68, 74, 52, 16, "#4b7a35");
      drawPixelRect(ctx, 8 + i * 68, 88, 60, 12, "#5d9044");
    }
    drawPixelText(ctx, "Quest complete", 28, 42, "#f0c75e");
    const crew = [
      { x: 110, body: "#4b7a35", hair: "#734325" },
      { x: 166, body: "#7684a5", hair: "#5e3a22" },
      { x: 222, body: "#6c6f78", hair: "#5e5d60" },
      { x: 278, body: "#8b6f37", hair: "#5b4221" },
      { x: 334, body: "#5a7b49", hair: "#4f3f20" },
      { x: 390, body: "#7f6ba5", hair: "#66485b" },
    ];
    crew.forEach((member, index) => {
      drawEndingCharacter(ctx, member.x, 244 + ((beat + index) % 2) * 2, { skin: "#f0dfbf", hair: member.hair, body: member.body, accent: "#f8f1ce", leg: "#5e3e24" }, beat + index, 1);
      drawPixelRect(ctx, member.x - 4, 232 - ((beat + index) % 2) * 6, 4, 20, "#f8f1ce");
      drawPixelRect(ctx, member.x + 24, 232 - ((beat + index) % 2) * 6, 4, 20, "#f8f1ce");
    });
    drawPixelRect(ctx, 574, 286, 56, 42, "#ff7a2f");
    drawPixelRect(ctx, 582, 272, 40, 20, "#ffd36d");
    drawMasegoth(ctx, 590, 208, beat);
    drawPixelRect(ctx, 604, 186 - (beat % 2) * 8, 4, 18, "#f8f1ce");
    drawPixelRect(ctx, 628, 186 - (beat % 2) * 8, 4, 18, "#f8f1ce");
    drawPixelText(ctx, "Even MaseGoth is lava-cheering", 26, 76, "#f7e7bf");
  }
}

function endingVideoTick(timestamp) {
  if (!endingVideoState.playing) return;
  if (!endingVideoState.startedAtMs) {
    endingVideoState.startedAtMs = timestamp - endingVideoState.frameMs;
  }
  endingVideoState.frameMs = Math.min(timestamp - endingVideoState.startedAtMs, ENDING_DURATION_MS);
  drawEndingFrame(endingVideoState.frameMs);
  setEndingProgress(endingVideoState.frameMs / ENDING_DURATION_MS);

  if (endingVideoState.frameMs >= ENDING_DURATION_MS) {
    stopEndingPlayback();
    elements.playEndingButton.textContent = "Replay Finale";
    setEndingStatus("Finale complete. Replay any time.");
    return;
  }

  endingVideoState.animationFrameId = requestAnimationFrame(endingVideoTick);
}

function openEndingModal(autoPlay = true) {
  drawEndingFrame(endingVideoState.frameMs);
  setEndingProgress(endingVideoState.frameMs / ENDING_DURATION_MS);
  elements.playEndingButton.textContent = endingVideoState.frameMs > 0 ? "Replay Finale" : "Play Finale";
  openModal(elements.endingModal, elements.playEndingButton);
  setEndingStatus(autoPlay ? "Playing the dev-mode finale reel." : "Ready to play the finale.");
  if (autoPlay) {
    playEndingVideo(true);
  }
}

function closeEndingModal() {
  stopEndingPlayback();
  setEndingStatus("Ready to play the finale.");
  closeModal(elements.endingModal, elements.devModeButton);
}

function playEndingVideo(restart = false) {
  if (restart) {
    endingVideoState.frameMs = 0;
    endingVideoState.startedAtMs = 0;
  }
  stopEndingPlayback();
  endingVideoState.playing = true;
  elements.playEndingButton.textContent = "Playing...";
  elements.playEndingButton.disabled = true;
  setEndingStatus("Hipster Sam and Frodo Bean carry the ring to Mount Doom.");
  endingVideoState.startedAtMs = performance.now() - endingVideoState.frameMs;
  endingVideoTick(endingVideoState.startedAtMs);
}

export function syncEndingSequence(forcePreview = false) {
  const goal = totalGoalMiles();
  const complete = goal > 0 && combinedMiles() >= goal;
  const goalKey = String(goal);

  if (!complete) {
    endingVideoState.shownForGoalKey = null;
  }

  if (state.devMode && (forcePreview || !complete)) {
    openEndingModal(false);
    return;
  }

  if (!state.devMode && elements.endingModal.classList.contains("is-open") && !complete) {
    closeEndingModal();
    return;
  }

  if (complete && endingVideoState.shownForGoalKey !== goalKey) {
    endingVideoState.shownForGoalKey = goalKey;
    endingVideoState.frameMs = 0;
    openEndingModal(true);
  }
}

function finishQuestGame(message, buttonLabel) {
  stopQuestGameLoop();
  setQuestGameStatus(message);
  setQuestTriviaState(false);
  elements.startQuestGameButton.textContent = buttonLabel;
  elements.startQuestGameButton.disabled = false;
}

function updateSurvivalQuest(deltaMs, config) {
  if (typeof config.update === "function") {
    config.update(deltaMs);
    return;
  }

  if (config.movement === "lane") {
    movePlayerByLane(deltaMs, config.playerY);
  } else {
    movePlayerHorizontal(deltaMs, config.playerSpeed, config.minX, config.maxX);
  }

  questGameState.spawnTimerMs -= deltaMs;
  if (questGameState.spawnTimerMs <= 0) {
    config.spawnHazard();
    questGameState.spawnTimerMs = randomBetween(config.spawnMinMs, config.spawnMaxMs);
  }

  questGameState.hazards.forEach((hazard) => {
    hazard.x += (hazard.vx || 0) * deltaMs;
    hazard.y += (hazard.vy || 0) * deltaMs;
  });
  questGameState.hazards = questGameState.hazards.filter(config.keepHazard);

  if (questGameState.hazards.some((hazard) => intersectRect(questGameState.player, hazard))) {
    finishQuestGame(config.failureText, "Retry Quest");
    return;
  }

  questGameState.elapsedMs += deltaMs;
  if (questGameState.elapsedMs >= config.durationMs) {
    finishQuestGame(config.successText, "Play Again");
  }
}

const FORD_MAZE = [
  "####################",
  "#........##........#",
  "#.####.#.##.#.####.#",
  "#o#....#....#....#o#",
  "#.#.##.######.##.#.#",
  "#....##......##....#",
  "###.#.###..###.#.###",
  "#...#....##....#...#",
  "#.#####.#..#.#####.#",
  "#........##........#",
  "####################",
];

const FORD_TILE = 32;
const FORD_OFFSET_X = 0;
const FORD_OFFSET_Y = 4;
const FORD_DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

function fordCellCenter(col, row) {
  return {
    x: FORD_OFFSET_X + col * FORD_TILE + FORD_TILE / 2,
    y: FORD_OFFSET_Y + row * FORD_TILE + FORD_TILE / 2,
  };
}

function fordGridPos(x, y) {
  return {
    col: Math.round((x - FORD_OFFSET_X - FORD_TILE / 2) / FORD_TILE),
    row: Math.round((y - FORD_OFFSET_Y - FORD_TILE / 2) / FORD_TILE),
  };
}

function fordMazeChar(col, row) {
  const rowText = FORD_MAZE[row];
  if (!rowText) return "#";
  return rowText[col] ?? "#";
}

function fordWalkable(col, row) {
  return fordMazeChar(col, row) !== "#";
}

function fordAligned(entity) {
  const { x, y } = fordCellCenter(entity.col, entity.row);
  return Math.abs(entity.x - x) < 0.45 && Math.abs(entity.y - y) < 0.45;
}

function snapFordEntity(entity) {
  const center = fordCellCenter(entity.col, entity.row);
  entity.x = center.x;
  entity.y = center.y;
}

function makeFordGhost(col, row, direction, tint) {
  const center = fordCellCenter(col, row);
  return {
    col,
    row,
    x: center.x,
    y: center.y,
    direction,
    tint,
  };
}

function chooseFordGhostDirection(ghost, player) {
  const options = Object.entries(FORD_DIRS)
    .filter(([name, dir]) => {
      if (ghost.direction && name === oppositeDirection(ghost.direction)) return false;
      return fordWalkable(ghost.col + dir.x, ghost.row + dir.y);
    })
    .map(([name, dir]) => {
      const nextCol = ghost.col + dir.x;
      const nextRow = ghost.row + dir.y;
      const distance = Math.abs(player.col - nextCol) + Math.abs(player.row - nextRow);
      return { name, distance };
    });

  if (options.length === 0) return oppositeDirection(ghost.direction) || "left";

  if (Math.random() < 0.28) {
    return options[Math.floor(Math.random() * options.length)].name;
  }

  options.sort((a, b) => a.distance - b.distance);
  return options[0].name;
}

function oppositeDirection(direction) {
  return {
    left: "right",
    right: "left",
    up: "down",
    down: "up",
  }[direction];
}

function advanceFordEntity(entity, speed, deltaMs) {
  const dir = FORD_DIRS[entity.direction];
  if (!dir) return;

  entity.x += dir.x * speed * deltaMs;
  entity.y += dir.y * speed * deltaMs;
  const center = fordCellCenter(entity.col, entity.row);
  const reachedNext =
    (dir.x !== 0 && Math.abs(entity.x - center.x) >= FORD_TILE) ||
    (dir.y !== 0 && Math.abs(entity.y - center.y) >= FORD_TILE);

  if (!reachedNext) return;

  entity.col += dir.x;
  entity.row += dir.y;
  snapFordEntity(entity);
}

function drawFordPlayer(ctx, player) {
  const angleByDir = {
    right: 0,
    left: Math.PI,
    up: -Math.PI / 2,
    down: Math.PI / 2,
  };
  const mouth = 0.45;
  const angle = angleByDir[player.direction || "right"];
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(angle);
  ctx.fillStyle = "#f0d36f";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 12, mouth, Math.PI * 2 - mouth);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#dcefff";
  ctx.fillRect(6, -5, 10, 10);
  ctx.fillStyle = "#7c5e35";
  ctx.fillRect(8, -9, 6, 4);
  ctx.fillStyle = "#a8d0ff";
  ctx.fillRect(-12, -3, 6, 6);
  ctx.restore();
}

function drawFordGhost(ctx, ghost) {
  ctx.fillStyle = ghost.tint;
  ctx.fillRect(Math.round(ghost.x - 10), Math.round(ghost.y - 10), 20, 18);
  ctx.fillRect(Math.round(ghost.x - 8), Math.round(ghost.y + 8), 4, 6);
  ctx.fillRect(Math.round(ghost.x - 1), Math.round(ghost.y + 8), 4, 6);
  ctx.fillRect(Math.round(ghost.x + 6), Math.round(ghost.y + 8), 4, 6);
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(Math.round(ghost.x - 6), Math.round(ghost.y - 3), 4, 4);
  ctx.fillRect(Math.round(ghost.x + 2), Math.round(ghost.y - 3), 4, 4);
  ctx.fillStyle = "#161212";
  ctx.fillRect(Math.round(ghost.x - 5), Math.round(ghost.y - 2), 2, 2);
  ctx.fillRect(Math.round(ghost.x + 3), Math.round(ghost.y - 2), 2, 2);
}

function updateFordPacman(deltaMs, config) {
  const data = questGameState.questData;
  const player = data.player;
  const wantedDirection = currentDirectionInput();

  if (wantedDirection) {
    player.pendingDirection = wantedDirection;
  }

  if (fordAligned(player)) {
    snapFordEntity(player);
    if (player.pendingDirection) {
      const pending = FORD_DIRS[player.pendingDirection];
      if (fordWalkable(player.col + pending.x, player.row + pending.y)) {
        player.direction = player.pendingDirection;
      }
    }

    const forward = player.direction ? FORD_DIRS[player.direction] : null;
    if (forward && !fordWalkable(player.col + forward.x, player.row + forward.y)) {
      player.direction = null;
    }
  }

  if (player.direction) {
    advanceFordEntity(player, 0.13, deltaMs);
  }

  const pelletKey = `${player.col},${player.row}`;
  if (data.pellets.has(pelletKey)) {
    data.pellets.delete(pelletKey);
  }

  data.ghosts.forEach((ghost) => {
    if (fordAligned(ghost)) {
      snapFordEntity(ghost);
      ghost.direction = chooseFordGhostDirection(ghost, player);
    }
    advanceFordEntity(ghost, 0.105, deltaMs);
  });

  const hitGhost = data.ghosts.some((ghost) => Math.hypot(player.x - ghost.x, player.y - ghost.y) < 18);
  if (hitGhost) {
    finishQuestGame(config.failureText, "Retry Quest");
    return;
  }

  if (data.pellets.size === 0) {
    finishQuestGame(config.successText, "Play Again");
    return;
  }

  questGameState.elapsedMs += deltaMs;
}

function pickHelmsTriviaQuestion() {
  return HELMS_TRIVIA_QUESTIONS[Math.floor(Math.random() * HELMS_TRIVIA_QUESTIONS.length)];
}

function startHelmsTriviaPhase(data) {
  data.mode = "trivia";
  data.strikesRemaining = 5;
  data.activeQuestion = pickHelmsTriviaQuestion();
  setQuestGameStatus("A ladder landed. Answer correctly to cut down 5 Uruk-hai.");
  setQuestTriviaState(true, data.activeQuestion.prompt, data.activeQuestion.options);
}

function resolveHelmsTriviaAnswer(selectedOption) {
  const config = activeQuestConfig();
  const data = questGameState.questData;
  if (!config || !data || data.mode !== "trivia" || !data.activeQuestion) return;

  if (selectedOption === data.activeQuestion.answer) {
    data.strikesRemaining -= 1;
    if (data.strikesRemaining <= 0) {
      data.mode = "defense";
      data.laddersStopped += 1;
      data.activeQuestion = null;
      setQuestTriviaState(false);
      setQuestGameStatus(`You cleared the wall. ${data.laddersStopped} / ${config.targetLadders} ladders pushed off.`);
      helmsDeepSession?.clearLadderAfterTrivia();
      if (data.laddersStopped >= config.targetLadders) {
        finishQuestGame(config.successText, "Play Again");
      }
      return;
    }

    data.activeQuestion = pickHelmsTriviaQuestion();
    setQuestGameStatus(`Good hit. ${data.strikesRemaining} enemies left on the ladder.`);
    setQuestTriviaState(true, data.activeQuestion.prompt, data.activeQuestion.options);
    return;
  }

  setQuestGameStatus("Wrong answer. The attackers keep pressing the wall.");
}

function updateHelmsDeep(deltaMs, config) {
  const data = questGameState.questData;
  const input = currentInput();

  if (data.mode === "defense") {
    if (!data.ladderActive) {
      data.nextSpawnDelayMs -= deltaMs;
      if (data.nextSpawnDelayMs <= 0) {
        data.ladderLane = Math.floor(Math.random() * 3);
        data.ladderProgress = 0;
        data.ladderActive = true;
        setQuestGameStatus("Ladder incoming. Hold the wall and shove it off before it lands.");
      }
      return;
    }

    if (input.left) {
      data.wallLane = Math.max(0, data.wallLane - 1);
    }
    if (input.right) {
      data.wallLane = Math.min(2, data.wallLane + 1);
    }

    data.ladderProgress += config.ladderSpeed * deltaMs;

    if ((input.jump || questGameState.keys.has("Enter")) && !data.pushLock) {
      data.pushLock = true;
      if (data.wallLane === data.ladderLane && data.ladderProgress >= 0.62 && data.ladderProgress <= 0.96) {
        data.ladderActive = false;
        data.laddersStopped += 1;
        data.nextSpawnDelayMs = 540;
        data.ladderProgress = 0;
        setQuestGameStatus(`Ladder kicked clear. ${data.laddersStopped} / ${config.targetLadders} knocked off.`);
        if (data.laddersStopped >= config.targetLadders) {
          finishQuestGame(config.successText, "Play Again");
        }
        return;
      }
      setQuestGameStatus("Bad shove timing. Reset and brace for the landing.");
    }

    if (!input.jump && !questGameState.keys.has("Enter")) {
      data.pushLock = false;
    }

    if (data.ladderProgress >= 1) {
      data.ladderProgress = 1;
      startHelmsTriviaPhase(data);
    }
    return;
  }
}

const PLAYABLE_QUEST_CONFIGS = {
  "Flight to the Ford": {
    controlsText: "Move with W A S D or the arrow keys.",
    objectiveText: "Guide Frodo and Arwen through the woods, collect every light, and avoid the Ringwraiths.",
    introText: "Press start to ride the hidden paths.",
    runningText: "Wraiths in the woods. Clear the path to the ford.",
    successText: "Every woodland light is claimed. The ford is clear ahead.",
    failureText: "A Ringwraith closed in on the trail. Try the crossing again.",
    durationMs: 99999,
    setup() {
      const pellets = new Set();
      FORD_MAZE.forEach((rowText, row) => {
        [...rowText].forEach((cell, col) => {
          if (cell === "." || cell === "o") {
            pellets.add(`${col},${row}`);
          }
        });
      });
      const start = fordCellCenter(1, 1);
      questGameState.questData = {
        pellets,
        totalPellets: pellets.size,
        player: {
          col: 1,
          row: 1,
          x: start.x,
          y: start.y,
          direction: "right",
          pendingDirection: "right",
        },
        ghosts: [
          makeFordGhost(8, 5, "left", "#d8dde8"),
          makeFordGhost(11, 5, "right", "#bac2d4"),
          makeFordGhost(8, 7, "up", "#c9b8d4"),
          makeFordGhost(11, 7, "left", "#b7d0c7"),
        ],
      };
    },
    update(deltaMs) {
      updateFordPacman(deltaMs, this);
    },
    draw(ctx) {
      const data = questGameState.questData;
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#102012");
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 78, "#1b2c1e");
      drawPixelRect(ctx, 0, 78, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT - 78, "#1a140d");

      for (let i = 0; i < 10; i += 1) {
        drawPixelRect(ctx, 20 + i * 66, 0, 10, 80 + (i % 3) * 10, "#26351f");
        drawPixelRect(ctx, 10 + i * 66, 24, 30, 12, "#325128");
      }

      FORD_MAZE.forEach((rowText, row) => {
        [...rowText].forEach((cell, col) => {
          const x = FORD_OFFSET_X + col * FORD_TILE;
          const y = FORD_OFFSET_Y + row * FORD_TILE;
          if (cell === "#") {
            drawPixelRect(ctx, x, y, FORD_TILE, FORD_TILE, "#284423");
            drawPixelRect(ctx, x + 4, y + 4, FORD_TILE - 8, FORD_TILE - 8, "#1d3118");
          }
        });
      });

      data.pellets.forEach((key) => {
        const [col, row] = key.split(",").map(Number);
        const center = fordCellCenter(col, row);
        const isBig = fordMazeChar(col, row) === "o";
        drawPixelRect(ctx, center.x - (isBig ? 5 : 3), center.y - (isBig ? 5 : 3), isBig ? 10 : 6, isBig ? 10 : 6, isBig ? "#dff4a8" : "#f4d38b");
      });

      if (data.player) {
        drawFordPlayer(ctx, data.player);
      }
      data.ghosts.forEach((ghost) => drawFordGhost(ctx, ghost));

      const collected = data.totalPellets - data.pellets.size;
      drawRatioBar(ctx, collected / Math.max(data.totalPellets, 1), "FORD", "#9bd36b");
    },
  },
  "Into Moria": {
    controlsText: "Move with A / D or the arrow keys. Jump with W, Up, or Space.",
    objectiveText: "Run across the mine, stay ahead of the Balrog, dodge falling rock, and jump the rubble.",
    introText: "Press start to enter the mine.",
    runningText: "The Balrog is behind you. Keep moving east.",
    successText: "The company clears the hall. Moria is behind you.",
    failureText: "The Balrog caught the fellowship. Try the tunnels again.",
    durationMs: 16000,
    setup() {
      questGameState.player = { x: 136, y: 270, width: 22, height: 26 };
      questGameState.playerVy = 0;
      questGameState.onGround = true;
      questGameState.worldProgress = 0;
      questGameState.spawnTimerMs = 180;
    },
    update(deltaMs) {
      const groundY = 270;
      const balrogEdge = Math.max(0, 28 + (questGameState.elapsedMs / this.durationMs) * 68);
      const balrogFront = balrogEdge + 16;
      const input = currentInput();
      const baselineSpeed = 0.14 * deltaMs;
      const pushSpeed = input.right ? 0.12 * deltaMs : 0;
      const dragSpeed = input.left ? 0.08 * deltaMs : 0;
      questGameState.worldProgress += Math.max(0.05 * deltaMs, baselineSpeed + pushSpeed - dragSpeed);

      if (input.jump && questGameState.onGround) {
        questGameState.playerVy = -0.54;
        questGameState.onGround = false;
      }

      questGameState.playerVy += 0.00155 * deltaMs;
      questGameState.player.y += questGameState.playerVy * deltaMs;

      if (questGameState.player.y >= groundY) {
        questGameState.player.y = groundY;
        questGameState.playerVy = 0;
        questGameState.onGround = true;
      }

      if (input.left) {
        questGameState.player.x = Math.max(48, questGameState.player.x - 0.11 * deltaMs);
      }
      if (input.right) {
        questGameState.player.x = Math.min(150, questGameState.player.x + 0.06 * deltaMs);
      }

      if (questGameState.player.x <= balrogFront + 4) {
        finishQuestGame("The Balrog closed the gap. Keep pressing forward.", "Retry Quest");
        return;
      }

      questGameState.spawnTimerMs -= deltaMs;
      if (questGameState.spawnTimerMs <= 0) {
        const hazardType = Math.random() > 0.45 ? "falling" : "rubble";
        if (hazardType === "falling") {
          const size = 14 + Math.round(Math.random() * 16);
          questGameState.hazards.push({
            type: "falling",
            x: randomBetween(180, 610),
            y: -28,
            width: size,
            height: size,
            vx: -0.16 - Math.random() * 0.04,
            vy: 0.19 + Math.random() * 0.1,
          });
        } else {
          const width = 24 + Math.round(Math.random() * 24);
          const height = 14 + Math.round(Math.random() * 10);
          questGameState.hazards.push({
            type: "rubble",
            x: randomBetween(220, 650),
            y: groundY + 10,
            width,
            height,
            vx: -0.2 - Math.random() * 0.06,
            vy: 0,
          });
        }
        questGameState.spawnTimerMs = randomBetween(210, 460);
      }

      questGameState.hazards.forEach((hazard) => {
        hazard.x += hazard.vx * deltaMs;
        hazard.y += hazard.vy * deltaMs;
      });
      questGameState.hazards = questGameState.hazards.filter((hazard) => hazard.x > -60 && hazard.y < QUEST_GAME_CANVAS_HEIGHT + 30);

      if (questGameState.hazards.some((hazard) => intersectRect(questGameState.player, hazard))) {
        finishQuestGame("Falling rock or rubble caught the fellowship. Try the tunnels again.", "Retry Quest");
        return;
      }

      questGameState.elapsedMs += deltaMs;
      if (questGameState.elapsedMs >= this.durationMs) {
        finishQuestGame(this.successText, "Play Again");
      }
    },
    draw(ctx) {
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#090708");
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 76, "#141114");
      drawPixelRect(ctx, 0, 250, QUEST_GAME_CANVAS_WIDTH, 110, "#241910");
      const scroll = questGameState.worldProgress % 76;
      for (let i = -1; i < 9; i += 1) {
        drawPixelRect(ctx, 24 + i * 76 - scroll, 104, 18, 144, "#20150d");
      }
      for (let i = -1; i < 6; i += 1) {
        drawPixelRect(ctx, 58 + i * 120 - (questGameState.worldProgress % 120), 140, 6, 30, "#ffba45");
      }
      const balrogEdge = Math.max(0, 28 + (questGameState.elapsedMs / this.durationMs) * 68);
      drawPixelRect(ctx, 0, 0, balrogEdge, QUEST_GAME_CANVAS_HEIGHT, "rgba(40, 10, 8, 0.85)");
      drawPixelRect(ctx, balrogEdge - 10, 0, 10, QUEST_GAME_CANVAS_HEIGHT, "#8b2418");
      drawPixelRect(ctx, balrogEdge - 48, 184, 30, 74, "#24100d");
      drawPixelRect(ctx, balrogEdge - 38, 152, 18, 28, "#3a1812");
      drawPixelRect(ctx, balrogEdge - 34, 160, 4, 4, "#ffd36d");
      drawPixelRect(ctx, balrogEdge - 24, 160, 4, 4, "#ffd36d");
      drawPixelRect(ctx, balrogEdge - 56, 166, 10, 46, "#4a1710");
      drawPixelRect(ctx, balrogEdge - 10, 166, 10, 46, "#4a1710");
      drawPixelRect(ctx, balrogEdge - 68, 144, 18, 12, "#2b120e");
      drawPixelRect(ctx, balrogEdge - 2, 144, 18, 12, "#2b120e");
      drawPixelRect(ctx, balrogEdge - 14, 132, 6, 20, "#ff7a2f");
      drawPixelRect(ctx, balrogEdge - 8, 118, 4, 16, "#ffd36d");
      drawHero(ctx, questGameState.player, { skin: "#ece0bb", hair: "#6b6b6b", tunic: "#4b5c6a", accent: "#ffcf6f" });
      questGameState.hazards.forEach((hazard) => {
        if (hazard.type === "falling") {
          drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#574439");
          drawPixelRect(ctx, hazard.x + 3, hazard.y + 3, Math.max(hazard.width - 6, 4), Math.max(hazard.height - 6, 4), "#89725f");
        } else {
          drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#4a3b30");
          drawPixelRect(ctx, hazard.x + 4, hazard.y + 4, Math.max(hazard.width - 8, 4), Math.max(hazard.height - 8, 4), "#8a725c");
        }
      });
      drawProgressBar(ctx, this.durationMs, "MORIA", "#9c8450");
    },
  },
  "Helm's Deep Stand": {
    engine: "three",
    controlsText: "Move lane with A / D or the arrow keys. Press W, Space, or Enter to shove a ladder.",
    objectiveText: "First-person wall defense. Knock off 10 ladders before they land. If one lands, answer LOTR trivia correctly to strike down 5 attackers.",
    introText: "Press start to take the wall.",
    runningText: "Uruk-hai are raising ladders. Hold the parapet.",
    successText: "Ten ladders fall. The wall still stands under your watch.",
    failureText: "The wall is overrun. Take the parapet again.",
    durationMs: 99999,
    targetLadders: 10,
    setup() {
      questGameState.questData = {
        mode: "defense",
        wallLane: 1,
        laddersStopped: 0,
        strikesRemaining: 0,
        activeQuestion: null,
      };
      setQuestTriviaState(false);
    },
  },
  "Shelob's Lair": {
    controlsText: "Move with A / D or the arrow keys.",
    objectiveText: "Slip through the webs and do not get caught in the dark.",
    introText: "Press start to enter the tunnel.",
    runningText: "Webs ahead. Keep moving and stay clear.",
    successText: "You slip free of Shelob's lair and reach the stairs above.",
    failureText: "The webs caught you. Try the tunnel again.",
    durationMs: 17000,
    movement: "free",
    playerSpeed: 0.24,
    minX: 18,
    maxX: QUEST_GAME_CANVAS_WIDTH - 44,
    spawnMinMs: 260,
    spawnMaxMs: 460,
    setup() {
      questGameState.player = { x: 298, y: 288, width: 22, height: 22 };
      questGameState.spawnTimerMs = 200;
    },
    spawnHazard() {
      const fromLeft = Math.random() > 0.5;
      questGameState.hazards.push({
        x: fromLeft ? -26 : QUEST_GAME_CANVAS_WIDTH + 12,
        y: randomBetween(84, 284),
        width: 24,
        height: 24,
        vx: fromLeft ? randomBetween(0.18, 0.26) : randomBetween(-0.26, -0.18),
        vy: randomBetween(-0.02, 0.02),
      });
    },
    keepHazard(hazard) {
      return hazard.x > -40 && hazard.x < QUEST_GAME_CANVAS_WIDTH + 40;
    },
    draw(ctx) {
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#0a090f");
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 66, "#15111c");
      drawPixelRect(ctx, 0, 280, QUEST_GAME_CANVAS_WIDTH, 80, "#1f1712");
      for (let i = 0; i < 9; i += 1) {
        drawPixelRect(ctx, 40 + i * 68, 0, 2, 100 + (i % 3) * 40, "#ded8df");
        drawPixelRect(ctx, 40 + i * 68, 40 + (i % 2) * 40, 28, 2, "#ded8df");
      }
      drawHero(ctx, questGameState.player, { skin: "#ead9bc", hair: "#4b3825", tunic: "#5a6140", accent: "#ffd15c" });
      questGameState.hazards.forEach((hazard) => {
        drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#dad4df");
        drawPixelRect(ctx, hazard.x + 6, hazard.y + 6, hazard.width - 12, hazard.height - 12, "#b9b0c2");
      });
      drawProgressBar(ctx, this.durationMs, "LAIR", "#d8d0e8");
    },
  },
  "March Across Gorgoroth": {
    controlsText: "Move with A / D or the arrow keys.",
    objectiveText: "Shift lanes across the ash plain and avoid the burning vents.",
    introText: "Press start to cross the ash plain.",
    runningText: "Heat below. Ash above. Keep the ring moving.",
    successText: "The ash plain is behind you. Mount Doom looms ahead.",
    failureText: "The burning ground caught you. Cross Gorgoroth again.",
    durationMs: 18000,
    movement: "free",
    playerSpeed: 0.22,
    minX: 24,
    maxX: QUEST_GAME_CANVAS_WIDTH - 46,
    spawnMinMs: 420,
    spawnMaxMs: 720,
    setup() {
      questGameState.player = { x: QUEST_GAME_LANES[1], y: 268, width: 22, height: 26 };
      questGameState.spawnTimerMs = 340;
    },
    spawnHazard() {
      const lane = Math.floor(Math.random() * QUEST_GAME_LANES.length);
      questGameState.hazards.push({
        x: QUEST_GAME_LANES[lane] - 18,
        y: QUEST_GAME_CANVAS_HEIGHT + 8,
        width: 36,
        height: 52,
        vx: 0,
        vy: randomBetween(-0.22, -0.16),
      });
    },
    keepHazard(hazard) {
      return hazard.y > -60;
    },
    draw(ctx) {
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#22110d");
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 80, "#39211b");
      drawPixelRect(ctx, 0, 80, QUEST_GAME_CANVAS_WIDTH, 280, "#5a3828");
      for (const laneX of QUEST_GAME_LANES) {
        drawPixelRect(ctx, laneX - 4, 90, 8, 220, "#8f6746");
      }
      for (let i = 0; i < 24; i += 1) {
        drawPixelRect(ctx, (i * 28) % QUEST_GAME_CANVAS_WIDTH, 98 + (i * 17) % 220, 6, 4, "#aa8254");
      }
      drawHero(ctx, questGameState.player, { skin: "#ead4b0", hair: "#4a311d", tunic: "#70593b", accent: "#f4c86c" });
      questGameState.hazards.forEach((hazard) => {
        drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#781c14");
        drawPixelRect(ctx, hazard.x + 6, hazard.y + 8, hazard.width - 12, hazard.height - 16, "#ff7b2f");
        drawPixelRect(ctx, hazard.x + 12, hazard.y + 16, hazard.width - 24, hazard.height - 28, "#ffd269");
      });
      drawProgressBar(ctx, this.durationMs, "ASH", "#ff9d3f");
    },
  },
  "Ring Destroyed": {
    controlsText: "Move with A / D or the arrow keys.",
    objectiveText: "Survive the final lava bursts and reach the crack before the mountain breaks.",
    introText: "Press start for the final approach.",
    runningText: "Mount Doom is awake. One last run.",
    successText: "The ring falls. The mountain erupts. Quest complete.",
    failureText: "The mountain broke first. Make the final run again.",
    durationMs: 19000,
    movement: "free",
    playerSpeed: 0.24,
    minX: 18,
    maxX: QUEST_GAME_CANVAS_WIDTH - 44,
    spawnMinMs: 240,
    spawnMaxMs: 440,
    setup() {
      questGameState.player = { x: 300, y: 282, width: 22, height: 26 };
      questGameState.spawnTimerMs = 180;
    },
    spawnHazard() {
      const width = 18 + Math.round(Math.random() * 18);
      questGameState.hazards.push({
        x: randomBetween(30, 600),
        y: QUEST_GAME_CANVAS_HEIGHT + 8,
        width,
        height: 34,
        vx: randomBetween(-0.02, 0.02),
        vy: randomBetween(-0.28, -0.18),
      });
    },
    keepHazard(hazard) {
      return hazard.y > -50;
    },
    draw(ctx) {
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#170b0b");
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 110, "#2f1310");
      drawPixelRect(ctx, 0, 110, QUEST_GAME_CANVAS_WIDTH, 210, "#3c2016");
      drawPixelRect(ctx, 0, 320, QUEST_GAME_CANVAS_WIDTH, 40, "#ff7b2f");
      for (let i = 0; i < 10; i += 1) {
        drawPixelRect(ctx, 20 + i * 62, 130 + (i % 3) * 36, 30, 90, "#21100d");
      }
      drawHero(ctx, questGameState.player, { skin: "#efdbb8", hair: "#57361f", tunic: "#7f512b", accent: "#f7d54c" });
      questGameState.hazards.forEach((hazard) => {
        drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#8a1e15");
        drawPixelRect(ctx, hazard.x + 4, hazard.y + 6, Math.max(hazard.width - 8, 4), Math.max(hazard.height - 12, 8), "#ff6a23");
        drawPixelRect(ctx, hazard.x + 8, hazard.y + 12, Math.max(hazard.width - 16, 4), Math.max(hazard.height - 20, 6), "#ffd36d");
      });
      drawProgressBar(ctx, this.durationMs, "DOOM", "#ffb149");
    },
  },
};

function drawQuestGameFrame() {
  if (activeQuestConfig()?.engine === "three") return;
  const ctx = questCanvasContext();
  const config = activeQuestConfig();
  if (!ctx || !config) return;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT);
  config.draw(ctx);
}

function questGameTick(timestamp) {
  if (!questGameState.running) return;
  if (!questGameState.lastTick) {
    questGameState.lastTick = timestamp;
  }
  const deltaMs = Math.min(timestamp - questGameState.lastTick, 32);
  questGameState.lastTick = timestamp;

  const config = activeQuestConfig();
  if (!config) {
    stopQuestGameLoop();
    return;
  }

  updateSurvivalQuest(deltaMs, config);
  drawQuestGameFrame();

  if (questGameState.running) {
    questGameState.animationFrameId = requestAnimationFrame(questGameTick);
  }
}

function openQuestGame(questKey, triggerElement) {
  const quest = PLAYABLE_SIDE_QUESTS[questKey];
  const config = PLAYABLE_QUEST_CONFIGS[questKey];
  if (!quest) return;
  if (!config) return;

  stopQuestGameLoop();
  questGameState.keys.clear();
  questGameState.activeQuestKey = questKey;
  questGameState.activeQuest = triggerElement || null;
  elements.questGameTitle.textContent = quest.title;
  elements.questGameDescription.textContent = quest.description;
  elements.questGameControls.innerHTML = config.controlsText;
  elements.questGameObjective.textContent = config.objectiveText;
  elements.startQuestGameButton.textContent = "Start Quest";
  elements.startQuestGameButton.disabled = false;
  setQuestTriviaState(false);
  setQuestRenderMode(config.engine === "three" ? "three" : "canvas");
  destroyExternalQuestSession();
  resetQuestGameModel();
  config.setup();
  if (config.engine !== "three") {
    drawQuestGameFrame();
  } else {
    elements.questGameThreeHost.innerHTML = "";
  }
  setQuestGameStatus(config.introText);
  openModal(elements.questGameModal, elements.startQuestGameButton);
}

function closeQuestGame() {
  stopQuestGameLoop();
  destroyExternalQuestSession();
  questGameState.keys.clear();
  questGameState.activeQuestKey = null;
  const trigger = questGameState.activeQuest || null;
  questGameState.activeQuest = null;
  closeModal(elements.questGameModal, trigger);
}

function startQuestGame() {
  const config = activeQuestConfig();
  if (!config) return;

  if (config.engine === "three") {
    destroyExternalQuestSession();
    setQuestTriviaState(false);
    setQuestGameStatus(config.runningText);
    elements.startQuestGameButton.disabled = true;
    elements.startQuestGameButton.textContent = "Quest Running";
    helmsDeepSession = createHelmsDeepGame(elements.questGameThreeHost, {
      onStatus: (message) => setQuestGameStatus(message),
      onProgress: (count) => {
        questGameState.questData.laddersStopped = count;
      },
      onLadderLanded: () => {
        questGameState.questData.mode = "trivia";
        questGameState.questData.strikesRemaining = 5;
        questGameState.questData.activeQuestion = pickHelmsTriviaQuestion();
        setQuestTriviaState(
          true,
          questGameState.questData.activeQuestion.prompt,
          questGameState.questData.activeQuestion.options,
        );
      },
      onComplete: (message) => {
        setQuestGameStatus(message);
        setQuestTriviaState(false);
        elements.startQuestGameButton.disabled = false;
        elements.startQuestGameButton.textContent = "Replay Quest";
      },
    });
    helmsDeepSession.start();
    return;
  }

  resetQuestGameModel();
  config.setup();
  setQuestGameStatus(config.runningText);
  elements.startQuestGameButton.disabled = true;
  elements.startQuestGameButton.textContent = "Quest Running";
  stopQuestGameLoop();
  questGameState.running = true;
  drawQuestGameFrame();
  questGameState.animationFrameId = requestAnimationFrame(questGameTick);
}

export function bindModalClose() {
  document.addEventListener("keydown", (event) => {
    if (elements.endingModal.classList.contains("is-open") && event.key === "Escape") {
      closeEndingModal();
      return;
    }

    if (elements.questGameModal.classList.contains("is-open")) {
      if (event.key === "Escape") {
        closeQuestGame();
        return;
      }

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "A", "d", "D", "w", "W", "s", "S", " ", "Space", "Spacebar"].includes(event.key)) {
        event.preventDefault();
        questGameState.keys.add(event.key);
      }
    }

    if (event.key !== "Escape") {
      return;
    }

    if (elements.runnerModal.classList.contains("is-open")) {
      closeModal(elements.runnerModal, elements.addRunnerButton);
    }

    if (elements.resetModal.classList.contains("is-open")) {
      closeModal(elements.resetModal, elements.resetButton);
    }

    if (elements.deleteRunModal.classList.contains("is-open")) {
      closeModal(elements.deleteRunModal, null);
    }
  });

  document.addEventListener("keyup", (event) => {
    questGameState.keys.delete(event.key);
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

  elements.deleteRunModal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-delete-run")) {
      closeModal(elements.deleteRunModal, null);
    }
  });

  elements.questGameModal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-quest-game")) {
      closeQuestGame();
    }
  });

  elements.endingModal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-ending")) {
      closeEndingModal();
    }
  });
}

export function bindUi(db) {
  const isAdmin = new URLSearchParams(window.location.search).get("admin") === "true";
  elements.resetButton.hidden = !isAdmin;
  updateDevModeButton();

  elements.devModeButton.addEventListener("click", () => {
    setDevMode(!state.devMode);
    updateDevModeButton();
    render();
    syncEndingSequence();
  });

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

  elements.runnerGrid.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-runner-button");
    const logChip = event.target.closest(".log-item");

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

    if (logChip) {
      const runId = logChip.dataset.runId;
      if (!runId) return;
      const miles = logChip.querySelector(".log-miles")?.textContent || "";
      const date = logChip.querySelector(".log-date")?.textContent || "";
      elements.deleteRunDescription.textContent = `${miles} on ${date}`;
      elements.confirmDeleteRunButton.dataset.runId = runId;
      openModal(elements.deleteRunModal, elements.confirmDeleteRunButton);
    }
  });

  elements.cancelDeleteRunButton.addEventListener("click", () => {
    closeModal(elements.deleteRunModal, null);
  });

  elements.confirmDeleteRunButton.addEventListener("click", async () => {
    const runId = elements.confirmDeleteRunButton.dataset.runId;
    if (!runId) return;

    elements.confirmDeleteRunButton.disabled = true;
    elements.cancelDeleteRunButton.disabled = true;

    try {
      await deleteRun(db, runId);
      closeModal(elements.deleteRunModal, null);
    } catch (error) {
      console.error(error);
    } finally {
      elements.confirmDeleteRunButton.disabled = false;
      elements.cancelDeleteRunButton.disabled = false;
    }
  });

  elements.missions.addEventListener("click", (event) => {
    const questCard = event.target.closest("[data-playable-quest]");
    if (!questCard) return;
    openQuestGame(questCard.dataset.playableQuest, questCard);
  });

  elements.missions.addEventListener("keydown", (event) => {
    const questCard = event.target.closest("[data-playable-quest]");
    if (!questCard || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openQuestGame(questCard.dataset.playableQuest, questCard);
  });

  elements.closeQuestGameButton.addEventListener("click", () => {
    closeQuestGame();
  });

  elements.startQuestGameButton.addEventListener("click", () => {
    startQuestGame();
  });

  elements.questTriviaOptions.addEventListener("click", (event) => {
    const optionButton = event.target.closest("[data-trivia-option]");
    if (!optionButton) return;
    resolveHelmsTriviaAnswer(optionButton.dataset.triviaOption);
  });

  elements.closeEndingButton.addEventListener("click", () => {
    closeEndingModal();
  });

  elements.closeEndingIconButton.addEventListener("click", () => {
    closeEndingModal();
  });

  elements.playEndingButton.addEventListener("click", () => {
    playEndingVideo(true);
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

  return elements.setupPanel;
}
