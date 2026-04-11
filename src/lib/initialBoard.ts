import type { BoardPiece } from "./types";
import { createPiece } from "./pieceDefinitions";

let idCounter = 0;
const uid = () => `p${++idCounter}`;

/**
 * Returns the initial 9x9 board with all pieces in starting positions.
 * Light side: rows 7–8 (bottom), Dark side: rows 0–1 (top).
 */
export function createInitialBoard(): (BoardPiece | null)[][] {
  const board: (BoardPiece | null)[][] = Array.from({ length: 9 }, () =>
    Array(9).fill(null)
  );

  const place = (type: Parameters<typeof createPiece>[0], side: Parameters<typeof createPiece>[1], col: number, row: number) => {
    const piece = createPiece(type, side, uid());
    board[row][col] = { ...piece, col, row };
  };

  // --- LIGHT SIDE (bottom two rows) ---
  // Back row (row 8): Valkyrie, Archer, Golem, Unicorn, Wizard, Unicorn, Golem, Archer, Valkyrie
  //                   + Phoenix at col 3, Djinni at col 5 (displacing Unicorns? No — Wizard at col 4, flanked)
  // Faithful to original layout:
  place("valkyrie", "light", 0, 8);
  place("archer",   "light", 1, 8);
  place("golem",    "light", 2, 8);
  place("phoenix",  "light", 3, 8);
  place("wizard",   "light", 4, 8);
  place("djinni",   "light", 5, 8);
  place("golem",    "light", 6, 8);
  place("archer",   "light", 7, 8);
  place("valkyrie", "light", 8, 8);

  // Second row from bottom (row 7): Unicorns flanking center, knights filling rest
  place("unicorn", "light", 1, 7);
  place("unicorn", "light", 7, 7);
  for (const col of [0, 2, 3, 4, 5, 6, 8]) {
    place("knight", "light", col, 7);
  }

  // --- DARK SIDE (top two rows) ---
  // Back row (row 0)
  place("banshee",     "dark", 0, 0);
  place("manticore",   "dark", 1, 0);
  place("troll",       "dark", 2, 0);
  place("shapeshifter","dark", 3, 0);
  place("sorceress",   "dark", 4, 0);
  place("dragon",      "dark", 5, 0);
  place("troll",       "dark", 6, 0);
  place("manticore",   "dark", 7, 0);
  place("banshee",     "dark", 8, 0);

  // Second row from top (row 1)
  place("basilisk", "dark", 1, 1);
  place("basilisk", "dark", 7, 1);
  for (const col of [0, 2, 3, 4, 5, 6, 8]) {
    place("goblin", "dark", col, 1);
  }

  return board;
}
