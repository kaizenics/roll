// Generates the Roll toolbar icons into public/icon/*.png. Same artwork as
// apps/web/app/icon.svg (32-unit grid): charcoal tile, light screen outline,
// red camera dot. Run with `node scripts/generate-icons.mjs`.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const SIZES = [16, 32, 48, 128];
const TILE = [0x1f, 0x1e, 0x1c];
const SCREEN = [0xfb, 0xfb, 0xfa];
const RECORD = [0xe5, 0x48, 0x4d];
const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icon");

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** Signed distance to a rounded rectangle (negative inside). */
function roundRect(px, py, x, y, w, h, r) {
  const qx = Math.abs(px - (x + w / 2)) - w / 2 + r;
  const qy = Math.abs(py - (y + h / 2)) - h / 2 + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/** Colour of one point in 32-unit icon space, or null when transparent. */
function sample(u, v) {
  if (roundRect(u, v, 0, 0, 32, 32, 8) > 0) return null;
  const dot = Math.hypot(u - 22.5, v - 20.5);
  if (dot <= 5.5) return RECORD;
  if (dot <= 8) return TILE; // gap ring separating the dot from the screen
  if (Math.abs(roundRect(u, v, 5, 8, 18, 13, 3)) <= 1.25) return SCREEN;
  return TILE;
}

const SUPERSAMPLE = 4;

function png(size) {
  const scale = 32 / size;
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x += 1) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const color = sample(
            (x + (sx + 0.5) / SUPERSAMPLE) * scale,
            (y + (sy + 0.5) / SUPERSAMPLE) * scale,
          );
          if (!color) continue;
          acc[0] += color[0];
          acc[1] += color[1];
          acc[2] += color[2];
          acc[3] += 1;
        }
      }
      const alpha = acc[3] / SUPERSAMPLE ** 2;
      const rgb = acc[3] ? acc.slice(0, 3).map((c) => Math.round(c / acc[3])) : [0, 0, 0];
      row.set([...rgb, Math.round(alpha * 255)], 1 + x * 4);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });
for (const size of SIZES) writeFileSync(join(outDir, `${size}.png`), png(size));
console.log(`Wrote ${SIZES.length} icons to ${outDir}`);
