import type { PieceStats, PieceType, Side } from "./types";

type PieceDef = Omit<PieceStats, "hp" | "id" | "imprisoned">;

const PIECE_DEFS: Record<PieceType, PieceDef> = {
  // Light side
  wizard: {
    type: "wizard", side: "light", maxHp: 15, moveRange: 3,
    movementType: "teleport", attackRange: 200, attackSpeed: 1.0, projectileSpeed: 300,
  },
  unicorn: {
    type: "unicorn", side: "light", maxHp: 14, moveRange: 4,
    movementType: "ground", attackRange: 180, attackSpeed: 2.0, projectileSpeed: 350,
  },
  archer: {
    type: "archer", side: "light", maxHp: 12, moveRange: 3,
    movementType: "ground", attackRange: 150, attackSpeed: 1.2, projectileSpeed: 280,
  },
  valkyrie: {
    type: "valkyrie", side: "light", maxHp: 13, moveRange: 3,
    movementType: "flying", attackRange: 140, attackSpeed: 1.0, projectileSpeed: 260,
  },
  golem: {
    type: "golem", side: "light", maxHp: 20, moveRange: 3, // spec: Ground (3)
    movementType: "ground", attackRange: 200, attackSpeed: 0.5, projectileSpeed: 200,
  },
  djinni: {
    type: "djinni", side: "light", maxHp: 14, moveRange: 4,
    movementType: "flying", attackRange: 180, attackSpeed: 1.8, projectileSpeed: 320,
  },
  phoenix: {
    type: "phoenix", side: "light", maxHp: 16, moveRange: 5,
    movementType: "flying", attackRange: 120, attackSpeed: 1.5, projectileSpeed: 250,
  },
  knight: {
    type: "knight", side: "light", maxHp: 8, moveRange: 3,
    movementType: "ground", attackRange: 48, attackSpeed: 2.5, projectileSpeed: 0,
  },

  // Dark side
  sorceress: {
    type: "sorceress", side: "dark", maxHp: 15, moveRange: 3,
    movementType: "teleport", attackRange: 200, attackSpeed: 1.0, projectileSpeed: 300,
  },
  basilisk: {
    type: "basilisk", side: "dark", maxHp: 10, moveRange: 4, // spec: Ground (4)
    movementType: "ground", attackRange: 180, attackSpeed: 2.0, projectileSpeed: 350,
  },
  manticore: {
    type: "manticore", side: "dark", maxHp: 12, moveRange: 3,
    movementType: "ground", attackRange: 150, attackSpeed: 1.2, projectileSpeed: 280,
  },
  banshee: {
    type: "banshee", side: "dark", maxHp: 13, moveRange: 3,
    movementType: "flying", attackRange: 80, attackSpeed: 1.0, projectileSpeed: 0,
  },
  troll: {
    type: "troll", side: "dark", maxHp: 20, moveRange: 3, // spec: Ground (3)
    movementType: "ground", attackRange: 200, attackSpeed: 0.5, projectileSpeed: 200,
  },
  dragon: {
    type: "dragon", side: "dark", maxHp: 22, moveRange: 4,
    movementType: "flying", attackRange: 200, attackSpeed: 0.4, projectileSpeed: 220,
  },
  shapeshifter: {
    type: "shapeshifter", side: "dark", maxHp: 16, moveRange: 5,
    movementType: "flying", attackRange: 120, attackSpeed: 1.5, projectileSpeed: 250,
  },
  goblin: {
    type: "goblin", side: "dark", maxHp: 8, moveRange: 3,
    movementType: "ground", attackRange: 48, attackSpeed: 2.5, projectileSpeed: 0,
  },

  // Elementals (summoned)
  elemental_fire: {
    type: "elemental_fire", side: "light", maxHp: 14, moveRange: 4,
    movementType: "flying", attackRange: 160, attackSpeed: 1.5, projectileSpeed: 300,
  },
  elemental_earth: {
    type: "elemental_earth", side: "light", maxHp: 13, moveRange: 3,
    movementType: "ground", attackRange: 140, attackSpeed: 1.2, projectileSpeed: 260,
  },
  elemental_water: {
    type: "elemental_water", side: "light", maxHp: 13, moveRange: 3,
    movementType: "flying", attackRange: 150, attackSpeed: 1.3, projectileSpeed: 270,
  },
  elemental_air: {
    type: "elemental_air", side: "light", maxHp: 12, moveRange: 5,
    movementType: "flying", attackRange: 160, attackSpeed: 1.4, projectileSpeed: 290,
  },
};

export function createPiece(type: PieceType, side: Side, id: string): PieceStats & { id: string } {
  const def = { ...PIECE_DEFS[type], side };
  return {
    ...def,
    id,
    hp: def.maxHp,
    imprisoned: false,
  };
}

export { PIECE_DEFS };
