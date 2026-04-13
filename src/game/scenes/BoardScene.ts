import * as Phaser from "phaser";
import { BOARD_SIZE, TILE_SIZE, POWER_POINTS, LUMINANCE_COLORS, OSCILLATING_SQUARES, LIGHT_HOME, DARK_HOME } from "@/lib/constants";
import type { BoardPiece, CombatState, GameState } from "@/lib/types";

// Tile colors — strictly pure grayscale (R = G = B), no hue whatsoever
const LIGHT_TILE   = 0xd4d4d4; // gray-300  (212, 212, 212)
const DARK_TILE    = 0x1e1e1e; // gray-900  ( 30,  30,  30)
const POWER_COLOR  = 0xf59e0b; // amber
const SELECT_COLOR = 0x3b82f6; // blue
const MOVE_COLOR   = 0x22c55e; // emerald
const ATTACK_COLOR = 0xef4444; // red (enemy valid move)

const LIGHT_DOT = 0x93c5fd; // blue-300 — team indicator for light pieces
const DARK_DOT  = 0xfca5a5; // red-300  — team indicator for dark pieces

// Oscillating squares: pure grayscale ramp, LIGHT_TILE → DARK_TILE.
// Every entry has R = G = B — zero green component at any step.
const OSCILLATING_COLORS = [
  0xd4d4d4, // step 0 — full light  (212, 212, 212) matches LIGHT_TILE
  0xa8a8a8, // step 1 — light grey  (168, 168, 168)
  0x787878, // step 2 — mid grey    (120, 120, 120)
  0x484848, // step 3 — mid-dark    ( 72,  72,  72)
  0x2d2d2d, // step 4 — dark grey   ( 45,  45,  45)
  0x1e1e1e, // step 5 — full dark   ( 30,  30,  30) matches DARK_TILE
];

interface PieceContainer {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
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
  private tooltip: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: "BoardScene" });
  }

  preload() {
    // Load sprite images — one PNG per piece type
    const types = [
      "wizard","unicorn","golem","djinni","phoenix","manticore","archer","valkyrie",
      "sorceress","dragon","basilisk","shapeshifter","knight","banshee","troll","goblin",
      "elemental_fire","elemental_earth","elemental_water","elemental_air",
    ];
    for (const t of types) {
      this.load.image(t, `/sprites/${t}.png`);
    }
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

    // Soft glow halo — kept faint so it doesn't compete with pieces
    const glow = this.add.graphics();
    glow.fillStyle(POWER_COLOR, 1);
    glow.fillCircle(0, 0, 11);
    glow.setPosition(cx, cy);
    glow.setAlpha(0.10);

    // Core dot — small and subtle
    const dot = this.add.graphics();
    dot.fillStyle(POWER_COLOR, 1);
    dot.fillCircle(0, 0, 3);
    dot.setPosition(cx, cy);
    dot.setAlpha(0.55);

    // Slow heartbeat: scale 1.0 → 1.15 → 1.0, ~2 s per full cycle
    this.tweens.add({
      targets: [dot, glow],
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 1000,          // 1 s up + 1 s down = 2 s cycle
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Glow intensity 0.10 → 0.28 → 0.10 in sync — soft, never harsh
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.10, to: 0.28 },
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
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
    const isLight = piece.side === "light";

    // Sprite image — fit inside the tile with a small margin
    const spriteSize = TILE_SIZE - 10; // 54px display size
    const hasSprite = this.textures.exists(piece.type);
    let label: Phaser.GameObjects.Text | Phaser.GameObjects.Image;

    if (hasSprite) {
      const img = this.add.image(0, -3, piece.type);
      // Scale to fit within tile, preserving aspect ratio
      const tex = this.textures.get(piece.type).getSourceImage();
      const scale = spriteSize / Math.max(tex.width as number, tex.height as number);
      img.setScale(scale);
      label = img;
    } else {
      // Fallback: emoji if sprite not loaded
      label = this.add.text(0, -2, PIECE_LABEL[piece.type] ?? "?", {
        fontSize: "26px",
        fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
      }).setOrigin(0.5, 0.5);
    }

    // Small team-colour dot at bottom of tile
    const dot = this.add.arc(0, 24, 3, 0, 360, false, isLight ? LIGHT_DOT : DARK_DOT, 1);

    const container = this.add.container(cx, cy, [label, dot]);
    container.setSize(TILE_SIZE - 8, TILE_SIZE - 8);
    container.setInteractive();

    // Hover: scale sprite slightly and show tooltip
    container.on("pointerover", () => {
      this.tweens.add({ targets: label, scale: (label as Phaser.GameObjects.Image).scaleX * 1.18, duration: 100, ease: "Quad.easeOut" });
      this.showTooltip(PIECE_NAME[piece.type] ?? piece.type, container.x, container.y, isLight);
    });
    container.on("pointerout", () => {
      const tex2 = hasSprite ? this.textures.get(piece.type).getSourceImage() : null;
      const baseScale = tex2 ? spriteSize / Math.max(tex2.width as number, tex2.height as number) : 1;
      this.tweens.add({ targets: label, scale: baseScale, duration: 100, ease: "Quad.easeIn" });
      this.hideTooltip();
    });

    // Fade-in entrance
    container.setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 280, ease: "Quad.easeOut" });

    return { container, label: label as Phaser.GameObjects.Text };
  }

  private showTooltip(name: string, x: number, y: number, isLight: boolean) {
    this.hideTooltip();
    const pad = 6;
    const text = this.add.text(0, 0, name, {
      fontSize: "11px",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#f9fafb",
      fontStyle: "bold",
    }).setOrigin(0.5, 1);
    const w = text.width + pad * 2;
    const h = text.height + pad;
    const bg = this.add.graphics();
    bg.fillStyle(isLight ? 0x1e3a5f : 0x3b0a1a, 0.92);
    bg.fillRoundedRect(-w / 2, -h, w, h, 4);
    bg.lineStyle(1, isLight ? LIGHT_DOT : DARK_DOT, 0.7);
    bg.strokeRoundedRect(-w / 2, -h, w, h, 4);
    this.tooltip = this.add.container(x, y - TILE_SIZE * 0.55, [bg, text]);
    this.tooltip.setDepth(200);
  }

  private hideTooltip() {
    if (this.tooltip) { this.tooltip.destroy(); this.tooltip = null; }
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

// Emoji chosen to be as recognisable as possible as actual characters/creatures
const PIECE_LABEL: Record<string, string> = {
  wizard:          "🧙",    // robed mage
  sorceress:       "🧙‍♀️",  // woman mage (distinct from wizard)
  unicorn:         "🦄",    // unicorn
  basilisk:        "🦎",    // lizard-reptile (closest to basilisk)
  archer:          "🏹",    // bow & arrow — universally understood
  manticore:       "🦁",    // lion-body beast
  valkyrie:        "🛡️",   // shield = warrior/defender
  banshee:         "👻",    // ghost / wailing spirit
  golem:           "🗿",    // stone statue
  troll:           "👹",    // horned ogre
  djinni:          "🧞",    // genie
  dragon:          "🐉",    // dragon
  phoenix:         "🦅",    // eagle / firebird (best available)
  shapeshifter:    "🎭",    // drama masks = changing forms
  knight:          "⚔️",   // crossed swords = warrior
  goblin:          "👺",    // tengu-goblin mask
  elemental_fire:  "🔥",
  elemental_earth: "🪨",
  elemental_water: "💧",
  elemental_air:   "💨",
};

const PIECE_NAME: Record<string, string> = {
  wizard: "Wizard", sorceress: "Sorceress", unicorn: "Unicorn",
  basilisk: "Basilisk", archer: "Archer", manticore: "Manticore",
  valkyrie: "Valkyrie", banshee: "Banshee", golem: "Golem",
  troll: "Troll", djinni: "Djinni", dragon: "Dragon",
  phoenix: "Phoenix", shapeshifter: "Shapeshifter",
  knight: "Knight", goblin: "Goblin",
  elemental_fire: "Fire Elemental", elemental_earth: "Earth Elemental",
  elemental_water: "Water Elemental", elemental_air: "Air Elemental",
};
