import { drawPixelRect } from "./shared";

export const ENDING_CANVAS_WIDTH = 720;
export const ENDING_CANVAS_HEIGHT = 404;
export const ENDING_DURATION_MS = 12000;

type EndingPalette = {
  skin: string;
  hair: string;
  body: string;
  accent: string;
  leg: string;
};

function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = "#f7e7bf",
) {
  ctx.fillStyle = color;
  ctx.font = '20px "VT323"';
  ctx.fillText(text, x, y);
}

function drawEndingCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette: EndingPalette,
  frame = 0,
  facing = 1,
) {
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

function drawMasegoth(ctx: CanvasRenderingContext2D, x: number, y: number, frame = 0) {
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

function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number) {
  drawPixelRect(ctx, x, y + 2, 10, 6, "#d99f25");
  drawPixelRect(ctx, x + 2, y, 6, 2, "#ffd66a");
  drawPixelRect(ctx, x + 2, y + 8, 6, 2, "#ffd66a");
  drawPixelRect(ctx, x + 3, y + 3, 4, 4, "#2a1a10");
}

function drawLavaBurst(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  drawPixelRect(ctx, x, y, 8 * scale, 14 * scale, "#ff7a2f");
  drawPixelRect(ctx, x + 2 * scale, y - 4 * scale, 4 * scale, 6 * scale, "#ffd36d");
}

export function drawEndingFrame(ctx: CanvasRenderingContext2D, frameMs: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ENDING_CANVAS_WIDTH, ENDING_CANVAS_HEIGHT);

  const beat = Math.floor(frameMs / 220);
  const samPalette: EndingPalette = { skin: "#f0dfbf", hair: "#734325", body: "#4b7a35", accent: "#c8e0f7", leg: "#5e3e24" };
  const frodoPalette: EndingPalette = { skin: "#f0dfbf", hair: "#5e3a22", body: "#7684a5", accent: "#f8f1ce", leg: "#5e3e24" };

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
      drawEndingCharacter(ctx, samX, 254 + (beat % 2), samPalette, beat, 1);
      drawEndingCharacter(ctx, frodoX, 248 + ((beat + 1) % 2), frodoPalette, beat, 1);
      drawRing(ctx, frodoX + 24, 268);
      drawPixelText(ctx, "Mount Doom", 536, 56, "#f0c75e");
    } else if (frameMs < 6200) {
      const attack = (frameMs - 3600) / 2600;
      const frodoX = 320;
      const samX = 258;
      const maseX = 560 - attack * 180;
      const maseY = 212 - Math.sin(attack * Math.PI) * 74;
      drawEndingCharacter(ctx, samX, 255 + (beat % 2), samPalette, beat, 1);
      drawEndingCharacter(ctx, frodoX, 249, frodoPalette, beat, 1);
      drawRing(ctx, frodoX + 24, 268);
      drawMasegoth(ctx, maseX, maseY, beat);
      drawPixelText(ctx, "MaseGoth attacks", 26, 44, "#ffd36d");
    } else {
      const toss = (frameMs - 6200) / 2400;
      const frodoX = 330;
      const samX = 268;
      const arcX = 390 + toss * 120;
      const arcY = 224 - Math.sin(toss * Math.PI) * 102;
      drawEndingCharacter(ctx, samX, 255 + (beat % 2), samPalette, beat, 1);
      drawEndingCharacter(ctx, frodoX, 248, frodoPalette, beat, 1);
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
      drawEndingCharacter(
        ctx,
        member.x,
        244 + ((beat + index) % 2) * 2,
        { skin: "#f0dfbf", hair: member.hair, body: member.body, accent: "#f8f1ce", leg: "#5e3e24" },
        beat + index,
        1,
      );
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
