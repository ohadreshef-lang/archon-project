import type { BoardPiece } from "./types";
import { createPiece } from "./pieceDefinitions";

let idCounter = 0;
const uid = () => `p${++idCounter}`;

/**
 * Returns the initial 9x9 board with all pieces in starting positions.
 * Light side: cols 0–1 (left).  Wizard at col 0 row 4 = A5 power point.
 * Dark side:  cols 7–8 (right). Sorceress at col 8 row 4 = I5 power point.
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

  // ── LIGHT SIDE — left two columns ──────────────────────────────────────
  // Back column (col 0): mirrors original back row, Wizard at row 4 = A5 ✓
  place("valkyrie", "light", 0, 0);
  place("archer",   "light", 0, 1);
  place("golem",    "light", 0, 2);
  place("phoenix",  "light", 0, 3);
  place("wizard",   "light", 0, 4); // A5 power point
  place("djinni",   "light", 0, 5);
  place("golem",    "light", 0, 6);
  place("archer",   "light", 0, 7);
  place("valkyrie", "light", 0, 8);

  // Front column (col 1): mirrors original front row
  place("knight",  "light", 1, 0);
  place("unicorn", "light", 1, 1);
  place("knight",  "light", 1, 2);
  place("knight",  "light", 1, 3);
  place("knight",  "light", 1, 4);
  place("knight",  "light", 1, 5);
  place("knight",  "light", 1, 6);
  place("unicorn", "light", 1, 7);
  place("knight",  "light", 1, 8);

  // ── DARK SIDE — right two columns ──────────────────────────────────────
  // Back column (col 8): Sorceress at row 4 = I5 ✓
  place("banshee",      "dark", 8, 0);
  place("manticore",    "dark", 8, 1);
  place("troll",        "dark", 8, 2);
  place("shapeshifter", "dark", 8, 3);
  place("sorceress",    "dark", 8, 4); // I5 power point
  place("dragon",       "dark", 8, 5);
  place("troll",        "dark", 8, 6);
  place("manticore",    "dark", 8, 7);
  place("banshee",      "dark", 8, 8);

  // Front column (col 7)
  place("goblin",   "dark", 7, 0);
  place("basilisk", "dark", 7, 1);
  place("goblin",   "dark", 7, 2);
  place("goblin",   "dark", 7, 3);
  place("goblin",   "dark", 7, 4);
  place("goblin",   "dark", 7, 5);
  place("goblin",   "dark", 7, 6);
  place("basilisk", "dark", 7, 7);
  place("goblin",   "dark", 7, 8);

  return board;
}
