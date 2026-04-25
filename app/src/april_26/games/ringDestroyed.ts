import type { CanvasQuestConfig } from "./playableQuestConfigs";
import {
  drawHero,
  drawPixelRect,
  drawProgressBar,
  QUEST_GAME_CANVAS_HEIGHT,
  QUEST_GAME_CANVAS_WIDTH,
  randomBetween,
  runSurvivalUpdate,
} from "./shared";

const config = {
  durationMs: 19000,
  movement: "free" as const,
  playerSpeed: 0.24,
  minX: 18,
  maxX: QUEST_GAME_CANVAS_WIDTH - 44,
  spawnMinMs: 240,
  spawnMaxMs: 440,
  successText: "The ring falls. The mountain erupts. Quest complete.",
  failureText: "The mountain broke first. Make the final run again.",
};

export const ringDestroyedConfig: CanvasQuestConfig = {
  engine: "canvas",
  controlsText: "Move with A / D or the arrow keys.",
  objectiveText: "Survive the final lava bursts and reach the crack before the mountain breaks.",
  introText: "Press start for the final approach.",
  runningText: "Mount Doom is awake. One last run.",
  successText: config.successText,
  failureText: config.failureText,
  durationMs: config.durationMs,
  setup(scratch) {
    scratch.player = { x: 300, y: 282, width: 22, height: 26 };
    scratch.spawnTimerMs = 180;
  },
  update(deltaMs, scratch, input) {
    return runSurvivalUpdate(deltaMs, scratch, input, {
      ...config,
      spawnHazard(s) {
        const width = 18 + Math.round(Math.random() * 18);
        s.hazards.push({
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
    });
  },
  draw(ctx, scratch) {
    drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#170b0b");
    drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 110, "#2f1310");
    drawPixelRect(ctx, 0, 110, QUEST_GAME_CANVAS_WIDTH, 210, "#3c2016");
    drawPixelRect(ctx, 0, 320, QUEST_GAME_CANVAS_WIDTH, 40, "#ff7b2f");
    for (let i = 0; i < 10; i += 1) {
      drawPixelRect(ctx, 20 + i * 62, 130 + (i % 3) * 36, 30, 90, "#21100d");
    }
    drawHero(ctx, scratch.player, { skin: "#efdbb8", hair: "#57361f", tunic: "#7f512b", accent: "#f7d54c" });
    scratch.hazards.forEach((hazard) => {
      drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#8a1e15");
      drawPixelRect(
        ctx,
        hazard.x + 4,
        hazard.y + 6,
        Math.max(hazard.width - 8, 4),
        Math.max(hazard.height - 12, 8),
        "#ff6a23",
      );
      drawPixelRect(
        ctx,
        hazard.x + 8,
        hazard.y + 12,
        Math.max(hazard.width - 16, 4),
        Math.max(hazard.height - 20, 6),
        "#ffd36d",
      );
    });
    drawProgressBar(ctx, this.durationMs, scratch.elapsedMs, "DOOM", "#ffb149");
  },
};
