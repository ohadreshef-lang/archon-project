export const BOARD_SIZE = 9;
export const TILE_SIZE = 64;
export const BOARD_PIXEL_SIZE = BOARD_SIZE * TILE_SIZE;

// Power point positions [col, row]
export const POWER_POINTS: [number, number][] = [
  [4, 4], // E5 — center (oscillating)
  [0, 4], // A5 — left edge, Light home (permanently light)
  [8, 4], // I5 — right edge, Dark home (permanently dark)
  [4, 0], // E1 — top edge (oscillating)
  [4, 8], // E9 — bottom edge (oscillating)
];

// A5 and I5 are permanently assigned — they do NOT oscillate
export const LIGHT_HOME: [number, number] = [0, 4]; // [col, row]
export const DARK_HOME:  [number, number] = [8, 4];

// Luminance cycle: 6 pure-grayscale steps from near-black → near-white.
// R = G = B at every step — no hue, no tint, no green.
export const LUMINANCE_COLORS = [
  0x1a1a1a, // step 0 — near black
  0x3c3c3c, // step 1 — dark grey
  0x666666, // step 2 — mid-dark grey
  0x999999, // step 3 — mid-light grey
  0xc0c0c0, // step 4 — light grey
  0xe8e8e8, // step 5 — near white
];

export const LUMINANCE_CYCLE_LENGTH = 12; // turns per full half-cycle

// Archon-correct oscillating squares (31 total ≈ 1/3 of board):
//   • All of column E (col 4): 9 squares
//   • Middle row (row 4) except A5 (col 0) and I5 (col 8): 6 squares
//   • Inner 2×2 of each corner quadrant (4 quadrants × 4 squares): 16 squares
//
// Each quadrant is 4×4 (e.g. rows 0-3, cols 0-3). Its inner 2×2 contains
// 2 light + 2 dark squares → 6 light + 6 dark + 4 oscillating = 16 ✓
export const OSCILLATING_SQUARES: Set<number> = new Set([
  // Column 4 (col E), all rows  — index = row*9+4
  4, 13, 22, 31, 40, 49, 58, 67, 76,

  // Row 4 extras (not col 0, col 4, col 8)
  37, 38, 39, 41, 42, 43,

  // Top-left quadrant inner 2×2 (rows 1-2, cols 1-2)
  10, 11, 19, 20,

  // Top-right quadrant inner 2×2 (rows 1-2, cols 6-7)
  15, 16, 24, 25,

  // Bottom-left quadrant inner 2×2 (rows 6-7, cols 1-2)
  55, 56, 64, 65,

  // Bottom-right quadrant inner 2×2 (rows 6-7, cols 6-7)
  60, 61, 69, 70,
]);

export const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
