import * as Phaser from "phaser";
import { BOARD_SIZE, TILE_SIZE, POWER_POINTS, LUMINANCE_COLORS, OSCILLATING_SQUARES, LIGHT_HOME, DARK_HOME } from "@/lib/constants";
import type { BoardPiece, CombatState, GameState } from "@/lib/types";

// Modern color palette
const LIGHT_TILE   = 0xd1d5db; // cool gray-300
const DARK_TILE    = 0x1f2937; // gray-800
const POWER_COLOR  = 0xf59e0b; // amber
const SELECT_COLOR = 0x3b82f6; // blue
const MOVE_COLOR   = 0x22c55e; // emerald
const ATTACK_COLOR = 0xef4444; // red (enemy valid move)

const LIGHT_PIECE_BG   = 0x1e3a5f; // deep navy
const LIGHT_PIECE_RIM  = 0x93c5fd; // blue-300 rim
const DARK_PIECE_BG    = 0x3b0a1a; // deep crimson
const DARK_PIECE_RIM   = 0xfca5a5; // red-300 rim

// Oscillating squares span from LIGHT_TILE (step 0) → DARK_TILE (step 5)
// so the board looks like a normal symmetric checkerboard at the extremes
// and shows a consistent mid-grey pattern in between.
const OSCILLATING_COLORS = [
  0xd1d5db, // step 0 — full light  (matches LIGHT_TILE)
  0xa8b8c8, // step 1 — light-grey
  0x7a8fa5, // step 2 — medium grey
  0x4a5e75, // step 3 — medium dark
  0x2d3f54, // step 4 — dark slate
  0x1f2937, // step 5 — full dark   (matches DARK_TILE)
];

interface PieceContainer {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  glow: Phaser.GameObjects.Arc;
}

export class BoardScene extends Phaser.Scene {
  private tiles: Phaser.GameObjects.Graphics[][] = [];
  private tileColors: number[][] = [];
  private pieceContainers: Map<string, PieceContainer> = new Map();
  private selectedPieceId: string | null = null;
  private validMoves: Set<string> = new Set();
  private attackMoves: Set<string> = new Set();
  private gameState: GameState | null = null;
  private pendingState: GameState | null = null;
  private onMoveFn?: (from: [number, number], to: [number, number]) => void;
  private playerSide: "light" | "dark" = "light";

  constructor() {
    super({ key: "BoardScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor(0x070b14);
    this.drawBoard();
    this.input.on("pointerdown", this.handleClick, this);
    if (this.pendingState) {
      this.applyState(this.pendingState);
      this.pendingState = null;
    }
  }

  private drawBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
      this.tiles[row] = [];
      this.tileColors[row] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const isLightHome = col === LIGHT_HOME[0] && row === LIGHT_HOME[1];
        const isDarkHome  = col === DARK_HOME[0]  && row === DARK_HOME[1];
        const isOscillating = !isLightHome && !isDarkHome && OSCILLATING_SQUARES.has(row * BOARD_SIZE + col);
        const color = isLightHome ? LIGHT_TILE
          : isDarkHome  ? DARK_TILE
          : isOscillating ? OSCILLATING_COLORS[0]
          : (col + row) % 2 === 0 ? LIGHT_TILE : DARK_TILE;
        this.tileColors[row][col] = color;

        const g = this.add.graphics();
        this.drawTile(g, x, y, color, false);
        this.tiles[row][col] = g;

        const isPowerPoint = POWER_POINTS.some(([pc, pr]) => pc === col && pr === row);
        if (isPowerPoint) this.addPowerPointGlow(col, row);
      }
    }
  }

  private drawTile(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, selected: boolean) {
    g.clear();
    const pad = 1;
    const r = 4;
    g.fillStyle(color, 1);
    g.fillRoundedRect(x + pad, y + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2, r);
    if (selected) {
      g.lineStyle(3, SELECT_COLOR, 1);
      g.strokeRoundedRect(x + pad, y + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2, r);
    }
  }

  private addPowerPointGlow(col: number, row: number) {
    const cx = col * TILE_SIZE + TILE_SIZE / 2;
    const cy = row * TILE_SIZE + TILE_SIZE / 2;

    // Outer soft halo
    const halo = this.add.graphics();
    halo.fillStyle(POWER_COLOR, 0.08);
    halo.fillCircle(cx, cy, 28);
    this.tweens.add({
      targets: halo,
      alpha: { from: 0.5, to: 1 },
      scaleX: { from: 0.85, to: 1.15 },
      scaleY: { from: 0.85, to: 1.15 },
      duration: 1800,
      yoyo: true, repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Mid ring — pulses in opposite phase
    const ring = this.add.graphics();
    ring.lineStyle(2, POWER_COLOR, 0.7);
    ring.strokeCircle(cx, cy, 18);
    this.tweens.add({
      targets: ring,
      alpha: { from: 0.4, to: 1.0 },
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 0.9, to: 1.1 },
      duration: 1800,
      yoyo: true, repeat: -1,
      ease: "Sine.easeInOut",
      delay: 900, // offset for ripple feel
    });

    // Inner bright dot
    const dot = this.add.graphics();
    dot.fillStyle(0xfef3c7, 1); // amber-100 core
    dot.fillCircle(cx, cy, 4);
    this.tweens.add({
      targets: dot,
      alpha: { from: 0.6, to: 1 },
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      duration: 900,
      yoyo: true, repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Rotating 4-pointed star
    const star = this.add.graphics();
    star.fillStyle(POWER_COLOR, 0.9);
    // Draw 4 diamond points
    const sp = 12; // spike reach
    const sw = 2.5;  // spike half-width
    star.fillTriangle(cx, cy - sp, cx - sw, cy, cx + sw, cy); // up
    star.fillTriangle(cx, cy + sp, cx - sw, cy, cx + sw, cy); // down
    star.fillTriangle(cx - sp, cy, cx, cy - sw, cx, cy + sw); // left
    star.fillTriangle(cx + sp, cy, cx, cy - sw, cx, cy + sw); // right
    this.tweens.add({
      targets: star,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: "Linear",
    });
  }

  updateState(state: GameState) {
    if (this.tiles.length === 0) {
      this.pendingState = state;
      return;
    }
    this.applyState(state);
  }

  private applyState(state: GameState) {
    this.gameState = state;
    this.updateLuminance(state.luminanceStep);
    this.renderPieces(state.board);
  }

  private updateLuminance(step: number) {
    const color = OSCILLATING_COLORS[step];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const isHome = (col === LIGHT_HOME[0] && row === LIGHT_HOME[1]) ||
                       (col === DARK_HOME[0]  && row === DARK_HOME[1]);
        if (!isHome && OSCILLATING_SQUARES.has(row * BOARD_SIZE + col)) {
          this.tileColors[row][col] = color;
          this.drawTile(this.tiles[row][col], col * TILE_SIZE, row * TILE_SIZE, color, false);
        }
      }
    }
  }

  private renderPieces(board: (BoardPiece | null)[][]) {
    const currentIds = new Set<string>();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (!piece) continue;
        currentIds.add(piece.id);

        if (!this.pieceContainers.has(piece.id)) {
          const pc = this.createPieceContainer(piece);
          this.pieceContainers.set(piece.id, pc);
        }
        const pc = this.pieceContainers.get(piece.id)!;
        const cx = col * TILE_SIZE + TILE_SIZE / 2;
        const cy = row * TILE_SIZE + TILE_SIZE / 2;
        this.tweens.add({ targets: pc.container, x: cx, y: cy, duration: 350, ease: "Cubic.easeInOut" });
      }
    }
    for (const [id, pc] of this.pieceContainers) {
      if (!currentIds.has(id)) {
        this.tweens.add({ targets: pc.container, alpha: 0, scaleX: 0, scaleY: 0, duration: 200,
          onComplete: () => { pc.container.destroy(); } });
        this.pieceContainers.delete(id);
      }
    }
  }

  private createPieceContainer(piece: BoardPiece): PieceContainer {
    const cx = piece.col * TILE_SIZE + TILE_SIZE / 2;
    const cy = piece.row * TILE_SIZE + TILE_SIZE / 2;
    const radius = 26;
    const isLight = piece.side === "light";
    const bgColor  = isLight ? LIGHT_PIECE_BG  : DARK_PIECE_BG;
    const rimColor = isLight ? LIGHT_PIECE_RIM : DARK_PIECE_RIM;

    // Soft outer glow
    const glow = this.add.arc(0, 0, radius + 6, 0, 360, false, rimColor, 0);
    glow.setStrokeStyle(5, rimColor, 0.25);

    // Main circle
    const bg = this.add.arc(0, 0, radius, 0, 360, false, bgColor);
    bg.setStrokeStyle(2.5, rimColor, 1);

    // Inner highlight rim (top-left arc for 3-D feel)
    const shine = this.add.graphics();
    shine.lineStyle(1.5, 0xffffff, 0.18);
    shine.beginPath();
    shine.arc(0, -3, radius - 5, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    shine.strokePath();

    const label = this.add.text(0, 1, PIECE_LABEL[piece.type] ?? "?", {
      fontSize: "22px",
      fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
    }).setOrigin(0.5);

    const container = this.add.container(cx, cy, [glow, bg, shine, label]);
    container.setSize(radius * 2, radius * 2);

    // Subtle glow pulse on idle
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.8 },
      duration: 2200,
      yoyo: true, repeat: -1,
      ease: "Sine.easeInOut",
      delay: Math.random() * 1000,
    });

    // Entrance animation
    container.setAlpha(0).setScale(0.4);
    this.tweens.add({ targets: container, alpha: 1, scaleX: 1, scaleY: 1, duration: 300, ease: "Back.easeOut" });

    return { container, bg, label, glow };
  }

  private handleClick(pointer: Phaser.Input.Pointer) {
    const col = Math.floor(pointer.x / TILE_SIZE);
    const row = Math.floor(pointer.y / TILE_SIZE);
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return;

    const state = this.gameState;
    if (!state || state.phase !== "strategy") return;
    const piece = state.board[row][col];

    if (this.selectedPieceId) {
      const key = `${col},${row}`;
      if (this.validMoves.has(key) || this.attackMoves.has(key)) {
        // Only execute the move on your turn — handleMove guards the rest
        if (state.currentTurn === this.playerSide) {
          const [fromCol, fromRow] = this.selectedPieceId.split(":").map(Number) as [number, number];
          this.onMoveFn?.([fromCol, fromRow], [col, row]);
        }
      } else if (piece && piece.side === this.playerSide && this.selectedPieceId !== `${piece.col}:${piece.row}`) {
        // Re-select a different friendly piece
        this.clearSelection();
        this.selectPiece(piece);
        return;
      }
      this.clearSelection();
    } else if (piece && piece.side === this.playerSide) {
      // Allow selecting own pieces at any time so players can plan their move
      this.selectPiece(piece);
    }
  }

  private selectPiece(piece: BoardPiece) {
    this.selectedPieceId = `${piece.col}:${piece.row}`;
    const { moves, attacks } = this.computeValidMoves(piece);
    this.validMoves = moves;
    this.attackMoves = attacks;
    this.highlightTile(piece.col, piece.row, SELECT_COLOR);
    this.highlightMoves();
  }

  private computeValidMoves(piece: BoardPiece): { moves: Set<string>; attacks: Set<string> } {
    const moves = new Set<string>();
    const attacks = new Set<string>();
    const state = this.gameState!;
    const range = piece.moveRange;

    const addSquare = (c: number, r: number) => {
      const occupant = state.board[r]?.[c];
      if (occupant?.side === piece.side) return false; // blocked by own piece
      if (occupant && occupant.side !== piece.side) { attacks.add(`${c},${r}`); return false; }
      moves.add(`${c},${r}`);
      return true;
    };

    if (piece.movementType === "teleport") {
      for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++)
          if ((r !== piece.row || c !== piece.col) &&
              Math.max(Math.abs(r - piece.row), Math.abs(c - piece.col)) <= range)
            addSquare(c, r);
    } else if (piece.movementType === "flying") {
      for (let dr = -range; dr <= range; dr++) {
        for (let dc = -range; dc <= range; dc++) {
          if (dr === 0 && dc === 0) continue;
          if (Math.max(Math.abs(dr), Math.abs(dc)) > range) continue;
          const c = piece.col + dc, r = piece.row + dr;
          if (c >= 0 && c < BOARD_SIZE && r >= 0 && r < BOARD_SIZE) addSquare(c, r);
        }
      }
    } else {
      for (const [dc, dr] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        for (let step = 1; step <= range; step++) {
          const c = piece.col + dc * step, r = piece.row + dr * step;
          if (c < 0 || c >= BOARD_SIZE || r < 0 || r >= BOARD_SIZE) break;
          if (!addSquare(c, r)) break;
        }
      }
    }
    return { moves, attacks };
  }

  private highlightTile(col: number, row: number, color: number, alpha = 0.4) {
    const g = this.tiles[row][col];
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    const base = this.tileColors[row][col];
    this.drawTile(g, x, y, base, false);
    const overlay = this.add.graphics();
    overlay.fillStyle(color, alpha);
    overlay.fillRoundedRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 4);
    overlay.setName(`hl_${col}_${row}`);
    this.children.bringToTop(overlay);
    // store for cleanup
    (g as unknown as Record<string, unknown>)["__hl"] = overlay;
  }

  private highlightMoves() {
    for (const key of this.validMoves) {
      const [col, row] = key.split(",").map(Number);
      this.highlightTile(col, row, MOVE_COLOR, 0.3);
    }
    for (const key of this.attackMoves) {
      const [col, row] = key.split(",").map(Number);
      this.highlightTile(col, row, ATTACK_COLOR, 0.4);
    }
  }

  private clearSelection() {
    this.selectedPieceId = null;
    // Remove all overlay highlights
    this.children.each((child) => {
      if (child.name?.startsWith("hl_")) child.destroy();
    });
    this.validMoves.clear();
    this.attackMoves.clear();
  }

  launchCombat(
    attacker: BoardPiece,
    defender: BoardPiece,
    combatState: CombatState,
    isLocalAttacker: boolean,
    onEnd: (attackerHp: number, defenderHp: number) => void,
  ) {
    this.scene.launch("CombatScene", { attacker, defender, combatState, isLocalAttacker, onCombatEnd: onEnd });
    this.scene.bringToTop("CombatScene");
  }

  setMoveHandler(fn: (from: [number, number], to: [number, number]) => void) {
    this.onMoveFn = fn;
  }

  setPlayerSide(side: "light" | "dark") {
    this.playerSide = side;
  }
}

const PIECE_LABEL: Record<string, string> = {
  wizard:         "🧙",
  sorceress:      "🔮",
  unicorn:        "🦄",
  basilisk:       "🐍",
  archer:         "🏹",
  manticore:      "🦁",
  valkyrie:       "⚔️",
  banshee:        "👻",
  golem:          "🗿",
  troll:          "👹",
  djinni:         "🌪️",
  dragon:         "🐉",
  phoenix:        "🦅",
  shapeshifter:   "🌀",
  knight:         "♞",
  goblin:         "👺",
  elemental_fire: "🔥",
  elemental_earth:"🪨",
  elemental_water:"💧",
  elemental_air:  "💨",
};
