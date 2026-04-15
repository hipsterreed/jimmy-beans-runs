import { CHARACTER_OPTIONS, DEFAULT_RUNNER_GOAL, PLAYABLE_SIDE_QUESTS } from "./data.js";
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
  questGameCanvas: document.getElementById("questGameCanvas"),
  startQuestGameButton: document.getElementById("startQuestGameButton"),
  closeQuestGameButton: document.getElementById("closeQuestGameButton"),
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

function questCanvasContext() {
  return elements.questGameCanvas?.getContext("2d");
}

function setQuestGameStatus(message) {
  elements.questGameStatus.textContent = message;
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

function finishQuestGame(message, buttonLabel) {
  stopQuestGameLoop();
  setQuestGameStatus(message);
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
    controlsText: "Move with A / D or the arrow keys.",
    objectiveText: "Hold the wall and avoid the Uruk firebomb barrage through the storm.",
    introText: "Press start to take the wall.",
    runningText: "Rain on stone. Fire in the sky. Hold your line.",
    successText: "Dawn breaks over Helm's Deep. The wall still stands.",
    failureText: "A firebomb hit the wall walk. Take your place again.",
    durationMs: 18000,
    movement: "free",
    playerSpeed: 0.21,
    minX: 22,
    maxX: QUEST_GAME_CANVAS_WIDTH - 46,
    spawnMinMs: 300,
    spawnMaxMs: 520,
    setup() {
      questGameState.player = { x: 300, y: 278, width: 24, height: 24 };
      questGameState.spawnTimerMs = 280;
    },
    spawnHazard() {
      questGameState.hazards.push({
        x: randomBetween(40, 590),
        y: -30,
        width: 18,
        height: 24,
        vx: randomBetween(-0.01, 0.01),
        vy: randomBetween(0.18, 0.3),
      });
    },
    keepHazard(hazard) {
      return hazard.y < QUEST_GAME_CANVAS_HEIGHT + 24;
    },
    draw(ctx) {
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#10131c");
      drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 118, "#1f2433");
      drawPixelRect(ctx, 0, 118, QUEST_GAME_CANVAS_WIDTH, 150, "#465160");
      drawPixelRect(ctx, 0, 268, QUEST_GAME_CANVAS_WIDTH, 92, "#716e69");
      for (let i = 0; i < 18; i += 1) {
        drawPixelRect(ctx, 20 + i * 34, 230, 18, 38, "#938b7f");
      }
      for (let i = 0; i < QUEST_GAME_CANVAS_WIDTH; i += 32) {
        drawPixelRect(ctx, i, (i * 3) % QUEST_GAME_CANVAS_HEIGHT, 2, 18, "rgba(180,205,255,0.6)");
      }
      drawHero(ctx, questGameState.player, { skin: "#f2dfbf", hair: "#49331f", tunic: "#7a7d85", accent: "#c7d7e8" });
      questGameState.hazards.forEach((hazard) => drawHazardBlock(ctx, hazard, { outer: "#4a140a", inner: "#f06a26", glow: "#ffd36f" }));
      drawProgressBar(ctx, this.durationMs, "DEEP", "#8ab0db");
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
  resetQuestGameModel();
  config.setup();
  drawQuestGameFrame();
  setQuestGameStatus(config.introText);
  openModal(elements.questGameModal, elements.startQuestGameButton);
}

function closeQuestGame() {
  stopQuestGameLoop();
  questGameState.keys.clear();
  questGameState.activeQuestKey = null;
  const trigger = questGameState.activeQuest || null;
  questGameState.activeQuest = null;
  closeModal(elements.questGameModal, trigger);
}

function startQuestGame() {
  const config = activeQuestConfig();
  if (!config) return;

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
}

export function bindUi(db) {
  const isAdmin = new URLSearchParams(window.location.search).get("admin") === "true";
  elements.resetButton.hidden = !isAdmin;

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
