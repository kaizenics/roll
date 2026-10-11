// Generates the Roll toolbar icons (brand circle with a white "record" dot)
// into public/icon/*.png. Run with `node scripts/generate-icons.mjs`.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const SIZES = [16, 32, 48, 128];
const BRAND = [0x6d, 0x5d, 0xfc];
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

/** Anti-aliased coverage of a circle for the pixel centred at (x, y). */
function coverage(x, y, cx, cy, r) {
  let inside = 0;
  for (let sy = 0; sy < 4; sy += 1) {
    for (let sx = 0; sx < 4; sx += 1) {
      const dx = x + (sx + 0.5) / 4 - cx;
      const dy = y + (sy + 0.5) / 4 - cy;
      if (dx * dx + dy * dy <= r * r) inside += 1;
    }
  }
  return inside / 16;
}

function png(size) {
  const c = size / 2;
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x += 1) {
      const outer = coverage(x, y, c, c, size / 2 - 0.5);
      const inner = coverage(x, y, c, c, size * 0.17);
      const rgb = BRAND.map((v) => Math.round(v * (1 - inner) + 255 * inner));
      row.set([...rgb, Math.round(outer * 255)], 1 + x * 4);
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
