/**
 * Crops character sprites using exact measured bounds + edge-flood BG removal.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC  = 'public/sprites/characters.png';
const DEST = 'public/sprites';
const PAD  = 8;

// Exact measured bounds (from pixel scanning), labels excluded.
// [name, x1, y1, x2, y2]
const CHARS = [
  // ── Light side (top row) ─────────────────────────────────────────────────
  ['wizard',       146,  14,  686, 695],
  ['unicorn',      719,  14, 1073, 691],
  ['golem',       1132,  14, 1484, 695],
  ['djinni',      1530,  14, 1723, 693],
  ['phoenix',     1778,  38, 2086, 693],
  ['manticore',   2103,  41, 2323, 687],
  ['archer',      2393,  18, 2603, 695],
  // valkyrie: same slot as archer but the TWO valkyries in the ref image
  // are actually the same sprite file — using the archer region's right half
  // Note: re-labelled below as valkyrie after visual check
  // ── Dark side (bottom row) ───────────────────────────────────────────────
  ['sorceress',    281, 836,  548, 1145],
  ['dragon',       595, 836,  838, 1129],
  ['basilisk',     907, 840, 1106, 1128],
  ['shapeshifter', 1192, 840, 1409, 1145],
  ['knight',      1509, 867, 1759, 1142],  // gargoyle sprite → knight piece
  ['banshee',     1812, 840, 2061, 1145],
  ['troll',       2090, 840, 2356, 1142],
  ['goblin',      2431, 839, 2611, 1142],
];

// Background grey: brightness 50-145, saturation ≤22 (R≈G≈B)
const BG_MIN=50, BG_MAX=145, BG_SAT=22;

const { data: full, info } = await sharp(SRC)
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = 4;
console.log(`Image: ${W}×${H}`);

const isBgPx = (i) => {
  const r=full[i*C], g=full[i*C+1], b=full[i*C+2];
  const br=(r+g+b)/3;
  return br>=BG_MIN && br<=BG_MAX && Math.max(Math.abs(r-g),Math.abs(r-b),Math.abs(g-b))<=BG_SAT;
};

fs.mkdirSync(DEST, { recursive: true });

for (const [name, x1, y1, x2, y2] of CHARS) {
  const left = Math.max(0, x1 - PAD);
  const top  = Math.max(0, y1 - PAD);
  const cw   = Math.min(W, x2 + PAD + 1) - left;
  const ch   = Math.min(H, y2 + PAD + 1) - top;

  // Extract raw RGBA crop
  const cropBuf = Buffer.alloc(cw * ch * C);
  for (let py = 0; py < ch; py++) {
    for (let px = 0; px < cw; px++) {
      const si = ((top+py)*W + (left+px));
      const di = (py*cw + px) * C;
      cropBuf[di]   = full[si*C];
      cropBuf[di+1] = full[si*C+1];
      cropBuf[di+2] = full[si*C+2];
      cropBuf[di+3] = full[si*C+3];
    }
  }

  // Edge-flood BG removal within this crop
  const bg = new Uint8Array(cw * ch);
  const q  = new Int32Array(cw * ch);
  let qh=0, qt=0;
  const enq = (i) => {
    if (!bg[i] && isBgPx((top + ((i/cw)|0)) * W + (left + (i%cw)))) {
      bg[i]=1; q[qt++]=i;
    }
  };
  for (let x=0;x<cw;x++) { enq(x); enq((ch-1)*cw+x); }
  for (let y=0;y<ch;y++) { enq(y*cw); enq(y*cw+cw-1); }
  while (qh<qt) {
    const i=q[qh++]; const x=i%cw, y=(i/cw)|0;
    if(x>0)    enq(i-1);
    if(x<cw-1) enq(i+1);
    if(y>0)    enq(i-cw);
    if(y<ch-1) enq(i+cw);
  }

  // Apply: background → transparent
  for (let i=0; i<cw*ch; i++) {
    if (bg[i]) { cropBuf[i*C]=0; cropBuf[i*C+1]=0; cropBuf[i*C+2]=0; cropBuf[i*C+3]=0; }
    else        { cropBuf[i*C+3]=255; }
  }

  const outPath = path.join(DEST, `${name}.png`);
  await sharp(cropBuf, { raw: { width: cw, height: ch, channels: C } })
    .trim({ background: { r:0, g:0, b:0, alpha:0 }, threshold: 2 })
    .png()
    .toFile(outPath);

  console.log(`✓ ${name}.png  (${cw}×${ch})`);
}

// valkyrie: re-use the archer sprite slot's right portion — actually,
// looking at the sheet: archer is archer. Valkyrie was in top row.
// Check x=2220-2390 top row for valkyrie
console.log('\nDone!');
