import type { BoardPiece, Side } from "./types";

const BOARD_SIZE = 9;

/** Pure move computation — used by both BoardScene and AI. */
export function computeValidMoves(
  board: (BoardPiece | null)[][],
  piece: BoardPiece,
): { moves: [number, number][]; attacks: [number, number][] } {
  const moves: [number, number][] = [];
  const attacks: [number, number][] = [];
  const range = piece.moveRange;

  const add = (c: number, r: number): boolean => {
    if (c < 0 || c >= BOARD_SIZE || r < 0 || r >= BOARD_SIZE) return false;
    const occ = board[r][c];
    if (occ?.side === piece.side) return false;
    if (occ) { attacks.push([c, r]); return false; }
    moves.push([c, r]);
    return true;
  };

  if (piece.movementType === "teleport") {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (r !== piece.row || c !== piece.col) add(c, r);
  } else if (piece.movementType === "flying") {
    for (let dr = -range; dr <= range; dr++)
      for (let dc = -range; dc <= range; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (Math.max(Math.abs(dr), Math.abs(dc)) > range) continue;
        add(piece.col + dc, piece.row + dr);
      }
  } else {
    // ground: cardinal directions, blocked by pieces
    for (const [dc, dr] of [[0,1],[0,-1],[1,0],[-1,0]] as [number,number][]) {
      for (let step = 1; step <= range; step++) {
        if (!add(piece.col + dc * step, piece.row + dr * step)) break;
      }
    }
  }

  return { moves, attacks };
}

/** Pick the best AI move for `aiSide`. Returns null if no moves available. */
export function pickAIMove(
  board: (BoardPiece | null)[][],
  aiSide: Side,
): { from: [number, number]; to: [number, number] } | null {
  const enemySide: Side = aiSide === "light" ? "dark" : "light";

  // Find enemy caster position (highest-value target)
  let casterPos: [number, number] | null = null;
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (p?.side === enemySide && (p.type === "wizard" || p.type === "sorceress"))
        casterPos = [c, r];
    }

  type Candidate = { from: [number, number]; to: [number, number]; score: number };
  const candidates: Candidate[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece || piece.side !== aiSide) continue;

      const { moves, attacks } = computeValidMoves(board, piece);

      for (const [tc, tr] of attacks) {
        const target = board[tr][tc]!;
        const isCaster = target.type === "wizard" || target.type === "sorceress";
        candidates.push({
          from: [c, r], to: [tc, tr],
          score: isCaster ? 2000 : 200 + target.maxHp,
        });
      }

      for (const [tc, tr] of moves) {
        let score = 10 + Math.random() * 5;
        // Reward moving toward enemy caster
        if (casterPos) {
          const [ec, er] = casterPos;
          const curDist = Math.abs(c - ec) + Math.abs(r - er);
          const newDist = Math.abs(tc - ec) + Math.abs(tr - er);
          score += (curDist - newDist) * 8;
        }
        candidates.push({ from: [c, r], to: [tc, tr], score });
      }
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  // Pick randomly from top-3 to avoid pure determinism
  const pool = candidates.slice(0, Math.min(3, candidates.length));
  return pool[Math.floor(Math.random() * pool.length)];
}
