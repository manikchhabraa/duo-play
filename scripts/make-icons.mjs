import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const iconsDir = path.join(publicDir, "icons");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function rgbPng(size, paint) {
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = paint(x, y, size);
      const i = y * stride + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

function hex(c) {
  return [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function paintDuo(x, y, size, pad = 0) {
  const bg = hex("#07080d");
  const lime = hex("#c8f542");
  const mag = hex("#ff3d8a");
  const nx = (x + 0.5) / size;
  const ny = (y + 0.5) / size;
  const inner = 1 - pad * 2;
  const px = (nx - pad) / inner;
  const py = (ny - pad) / inner;
  if (px < 0 || py < 0 || px > 1 || py > 1) return bg;

  const d1 = Math.hypot(px - 0.38, py - 0.5);
  const d2 = Math.hypot(px - 0.62, py - 0.5);
  const r = 0.26;
  const a1 = Math.max(0, 1 - d1 / r);
  const a2 = Math.max(0, 1 - d2 / r);
  let color = bg;
  if (a1 > 0) color = mix(color, lime, Math.min(1, a1 * 1.8));
  if (a2 > 0) color = mix(color, mag, Math.min(1, a2 * 1.8));
  return color;
}

fs.mkdirSync(iconsDir, { recursive: true });
fs.writeFileSync(path.join(iconsDir, "icon-192.png"), rgbPng(192, (x, y, s) => paintDuo(x, y, s, 0.04)));
fs.writeFileSync(path.join(iconsDir, "icon-512.png"), rgbPng(512, (x, y, s) => paintDuo(x, y, s, 0.04)));
fs.writeFileSync(path.join(iconsDir, "maskable-512.png"), rgbPng(512, (x, y, s) => paintDuo(x, y, s, 0.18)));
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), rgbPng(180, (x, y, s) => paintDuo(x, y, s, 0.06)));
console.log("wrote PWA icons");
