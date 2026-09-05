import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { MAIN_PATH, SAFE_MAIN, YARDS } from "../shared/ludoBoard.js";
import { LADDERS, SNAKES, tileRC } from "../shared/snakesBoard.js";

export const LUDO_PAINT = {
  red: "#d2382f",
  green: "#2c9550",
  blue: "#2b62c9",
  yellow: "#e8b310",
  cream: "#f7f0dd",
  ink: "#2c2a26",
};

type Ctx = CanvasRenderingContext2D;

function surface(pixels: number) {
  const canvas = document.createElement("canvas");
  canvas.width = pixels;
  canvas.height = pixels;
  return { canvas, ctx: canvas.getContext("2d") as Ctx };
}

function finish(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
}

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function star(ctx: Ctx, cx: number, cy: number, outer: number, color: string) {
  const inner = outer * 0.44;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function arrow(ctx: Ctx, cx: number, cy: number, size: number, dir: string, color: string) {
  const angle =
    dir === "right" ? 0 : dir === "down" ? Math.PI / 2 : dir === "left" ? Math.PI : -Math.PI / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(size * 0.55, 0);
  ctx.lineTo(-size * 0.35, -size * 0.5);
  ctx.lineTo(-size * 0.35, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Four bases keyed by quadrant, matching START_OFFSET seating: red = P0, yellow = P1. */
const BASES = [
  { color: LUDO_PAINT.red, row: 0, col: 0, yard: YARDS[0] },
  { color: LUDO_PAINT.green, row: 0, col: 9, yard: [[2, 10], [2, 12], [4, 10], [4, 12]] },
  { color: LUDO_PAINT.blue, row: 9, col: 0, yard: [[10, 2], [10, 4], [12, 2], [12, 4]] },
  { color: LUDO_PAINT.yellow, row: 9, col: 9, yard: YARDS[1] },
];

const STRETCHES = [
  { color: LUDO_PAINT.red, cells: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], dir: "right" },
  { color: LUDO_PAINT.green, cells: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]], dir: "down" },
  { color: LUDO_PAINT.yellow, cells: [[7, 9], [7, 10], [7, 11], [7, 12], [7, 13]], dir: "left" },
  { color: LUDO_PAINT.blue, cells: [[9, 7], [10, 7], [11, 7], [12, 7], [13, 7]], dir: "up" },
];

const STARTS = [
  { index: 0, color: LUDO_PAINT.red, dir: "right" },
  { index: 13, color: LUDO_PAINT.green, dir: "down" },
  { index: 26, color: LUDO_PAINT.yellow, dir: "left" },
  { index: 39, color: LUDO_PAINT.blue, dir: "up" },
];

export function ludoTexture() {
  const cells = 15;
  const unit = 68;
  const size = cells * unit;
  const { canvas, ctx } = surface(size);

  ctx.fillStyle = LUDO_PAINT.cream;
  ctx.fillRect(0, 0, size, size);

  for (const base of BASES) {
    const x = base.col * unit;
    const y = base.row * unit;
    const span = 6 * unit;
    ctx.fillStyle = base.color;
    roundedRect(ctx, x + unit * 0.1, y + unit * 0.1, span - unit * 0.2, span - unit * 0.2, unit * 0.5);
    ctx.fill();
    ctx.fillStyle = LUDO_PAINT.cream;
    roundedRect(ctx, x + unit * 0.85, y + unit * 0.85, span - unit * 1.7, span - unit * 1.7, unit * 0.4);
    ctx.fill();
    for (const [r, c] of base.yard) {
      const cx = c * unit + unit / 2;
      const cy = r * unit + unit / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, unit * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = base.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, unit * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fill();
    }
  }

  const isCross = (r: number, c: number) =>
    (r >= 6 && r <= 8) || (c >= 6 && c <= 8);
  const isCentre = (r: number, c: number) => r >= 6 && r <= 8 && c >= 6 && c <= 8;

  for (let r = 0; r < cells; r += 1) {
    for (let c = 0; c < cells; c += 1) {
      if (!isCross(r, c) || isCentre(r, c)) continue;
      ctx.fillStyle = "#fffdf4";
      ctx.fillRect(c * unit, r * unit, unit, unit);
      ctx.strokeStyle = "rgba(44,42,38,0.5)";
      ctx.lineWidth = Math.max(2, unit * 0.045);
      ctx.strokeRect(c * unit, r * unit, unit, unit);
    }
  }

  for (const stretch of STRETCHES) {
    for (const [r, c] of stretch.cells) {
      ctx.fillStyle = stretch.color;
      ctx.fillRect(c * unit, r * unit, unit, unit);
      ctx.strokeStyle = "rgba(44,42,38,0.45)";
      ctx.lineWidth = Math.max(2, unit * 0.045);
      ctx.strokeRect(c * unit, r * unit, unit, unit);
    }
    const last = stretch.cells[stretch.cells.length - 1];
    arrow(
      ctx,
      last[1] * unit + unit / 2,
      last[0] * unit + unit / 2,
      unit * 0.4,
      stretch.dir,
      "rgba(255,255,255,0.9)"
    );
  }

  for (const start of STARTS) {
    const [r, c] = MAIN_PATH[start.index];
    ctx.fillStyle = start.color;
    ctx.fillRect(c * unit, r * unit, unit, unit);
    ctx.strokeStyle = "rgba(44,42,38,0.5)";
    ctx.lineWidth = Math.max(2, unit * 0.045);
    ctx.strokeRect(c * unit, r * unit, unit, unit);
    arrow(ctx, c * unit + unit / 2, r * unit + unit / 2, unit * 0.36, start.dir, "rgba(255,255,255,0.92)");
  }

  for (const index of SAFE_MAIN) {
    if (STARTS.some((s) => s.index === index)) continue;
    const [r, c] = MAIN_PATH[index];
    star(ctx, c * unit + unit / 2, r * unit + unit / 2, unit * 0.36, "rgba(44,42,38,0.42)");
  }

  const c0 = 6 * unit;
  const c1 = 9 * unit;
  const mid = 7.5 * unit;
  const triangles: [string, [number, number][]][] = [
    [LUDO_PAINT.red, [[c0, c0], [c0, c1], [mid, mid]]],
    [LUDO_PAINT.green, [[c0, c0], [c1, c0], [mid, mid]]],
    [LUDO_PAINT.yellow, [[c1, c0], [c1, c1], [mid, mid]]],
    [LUDO_PAINT.blue, [[c0, c1], [c1, c1], [mid, mid]]],
  ];
  for (const [color, points] of triangles) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    ctx.lineTo(points[1][0], points[1][1]);
    ctx.lineTo(points[2][0], points[2][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = Math.max(2, unit * 0.05);
    ctx.stroke();
  }

  ctx.strokeStyle = LUDO_PAINT.ink;
  ctx.lineWidth = unit * 0.22;
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);

  return finish(canvas);
}

export function snakesTexture() {
  const cells = 10;
  const unit = 104;
  const size = cells * unit;
  const { canvas, ctx } = surface(size);

  ctx.fillStyle = "#f3e8cf";
  ctx.fillRect(0, 0, size, size);

  const ladderFeet = new Set(Object.keys(LADDERS).map(Number));
  const snakeHeads = new Set(Object.keys(SNAKES).map(Number));

  for (let n = 1; n <= 100; n += 1) {
    const { r, c } = tileRC(n);
    const x = c * unit;
    const y = r * unit;
    const warm = (r + c) % 2 === 0;
    let fill = warm ? "#faf3e2" : "#e3d3ae";
    if (ladderFeet.has(n)) fill = warm ? "#dcefd4" : "#c7e2b9";
    if (snakeHeads.has(n)) fill = warm ? "#f6dcd6" : "#eec7bd";
    if (n === 100) fill = "#f2cd57";
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, unit, unit);
    ctx.strokeStyle = "rgba(60,48,32,0.35)";
    ctx.lineWidth = Math.max(2, unit * 0.03);
    ctx.strokeRect(x, y, unit, unit);

    ctx.fillStyle = "rgba(48,40,28,0.85)";
    ctx.font = `700 ${unit * 0.26}px Sora, system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(String(n), x + unit * 0.12, y + unit * 0.1);

    if (n === 100) {
      star(ctx, x + unit * 0.62, y + unit * 0.62, unit * 0.24, "rgba(90,66,10,0.8)");
    }
  }

  ctx.strokeStyle = "#3a2f1e";
  ctx.lineWidth = unit * 0.14;
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);

  return finish(canvas);
}

/** Soft radial pool used as a glow beneath each board. */
export function glowTexture() {
  const { canvas, ctx } = surface(256);
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, "rgba(120,190,255,0.55)");
  gradient.addColorStop(0.45, "rgba(80,120,220,0.22)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return finish(canvas);
}
