import type { CanvasQuestConfig } from "./playableQuestConfigs";
import {
  drawPixelRect,
  drawRatioBar,
  QUEST_GAME_CANVAS_HEIGHT,
  QUEST_GAME_CANVAS_WIDTH,
  type QuestScratch,
  type UpdateResult,
} from "./shared";

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

type Direction = "left" | "right" | "up" | "down";

const FORD_DIRS: Record<Direction, { x: number; y: number }> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

type FordEntity = {
  col: number;
  row: number;
  x: number;
  y: number;
  direction: Direction | null;
  pendingDirection?: Direction;
  tint?: string;
};

type FordScratch = {
  pellets: Set<string>;
  totalPellets: number;
  player: FordEntity;
  ghosts: FordEntity[];
};

function fordCellCenter(col: number, row: number) {
  return {
    x: FORD_OFFSET_X + col * FORD_TILE + FORD_TILE / 2,
    y: FORD_OFFSET_Y + row * FORD_TILE + FORD_TILE / 2,
  };
}

function fordMazeChar(col: number, row: number) {
  const rowText = FORD_MAZE[row];
  if (!rowText) return "#";
  return rowText[col] ?? "#";
}

function fordWalkable(col: number, row: number): boolean {
  return fordMazeChar(col, row) !== "#";
}

function fordAligned(entity: FordEntity): boolean {
  const center = fordCellCenter(entity.col, entity.row);
  return Math.abs(entity.x - center.x) < 0.45 && Math.abs(entity.y - center.y) < 0.45;
}

function snapFordEntity(entity: FordEntity) {
  const center = fordCellCenter(entity.col, entity.row);
  entity.x = center.x;
  entity.y = center.y;
}

function makeFordGhost(col: number, row: number, direction: Direction, tint: string): FordEntity {
  const center = fordCellCenter(col, row);
  return { col, row, x: center.x, y: center.y, direction, tint };
}

function oppositeDirection(direction: Direction | null): Direction | null {
  if (!direction) return null;
  return ({ left: "right", right: "left", up: "down", down: "up" } as Record<Direction, Direction>)[direction];
}

function chooseFordGhostDirection(ghost: FordEntity, player: FordEntity): Direction {
  const opposite = oppositeDirection(ghost.direction);
  const options = (Object.entries(FORD_DIRS) as [Direction, { x: number; y: number }][])
    .filter(([name, dir]) => {
      if (opposite && name === opposite) return false;
      return fordWalkable(ghost.col + dir.x, ghost.row + dir.y);
    })
    .map(([name, dir]) => {
      const nextCol = ghost.col + dir.x;
      const nextRow = ghost.row + dir.y;
      const distance = Math.abs(player.col - nextCol) + Math.abs(player.row - nextRow);
      return { name, distance };
    });

  if (options.length === 0) return opposite ?? "left";
  if (Math.random() < 0.28) {
    return options[Math.floor(Math.random() * options.length)].name;
  }
  options.sort((a, b) => a.distance - b.distance);
  return options[0].name;
}

function advanceFordEntity(entity: FordEntity, speed: number, deltaMs: number) {
  if (!entity.direction) return;
  const dir = FORD_DIRS[entity.direction];
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

function drawFordPlayer(ctx: CanvasRenderingContext2D, player: FordEntity) {
  const angleByDir: Record<Direction, number> = {
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

function drawFordGhost(ctx: CanvasRenderingContext2D, ghost: FordEntity) {
  ctx.fillStyle = ghost.tint ?? "#d8dde8";
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

function getFordData(scratch: QuestScratch): FordScratch {
  return scratch.questData as unknown as FordScratch;
}

export const flightToTheFordConfig: CanvasQuestConfig = {
  engine: "canvas",
  controlsText: "Move with W A S D or the arrow keys.",
  objectiveText:
    "Guide Frodo and Arwen through the woods, collect every light, and avoid the Ringwraiths.",
  introText: "Press start to ride the hidden paths.",
  runningText: "Wraiths in the woods. Clear the path to the ford.",
  successText: "Every woodland light is claimed. The ford is clear ahead.",
  failureText: "A Ringwraith closed in on the trail. Try the crossing again.",
  durationMs: 99999,
  setup(scratch) {
    const pellets = new Set<string>();
    FORD_MAZE.forEach((rowText, row) => {
      [...rowText].forEach((cell, col) => {
        if (cell === "." || cell === "o") {
          pellets.add(`${col},${row}`);
        }
      });
    });
    const start = fordCellCenter(1, 1);
    scratch.questData = {
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
    } satisfies FordScratch as unknown as Record<string, unknown>;
  },
  update(deltaMs, scratch, input): UpdateResult {
    const data = getFordData(scratch);
    const player = data.player;

    if (input.direction) {
      player.pendingDirection = input.direction;
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

    const hitGhost = data.ghosts.some(
      (ghost) => Math.hypot(player.x - ghost.x, player.y - ghost.y) < 18,
    );
    if (hitGhost) return { status: "failure", message: this.failureText };
    if (data.pellets.size === 0) return { status: "success", message: this.successText };

    scratch.elapsedMs += deltaMs;
    return { status: "running" };
  },
  draw(ctx, scratch) {
    const data = getFordData(scratch);
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
      drawPixelRect(
        ctx,
        center.x - (isBig ? 5 : 3),
        center.y - (isBig ? 5 : 3),
        isBig ? 10 : 6,
        isBig ? 10 : 6,
        isBig ? "#dff4a8" : "#f4d38b",
      );
    });

    if (data.player) drawFordPlayer(ctx, data.player);
    data.ghosts.forEach((ghost) => drawFordGhost(ctx, ghost));

    const collected = data.totalPellets - data.pellets.size;
    drawRatioBar(ctx, collected / Math.max(data.totalPellets, 1), "FORD", "#9bd36b");
  },
};
