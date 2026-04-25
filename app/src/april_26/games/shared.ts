export const QUEST_GAME_CANVAS_WIDTH = 640;
export const QUEST_GAME_CANVAS_HEIGHT = 360;
export const QUEST_GAME_LANES = [156, 308, 460] as const;

export type Hazard = {
  type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx?: number;
  vy?: number;
};

export type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type QuestScratch = {
  player: Player;
  playerVy: number;
  onGround: boolean;
  worldProgress: number;
  laneIndex: number;
  hazards: Hazard[];
  spawnTimerMs: number;
  elapsedMs: number;
  questData: Record<string, unknown>;
};

export type InputState = {
  keys: Set<string>;
  left: boolean;
  right: boolean;
  jump: boolean;
  direction: "up" | "down" | "left" | "right" | null;
};

export type UpdateResult =
  | { status: "running" }
  | { status: "success"; message?: string }
  | { status: "failure"; message?: string };

export function makeFreshScratch(): QuestScratch {
  return {
    player: { x: 84, y: 288, width: 24, height: 24 },
    playerVy: 0,
    onGround: true,
    worldProgress: 0,
    laneIndex: 1,
    hazards: [],
    spawnTimerMs: 0,
    elapsedMs: 0,
    questData: {},
  };
}

export function readInput(keys: Set<string>): InputState {
  const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D");
  const up = keys.has("ArrowUp") || keys.has("w") || keys.has("W");
  const down = keys.has("ArrowDown") || keys.has("s") || keys.has("S");
  const jump = up || keys.has(" ") || keys.has("Space") || keys.has("Spacebar");

  let direction: InputState["direction"] = null;
  if (up) direction = "up";
  else if (down) direction = "down";
  else if (left) direction = "left";
  else if (right) direction = "right";

  return { keys, left, right, jump, direction };
}

export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fillStyle: string,
) {
  ctx.fillStyle = fillStyle;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

export function intersectRect(a: Hazard | Player, b: Hazard | Player): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export type HeroPalette = { skin: string; hair: string; tunic: string; accent: string };

export function drawHero(
  ctx: CanvasRenderingContext2D,
  player: Player,
  palette: HeroPalette = { skin: "#f0e1bf", hair: "#6b4f2f", tunic: "#4f7a35", accent: "#e0f0ff" },
) {
  drawPixelRect(ctx, player.x, player.y, player.width, player.height, palette.skin);
  drawPixelRect(ctx, player.x + 4, player.y + 4, 16, 8, palette.hair);
  drawPixelRect(ctx, player.x + 6, player.y + 12, 12, 8, palette.tunic);
  drawPixelRect(ctx, player.x + 20, player.y + 8, 8, 14, palette.accent);
}

export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  durationMs: number,
  elapsedMs: number,
  label: string,
  color = "#d4922a",
) {
  const progress = Math.min(elapsedMs / durationMs, 1);
  const progressWidth = Math.round(progress * 260);
  drawPixelRect(ctx, 18, 18, 264, 12, "#2b180f");
  drawPixelRect(ctx, 20, 20, progressWidth, 8, color);
  drawPixelRect(ctx, 20 + progressWidth, 20, Math.max(260 - progressWidth, 0), 8, "#57371a");
  ctx.fillStyle = "#fff2c7";
  ctx.font = '16px "VT323"';
  ctx.fillText(label, 518, 338);
}

export function drawRatioBar(
  ctx: CanvasRenderingContext2D,
  ratio: number,
  label: string,
  color = "#d4922a",
) {
  const clamped = Math.max(0, Math.min(ratio, 1));
  const progressWidth = Math.round(clamped * 260);
  drawPixelRect(ctx, 18, 18, 264, 12, "#2b180f");
  drawPixelRect(ctx, 20, 20, progressWidth, 8, color);
  drawPixelRect(ctx, 20 + progressWidth, 20, Math.max(260 - progressWidth, 0), 8, "#57371a");
  ctx.fillStyle = "#fff2c7";
  ctx.font = '16px "VT323"';
  ctx.fillText(label, 504, 338);
}

export function movePlayerHorizontal(
  scratch: QuestScratch,
  input: InputState,
  deltaMs: number,
  speed: number,
  minX = 12,
  maxX = QUEST_GAME_CANVAS_WIDTH - 40,
) {
  if (input.left) scratch.player.x -= speed * deltaMs;
  if (input.right) scratch.player.x += speed * deltaMs;
  scratch.player.x = Math.max(minX, Math.min(maxX, scratch.player.x));
}

type SurvivalConfig = {
  durationMs: number;
  movement: "free" | "lane";
  playerY?: number;
  playerSpeed?: number;
  minX?: number;
  maxX?: number;
  spawnMinMs: number;
  spawnMaxMs: number;
  spawnHazard(scratch: QuestScratch): void;
  keepHazard(hazard: Hazard): boolean;
  successText: string;
  failureText: string;
};

export function runSurvivalUpdate(
  deltaMs: number,
  scratch: QuestScratch,
  input: InputState,
  config: SurvivalConfig,
): UpdateResult {
  if (config.movement === "lane") {
    movePlayerByLane(scratch, input, deltaMs, config.playerY ?? scratch.player.y);
  } else {
    movePlayerHorizontal(scratch, input, deltaMs, config.playerSpeed ?? 0.2, config.minX, config.maxX);
  }

  scratch.spawnTimerMs -= deltaMs;
  if (scratch.spawnTimerMs <= 0) {
    config.spawnHazard(scratch);
    scratch.spawnTimerMs = randomBetween(config.spawnMinMs, config.spawnMaxMs);
  }

  scratch.hazards.forEach((hazard) => {
    hazard.x += (hazard.vx || 0) * deltaMs;
    hazard.y += (hazard.vy || 0) * deltaMs;
  });
  scratch.hazards = scratch.hazards.filter(config.keepHazard);

  if (scratch.hazards.some((hazard) => intersectRect(scratch.player, hazard))) {
    return { status: "failure", message: config.failureText };
  }

  scratch.elapsedMs += deltaMs;
  if (scratch.elapsedMs >= config.durationMs) {
    return { status: "success", message: config.successText };
  }
  return { status: "running" };
}

export function movePlayerByLane(
  scratch: QuestScratch,
  input: InputState,
  deltaMs: number,
  lockY: number,
) {
  if (input.left && scratch.player.x > QUEST_GAME_LANES[scratch.laneIndex] - 6) {
    scratch.laneIndex = Math.max(0, scratch.laneIndex - 1);
  }
  if (input.right && scratch.player.x < QUEST_GAME_LANES[scratch.laneIndex] + 6) {
    scratch.laneIndex = Math.min(QUEST_GAME_LANES.length - 1, scratch.laneIndex + 1);
  }
  const targetX = QUEST_GAME_LANES[scratch.laneIndex];
  scratch.player.x += (targetX - scratch.player.x) * Math.min(1, 0.018 * deltaMs);
  scratch.player.y = lockY;
}
