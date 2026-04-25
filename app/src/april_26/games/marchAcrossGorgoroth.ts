import type { CanvasQuestConfig } from "./playableQuestConfigs";
import {
  drawHero,
  drawPixelRect,
  drawProgressBar,
  QUEST_GAME_CANVAS_HEIGHT,
  QUEST_GAME_CANVAS_WIDTH,
  QUEST_GAME_LANES,
  randomBetween,
  runSurvivalUpdate,
} from "./shared";

const config = {
  durationMs: 18000,
  movement: "free" as const,
  playerSpeed: 0.22,
  minX: 24,
  maxX: QUEST_GAME_CANVAS_WIDTH - 46,
  spawnMinMs: 420,
  spawnMaxMs: 720,
  successText: "The ash plain is behind you. Mount Doom looms ahead.",
  failureText: "The burning ground caught you. Cross Gorgoroth again.",
};

export const marchAcrossGorgorothConfig: CanvasQuestConfig = {
  engine: "canvas",
  controlsText: "Move with A / D or the arrow keys.",
  objectiveText: "Shift lanes across the ash plain and avoid the burning vents.",
  introText: "Press start to cross the ash plain.",
  runningText: "Heat below. Ash above. Keep the ring moving.",
  successText: config.successText,
  failureText: config.failureText,
  durationMs: config.durationMs,
  setup(scratch) {
    scratch.player = { x: QUEST_GAME_LANES[1], y: 268, width: 22, height: 26 };
    scratch.spawnTimerMs = 340;
  },
  update(deltaMs, scratch, input) {
    return runSurvivalUpdate(deltaMs, scratch, input, {
      ...config,
      spawnHazard(s) {
        const lane = Math.floor(Math.random() * QUEST_GAME_LANES.length);
        s.hazards.push({
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
    });
  },
  draw(ctx, scratch) {
    drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, QUEST_GAME_CANVAS_HEIGHT, "#22110d");
    drawPixelRect(ctx, 0, 0, QUEST_GAME_CANVAS_WIDTH, 80, "#39211b");
    drawPixelRect(ctx, 0, 80, QUEST_GAME_CANVAS_WIDTH, 280, "#5a3828");
    for (const laneX of QUEST_GAME_LANES) {
      drawPixelRect(ctx, laneX - 4, 90, 8, 220, "#8f6746");
    }
    for (let i = 0; i < 24; i += 1) {
      drawPixelRect(ctx, (i * 28) % QUEST_GAME_CANVAS_WIDTH, 98 + ((i * 17) % 220), 6, 4, "#aa8254");
    }
    drawHero(ctx, scratch.player, { skin: "#ead4b0", hair: "#4a311d", tunic: "#70593b", accent: "#f4c86c" });
    scratch.hazards.forEach((hazard) => {
      drawPixelRect(ctx, hazard.x, hazard.y, hazard.width, hazard.height, "#781c14");
      drawPixelRect(
        ctx,
        hazard.x + 6,
        hazard.y + 8,
        hazard.width - 12,
        hazard.height - 16,
        "#ff7b2f",
      );
      drawPixelRect(
        ctx,
        hazard.x + 12,
        hazard.y + 16,
        hazard.width - 24,
        hazard.height - 28,
        "#ffd269",
      );
    });
    drawProgressBar(ctx, this.durationMs, scratch.elapsedMs, "ASH", "#ff9d3f");
  },
};
