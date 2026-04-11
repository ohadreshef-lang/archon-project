export const BOARD_SIZE = 9;
export const TILE_SIZE = 64;
export const BOARD_PIXEL_SIZE = BOARD_SIZE * TILE_SIZE;

// Power point positions [col, row]
export const POWER_POINTS: [number, number][] = [
  [4, 4], // center
  [0, 4], // left edge (Light home)
  [8, 4], // right edge (Dark home)
  [4, 0], // top edge
  [4, 8], // bottom edge
];

// Luminance cycle: 0=black, 1=dark blue, 2=purple, 3=green, 4=cyan, 5=white
export const LUMINANCE_COLORS = [
  0x000000, // 0 black
  0x00008b, // 1 dark blue
  0x800080, // 2 purple
  0x008000, // 3 green
  0x00ffff, // 4 cyan
  0xffffff, // 5 white
];

export const LUMINANCE_CYCLE_LENGTH = 12; // turns per full half-cycle

// Squares that oscillate with luminance cycle (indices on 9x9 board)
// Roughly every 3rd square in a checkerboard-like pattern
export const OSCILLATING_SQUARES: Set<number> = new Set([
  1, 3, 5, 7,
  9, 11, 13, 15, 17,
  19, 21, 23, 25, 27,
  28, 30, 32, 34, 36,
  37, 39, 41, 43, 45,
  46, 48, 50, 52, 54,
  55, 57, 59, 61, 63,
  64, 66, 68, 70, 72,
  73, 75, 77, 79,
]);

export const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
