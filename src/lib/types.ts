export type Side = "light" | "dark";

export type PieceType =
  | "wizard"
  | "sorceress"
  | "unicorn"
  | "basilisk"
  | "archer"
  | "manticore"
  | "valkyrie"
  | "banshee"
  | "golem"
  | "troll"
  | "djinni"
  | "dragon"
  | "phoenix"
  | "shapeshifter"
  | "knight"
  | "goblin"
  | "elemental_fire"
  | "elemental_earth"
  | "elemental_water"
  | "elemental_air";

export type SpellType =
  | "teleport"
  | "heal"
  | "shift_time"
  | "exchange"
  | "summon_elemental"
  | "revive"
  | "imprison";

export type MovementType = "ground" | "flying" | "teleport";

export interface PieceStats {
  type: PieceType;
  side: Side;
  maxHp: number;
  hp: number;
  moveRange: number;
  movementType: MovementType;
  attackRange: number;
  attackSpeed: number; // shots per second
  projectileSpeed: number;
  imprisoned: boolean;
}

export interface BoardPiece extends PieceStats {
  id: string;
  col: number;
  row: number;
}

export type SquareType = "light" | "dark" | "oscillating";

export interface GameState {
  board: (BoardPiece | null)[][];
  currentTurn: Side;
  luminanceStep: number; // 0-5
  luminanceDirection: 1 | -1;
  turnCount: number;
  spellsUsed: { light: SpellType[]; dark: SpellType[] };
  casterMaxHp: { light: number; dark: number };
  phase: "strategy" | "combat";
  combat: CombatState | null;
  winner: Side | null;
}

export interface CombatState {
  attackerPieceId: string;
  defenderPieceId: string;
  attackerSide: Side;
  boardCol: number;
  boardRow: number;
  squareLuminance: number;
}

export interface NetworkMessage {
  type: "MOVE" | "SPELL" | "COMBAT_ACTION" | "COMBAT_RESULT" | "JOIN" | "SYNC" | "REQUEST_SYNC";
  payload: unknown;
}
