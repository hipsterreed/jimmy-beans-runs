import type { CanvasQuestConfig } from "./playableQuestConfigs";
import {
  drawHero,
  drawPixelRect,
  drawProgressBar,
  intersectRect,
  QUEST_GAME_CANVAS_HEIGHT,
  QUEST_GAME_CANVAS_WIDTH,
  randomBetween,
  type UpdateResult,
} from "./shared";

export const intoMoriaConfig: CanvasQuestConfig = {
  engine: "canvas",
  controlsText: "Move with A / D or the arrow keys. Jump with W, Up, or Space.",
  objectiveText:
    "Run across the mine, stay ahead of the Balrog, dodge falling rock, and jump the rubble.",
  introText: "Press start to enter the mine.",
  runningText: "The Balrog is behind you. Keep moving east.",
  successText: "The company clears the hall. Moria is behind you.",
  failureText: "The Balrog caught the fellowship. Try the tunnels again.",
  durationMs: 16000,
  setup(scratch) {
    scratch.player = { x: 136, y: 270, width: 22, height: 26 };
    scratch.playerVy = 0;
    scratch.onGround = true;
    scratch.worldProgress = 0;
    scratch.spawnTimerMs = 180;
  },
  update(deltaMs, scratch, input): UpdateResult {
    const groundY = 270;
    const balrogEdge = Math.max(0, 28 + (scratch.elapsedMs / this.durationMs) * 68);
    const balrogFront = balrogEdge + 16;
    const baselineSpeed = 0.14 * deltaMs;
    const pushSpeed = input.right ? 0.12 * deltaMs : 0;
    const dragSpeed = input.left ? 0.08 * deltaMs : 0;
    scratch.worldProgress += Math.max(0.05 * deltaMs, baselineSpeed + pushSpeed - dragSpeed);

    if (input.jump && scratch.onGround) {
      scratch.playerVy = -0.54;
      scratch.onGround = false;
    }
    scratch.playerVy += 0.00155 * deltaMs;
    scratch.player.y += scratch.playerVy * deltaMs;

    if (scratch.player.y >= groundY) {
      scratch.player.y = groundY;
      scratch.playerVy = 0;
      scratch.onGround = true;
    }

    if (input.left) scratch.player.x = Math.max(48, scratch.player.x - 0.11 * deltaMs);
    if (input.right) scratch.player.x = Math.min(150, scratch.player.x + 0.06 * deltaMs);

    if (scratch.player.x <= balrogFront + 4) {
      return { status: "failure", message: "The Balrog closed the gap. Keep pressing forward." };
    }

    scratch.spawnTimerMs -= deltaMs;
    if (scratch.spawnTimerMs <= 0) {
      const hazardType = Math.random() > 0.45 ? "falling" : "rubble";
      if (hazardType === "falling") {
        const size = 14 + Math.round(Math.random() * 16);
        scratch.hazards.push({
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
        scratch.hazards.push({
          type: "rubble",
          x: randomBetween(220, 650),
          y: groundY + 10,
          width,
          height,
          vx: -0.2 - Math.random() * 0.06,
          vy: 0,
        });
      }
      scratch.spawnTimerMs = randomBetween(210, 460);
    }

    scratch.hazards.forEach((hazard) => {
      hazard.x += (hazard.vx ?? 0) * deltaMs;
      hazard.y += (hazard.vy ?? 0) * deltaMs;
    });
    scratch.hazards = scratch.hazards.filter(
      (hazard) => hazard.x > -60 && hazard.y < QUEST_GAME_CANVAS_HEIGHT + 30,
    );

    if (scratch.hazards.some((hazard) => intersectRect(scratch.player, hazard))) {
      return {
        status: "failure",
        message: "Falling rock or rubble caught the fellowship. Try the tunnels again.",
      };
    }

    scratch.elapsedMs += deltaMs;
    if (scratch.elapsedMs >= this.durationMs) {
      return { status: "success", message: this.successText };
    }
    return { status: "running" };
  },
  draw(ctx, scratch) {
    drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#090708");
    drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 76, "#141114");
    drawPixelRect(ctx, 0, 250, QUEST_GAME_CANVAS_WIDTH, 110, "#241910");
    const scroll = scratch.worldProgress % 76;
    for (let i = -1; i < 9; i += 1) {
      drawPixelRect(ctx, 24 + i * 76 - scroll, 104, 18, 144, "#20150d");
    }
    for (let i = -1; i < 6; i += 1) {
      drawPixelRect(ctx, 58 + i * 120 - (scratch.worldProgress % 120), 140, 6, 30, "#ffba45");
    }
    const balrogEdge = Math.max(0, 28 + (scratch.elapsedMs / this.durationMs) * 68);
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
    drawHero(ctx, scratch.player, { skin: "#ece0bb", hair: "#6b6b6b", tunic: "#4b5c6a", accent: "#ffcf6f" });
    scratch.hazards.forEach((hazard) => {
      if (hazard.type === "falling") {
        drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#574439");
        drawPixelRect(
          ctx,
          hazard.x + 3,
          hazard.y + 3,
          Math.max(hazard.width - 6, 4),
          Math.max(hazard.height - 6, 4),
          "#89725f",
        );
      } else {
        drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#4a3b30");
        drawPixelRect(
          ctx,
          hazard.x + 4,
          hazard.y + 4,
          Math.max(hazard.width - 8, 4),
          Math.max(hazard.height - 8, 4),
          "#8a725c",
        );
      }
    });
    drawProgressBar(ctx, this.durationMs, scratch.elapsedMs, "MORIA", "#9c8450");
  },
};
