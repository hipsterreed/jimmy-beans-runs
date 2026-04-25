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
  durationMs: 17000,
  movement: "free" as const,
  playerSpeed: 0.24,
  minX: 18,
  maxX: QUEST_GAME_CANVAS_WIDTH - 44,
  spawnMinMs: 260,
  spawnMaxMs: 460,
  successText: "You slip free of Shelob's lair and reach the stairs above.",
  failureText: "The webs caught you. Try the tunnel again.",
};

export const shelobsLairConfig: CanvasQuestConfig = {
  engine: "canvas",
  controlsText: "Move with A / D or the arrow keys.",
  objectiveText: "Slip through the webs and do not get caught in the dark.",
  introText: "Press start to enter the tunnel.",
  runningText: "Webs ahead. Keep moving and stay clear.",
  successText: config.successText,
  failureText: config.failureText,
  durationMs: config.durationMs,
  setup(scratch) {
    scratch.player = { x: 298, y: 288, width: 22, height: 22 };
    scratch.spawnTimerMs = 200;
  },
  update(deltaMs, scratch, input) {
    return runSurvivalUpdate(deltaMs, scratch, input, {
      ...config,
      spawnHazard(s) {
        const fromLeft = Math.random() > 0.5;
        s.hazards.push({
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
    });
  },
  draw(ctx, scratch) {
    drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#0a090f");
    drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 66, "#15111c");
    drawPixelRect(ctx, 0, 280, QUEST_GAME_CANVAS_WIDTH, 80, "#1f1712");
    for (let i = 0; i < 9; i += 1) {
      drawPixelRect(ctx, 40 + i * 68, 0, 2, 100 + (i % 3) * 40, "#ded8df");
      drawPixelRect(ctx, 40 + i * 68, 40 + (i % 2) * 40, 28, 2, "#ded8df");
    }
    drawHero(ctx, scratch.player, { skin: "#ead9bc", hair: "#4b3825", tunic: "#5a6140", accent: "#ffd15c" });
    scratch.hazards.forEach((hazard) => {
      drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#dad4df");
      drawPixelRect(ctx, hazard.x + 6, hazard.y + 6, hazard.width - 12, hazard.height - 12, "#b9b0c2");
    });
    drawProgressBar(ctx, this.durationMs, scratch.elapsedMs, "LAIR", "#d8d0e8");
  },
};
