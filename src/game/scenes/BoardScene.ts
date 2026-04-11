import * as Phaser from "phaser";
import { BOARD_SIZE, TILE_SIZE, POWER_POINTS, LUMINANCE_COLORS, OSCILLATING_SQUARES } from "@/lib/constants";
import type { GameState, BoardPiece } from "@/lib/types";

const LIGHT_COLOR = 0xe8d5b0;
const DARK_COLOR  = 0x4a3728;
const POWER_COLOR = 0xff4444;
const SELECT_COLOR = 0xffff00;
const MOVE_COLOR   = 0x00ff88;

export class BoardScene extends Phaser.Scene {
  private tiles: Phaser.GameObjects.Rectangle[][] = [];
  private pieceSprites: Map<string, Phaser.GameObjects.Text> = new Map();
  private selectedPieceId: string | null = null;
  private validMoves: Set<string> = new Set();
  private gameState: GameState | null = null;
  private pendingState: GameState | null = null;
  private onMoveFn?: (from: [number, number], to: [number, number]) => void;
  private onSelectSpellFn?: () => void;

  constructor() {
    super({ key: "BoardScene" });
  }

  create() {
    this.drawBoard();
    this.input.on("pointerdown", this.handleClick, this);
    // Apply any state that arrived before the scene was ready
    if (this.pendingState) {
      this.applyState(this.pendingState);
      this.pendingState = null;
    }
  }

  private drawBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const isPowerPoint = POWER_POINTS.some(([pc, pr]) => pc === col && pr === row);
        const isOscillating = OSCILLATING_SQUARES.has(row * BOARD_SIZE + col);
        const baseColor = isOscillating
          ? LUMINANCE_COLORS[3] // start at green (mid)
          : (col + row) % 2 === 0 ? LIGHT_COLOR : DARK_COLOR;

        const rect = this.add.rectangle(x, y, TILE_SIZE - 2, TILE_SIZE - 2, baseColor);
        rect.setStrokeStyle(1, 0x000000, 0.3);
        rect.setInteractive();
        rect.setData("col", col);
        rect.setData("row", row);

        if (isPowerPoint) {
          this.add.rectangle(x, y, TILE_SIZE - 2, TILE_SIZE - 2, POWER_COLOR, 0.2);
          // Pulsing border
          this.tweens.add({
            targets: rect,
            strokeColor: POWER_COLOR,
            duration: 800,
            yoyo: true,
            repeat: -1,
          });
        }

        this.tiles[row][col] = rect;
      }
    }
  }

  updateState(state: GameState) {
    if (this.tiles.length === 0) {
      // Scene not ready yet — store and apply in create()
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
    const color = LUMINANCE_COLORS[step];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const idx = row * BOARD_SIZE + col;
        if (OSCILLATING_SQUARES.has(idx)) {
          this.tiles[row][col].setFillStyle(color);
        }
      }
    }
  }

  private renderPieces(board: (BoardPiece | null)[][]) {
    // Remove sprites for pieces no longer on the board
    const currentIds = new Set<string>();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (!piece) continue;
        currentIds.add(piece.id);

        if (!this.pieceSprites.has(piece.id)) {
          const sprite = this.createPieceSprite(piece);
          this.pieceSprites.set(piece.id, sprite);
        }

        const sprite = this.pieceSprites.get(piece.id)!;
        sprite.setPosition(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2);
      }
    }

    for (const [id, sprite] of this.pieceSprites) {
      if (!currentIds.has(id)) {
        sprite.destroy();
        this.pieceSprites.delete(id);
      }
    }
  }

  private createPieceSprite(piece: BoardPiece): Phaser.GameObjects.Text {
    const emoji = PIECE_EMOJI[piece.type] ?? "?";
    const text = this.add.text(0, 0, emoji, {
      fontSize: "28px",
      color: piece.side === "light" ? "#ffffff" : "#ff6666",
    }).setOrigin(0.5);
    return text;
  }

  private handleClick(pointer: Phaser.Input.Pointer) {
    const col = Math.floor(pointer.x / TILE_SIZE);
    const row = Math.floor(pointer.y / TILE_SIZE);
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return;

    const state = this.gameState;
    if (!state) return;
    const piece = state.board[row][col];

    if (this.selectedPieceId) {
      const key = `${col},${row}`;
      if (this.validMoves.has(key)) {
        const [fromCol, fromRow] = this.selectedPieceId
          .split(":").map(Number) as [number, number];
        this.onMoveFn?.([fromCol, fromRow], [col, row]);
      }
      this.clearSelection();
    } else if (piece && piece.side === state.currentTurn) {
      this.selectPiece(piece);
    }
  }

  private selectPiece(piece: BoardPiece) {
    this.selectedPieceId = `${piece.col}:${piece.row}`;
    this.validMoves = this.computeValidMoves(piece);
    this.highlightMoves();
  }

  private computeValidMoves(piece: BoardPiece): Set<string> {
    const moves = new Set<string>();
    const state = this.gameState!;
    const range = piece.moveRange;

    if (piece.movementType === "teleport") {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (state.board[r][c]?.side !== piece.side) {
            moves.add(`${c},${r}`);
          }
        }
      }
    } else if (piece.movementType === "flying") {
      for (let r = Math.max(0, piece.row - range); r <= Math.min(8, piece.row + range); r++) {
        for (let c = Math.max(0, piece.col - range); c <= Math.min(8, piece.col + range); c++) {
          const dist = Math.max(Math.abs(c - piece.col), Math.abs(r - piece.row));
          if (dist > 0 && dist <= range && state.board[r][c]?.side !== piece.side) {
            moves.add(`${c},${r}`);
          }
        }
      }
    } else {
      // Ground: orthogonal, no jumping
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dc, dr] of dirs) {
        for (let step = 1; step <= range; step++) {
          const c = piece.col + dc * step;
          const r = piece.row + dr * step;
          if (c < 0 || c >= BOARD_SIZE || r < 0 || r >= BOARD_SIZE) break;
          if (state.board[r][c]) {
            if (state.board[r][c]!.side !== piece.side) moves.add(`${c},${r}`);
            break;
          }
          moves.add(`${c},${r}`);
        }
      }
    }
    return moves;
  }

  private highlightMoves() {
    for (const key of this.validMoves) {
      const [col, row] = key.split(",").map(Number);
      this.tiles[row][col].setStrokeStyle(3, MOVE_COLOR);
    }
  }

  private clearSelection() {
    this.selectedPieceId = null;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        this.tiles[row][col].setStrokeStyle(1, 0x000000, 0.3);
      }
    }
    this.validMoves.clear();
  }

  setMoveHandler(fn: (from: [number, number], to: [number, number]) => void) {
    this.onMoveFn = fn;
  }
}

const PIECE_EMOJI: Record<string, string> = {
  wizard:        "🧙",
  sorceress:     "🔮",
  unicorn:       "🦄",
  basilisk:      "🐍",
  archer:        "🏹",
  manticore:     "🦁",
  valkyrie:      "⚔️",
  banshee:       "👻",
  golem:         "🗿",
  troll:         "👹",
  djinni:        "🌪️",
  dragon:        "🐉",
  phoenix:       "🔥",
  shapeshifter:  "🌀",
  knight:        "♞",
  goblin:        "👺",
  elemental_fire:"🔥",
  elemental_earth:"🪨",
  elemental_water:"💧",
  elemental_air: "💨",
};
