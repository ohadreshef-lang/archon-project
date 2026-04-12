import type { BoardPiece } from "./types";
import { createPiece } from "./pieceDefinitions";

let idCounter = 0;
const uid = () => `p${++idCounter}`;

/**
 * Returns the initial 9×9 board matching the Archon Ultra spec exactly.
 *
 * Light side — Columns A (col 0) & B (col 1):
 *   Col A (back):  Valkyrie / Golem / Unicorn / Djinni / Wizard★ / Phoenix / Unicorn / Golem / Valkyrie
 *   Col B (front): Archer / Knight×7 / Archer
 *
 * Dark side — Columns H (col 7) & I (col 8):
 *   Col H (front): Manticore / Goblin×7 / Manticore
 *   Col I (back):  Banshee / Troll / Basilisk / Shapeshifter / Sorceress★ / Dragon / Basilisk / Troll / Banshee
 *
 * ★ = on Power Point (A5 / I5)
 */
export function createInitialBoard(): (BoardPiece | null)[][] {
  const board: (BoardPiece | null)[][] = Array.from({ length: 9 }, () =>
    Array(9).fill(null)
  );

  const place = (
    type: Parameters<typeof createPiece>[0],
    side: Parameters<typeof createPiece>[1],
    col: number,
    row: number,
  ) => {
    const piece = createPiece(type, side, uid());
    board[row][col] = { ...piece, col, row };
  };

  // ── LIGHT SIDE ──────────────────────────────────────────────────────────
  // Column A (col 0) — back rank
  place("valkyrie", "light", 0, 0); // A1
  place("golem",    "light", 0, 1); // A2
  place("unicorn",  "light", 0, 2); // A3
  place("djinni",   "light", 0, 3); // A4
  place("wizard",   "light", 0, 4); // A5 — Light Power Point
  place("phoenix",  "light", 0, 5); // A6
  place("unicorn",  "light", 0, 6); // A7
  place("golem",    "light", 0, 7); // A8
  place("valkyrie", "light", 0, 8); // A9

  // Column B (col 1) — front rank
  place("archer", "light", 1, 0); // B1
  place("knight", "light", 1, 1); // B2
  place("knight", "light", 1, 2); // B3
  place("knight", "light", 1, 3); // B4
  place("knight", "light", 1, 4); // B5
  place("knight", "light", 1, 5); // B6
  place("knight", "light", 1, 6); // B7
  place("knight", "light", 1, 7); // B8
  place("archer", "light", 1, 8); // B9

  // ── DARK SIDE ───────────────────────────────────────────────────────────
  // Column H (col 7) — front rank
  place("manticore", "dark", 7, 0); // H1
  place("goblin",    "dark", 7, 1); // H2
  place("goblin",    "dark", 7, 2); // H3
  place("goblin",    "dark", 7, 3); // H4
  place("goblin",    "dark", 7, 4); // H5
  place("goblin",    "dark", 7, 5); // H6
  place("goblin",    "dark", 7, 6); // H7
  place("goblin",    "dark", 7, 7); // H8
  place("manticore", "dark", 7, 8); // H9

  // Column I (col 8) — back rank
  place("banshee",      "dark", 8, 0); // I1
  place("troll",        "dark", 8, 1); // I2
  place("basilisk",     "dark", 8, 2); // I3
  place("shapeshifter", "dark", 8, 3); // I4
  place("sorceress",    "dark", 8, 4); // I5 — Dark Power Point
  place("dragon",       "dark", 8, 5); // I6
  place("basilisk",     "dark", 8, 6); // I7
  place("troll",        "dark", 8, 7); // I8
  place("banshee",      "dark", 8, 8); // I9

  return board;
}
