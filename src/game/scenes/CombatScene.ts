import * as Phaser from "phaser";
import { LUMINANCE_COLORS } from "@/lib/constants";
import type { BoardPiece, CombatState } from "@/lib/types";

const ARENA_W = 576;
const ARENA_H = 576;
const UNIT_RADIUS = 26;
const BAR_W = 84;

// Barrier definition for collision
interface BarrierRect { x: number; y: number; w: number; h: number; }

const BARRIER_COLORS = [0x374151, 0x4b5563, 0x6b7280];
const PROJ_LIGHT = 0x818cf8;
const PROJ_DARK  = 0xfb7185;

interface CombatUnit {
  piece: BoardPiece;
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  hpBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  hp: number;
  maxHp: number;
  lastFired: number;
  vx: number;
  vy: number;
  isLocal: boolean;
  aiTarget?: CombatUnit;
}

interface SceneData {
  attacker: BoardPiece;
  defender: BoardPiece;
  combatState: CombatState;
  isLocalAttacker: boolean;
  onCombatEnd: (attackerHp: number, defenderHp: number) => void;
}

export class CombatScene extends Phaser.Scene {
  private localUnit!: CombatUnit;
  private remoteUnit!: CombatUnit;
  private attacker!: CombatUnit;
  private defender!: CombatUnit;
  private projectiles!: Phaser.GameObjects.Group;
  private barrierRects: BarrierRect[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private onCombatEnd?: (attackerHp: number, defenderHp: number) => void;
  private ended = false;
  private combatLocked = true;   // blocks input until GET READY screen clears
  private isLocalAttacker = true;

  // Touch controls
  private joystickBase?: Phaser.GameObjects.Arc;
  private joystickThumb?: Phaser.GameObjects.Arc;
  private joystickBaseX = 90;
  private joystickBaseY = ARENA_H - 90;
  private joystickPointerId = -1;
  private joystickDx = 0;
  private joystickDy = 0;
  private fireBtnPointerId = -1;
  private touchFireTriggered = false;

  constructor() {
    super({ key: "CombatScene" });
  }

  preload() {
    const types = [
      "wizard","unicorn","golem","djinni","phoenix","manticore","archer","valkyrie",
      "sorceress","dragon","basilisk","shapeshifter","knight","banshee","troll","goblin",
      "elemental_fire","elemental_earth","elemental_water","elemental_air",
    ];
    for (const t of types) {
      if (!this.textures.exists(t)) this.load.image(t, `/sprites/${t}.png`);
    }
  }

  create(data: SceneData) {
    this.ended = false;
    this.combatLocked = true;
    this.onCombatEnd = data.onCombatEnd;
    this.isLocalAttacker = data.isLocalAttacker;
    this.joystickPointerId = -1;
    this.fireBtnPointerId  = -1;
    this.touchFireTriggered = false;

    const lumStep = data.combatState.squareLuminance;
    this.cameras.main.setBackgroundColor(this.arenaBackground(lumStep));

    this.projectiles = this.add.group();
    this.barrierRects = [];
    this.createBarriers();
    this.drawArenaFrame(lumStep);

    const aMult = this.hpMultiplier(data.attacker.side, data.combatState.squareType, lumStep);
    const dMult = this.hpMultiplier(data.defender.side, data.combatState.squareType, lumStep);

    this.attacker = this.createUnit(data.attacker, 80,            ARENA_H / 2, aMult,  data.isLocalAttacker);
    this.defender = this.createUnit(data.defender, ARENA_W - 80,  ARENA_H / 2, dMult, !data.isLocalAttacker);

    this.localUnit  = data.isLocalAttacker ? this.attacker : this.defender;
    this.remoteUnit = data.isLocalAttacker ? this.defender : this.attacker;
    this.remoteUnit.aiTarget = this.localUnit;

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Add WASD
    this.input.keyboard!.addKey("W");
    this.input.keyboard!.addKey("A");
    this.input.keyboard!.addKey("S");
    this.input.keyboard!.addKey("D");

    // Piece names at top corners
    const localPiece  = this.localUnit.piece;
    const remotePiece = this.remoteUnit.piece;
    const localColor  = localPiece.side  === "light" ? "#818cf8" : "#fb7185";
    const remoteColor = remotePiece.side === "light" ? "#818cf8" : "#fb7185";

    this.add.text(16, 10,
      `${PIECE_LABEL[localPiece.type] ?? "?"} ${localPiece.type.charAt(0).toUpperCase() + localPiece.type.slice(1)}`,
      { fontSize: "13px", fontFamily: "Inter,sans-serif", color: localColor }
    ).setDepth(5);

    this.add.text(ARENA_W - 16, 10,
      `${PIECE_LABEL[remotePiece.type] ?? "?"} ${remotePiece.type.charAt(0).toUpperCase() + remotePiece.type.slice(1)}`,
      { fontSize: "13px", fontFamily: "Inter,sans-serif", color: remoteColor }
    ).setOrigin(1, 0).setDepth(5);

    // Touch controls
    this.setupTouchControls();

    // GET READY screen — shown first, unlocks combat after it clears
    this.showGetReadyScreen(data);
  }

  // ── GET READY screen ───────────────────────────────────────────────────

  private showGetReadyScreen(data: SceneData) {
    const W = ARENA_W, H = ARENA_H;
    const DEPTH = 500;

    // Dim overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82).setDepth(DEPTH);

    // Collect all portrait objects for coordinated fade
    const portraitObjs: Phaser.GameObjects.GameObject[] = [];

    // ── Portrait card helper ────────────────────────────────────────────
    const makeCard = (piece: BoardPiece, cx: number) => {
      const cw = 148, ch = 186;
      const isLight = piece.side === "light";
      const borderColor = isLight ? 0xd4af37 : 0x3b82f6; // gold vs blue

      const bg = this.add.graphics().setDepth(DEPTH + 1).setAlpha(0);
      bg.fillStyle(0x111827, 0.95);
      bg.fillRoundedRect(cx - cw / 2, H / 2 - ch / 2, cw, ch, 8);
      bg.lineStyle(3, borderColor, 1);
      bg.strokeRoundedRect(cx - cw / 2, H / 2 - ch / 2, cw, ch, 8);
      // Corner rivets
      bg.fillStyle(borderColor, 1);
      for (const [ox, oy] of [[-cw/2, -ch/2],[cw/2, -ch/2],[-cw/2, ch/2],[cw/2, ch/2]]) {
        bg.fillCircle(cx + ox, H / 2 + oy, 5);
      }
      portraitObjs.push(bg);

      // Portrait image (sprite if available, fallback to emoji text)
      const PORTRAIT_H = 110;
      const hasSprite = this.textures.exists(piece.type);
      if (hasSprite) {
        const portrait = this.add.image(cx, H / 2 - 22, piece.type);
        const src = this.textures.get(piece.type).getSourceImage() as HTMLImageElement;
        const scale = PORTRAIT_H / Math.max(src.width || 1, src.height || 1);
        portrait.setScale(scale).setDepth(DEPTH + 2).setAlpha(0);
        portraitObjs.push(portrait);
      } else {
        const emoji = this.add.text(cx, H / 2 - 28, PIECE_LABEL[piece.type] ?? "?", {
          fontSize: "64px",
          fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
          shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 6, fill: true },
        }).setOrigin(0.5).setDepth(DEPTH + 2).setAlpha(0);
        portraitObjs.push(emoji);
      }

      // Piece name
      const name = piece.type.charAt(0).toUpperCase() + piece.type.slice(1);
      const nameText = this.add.text(cx, H / 2 + 70, name, {
        fontSize: "14px", fontFamily: "Inter, sans-serif",
        fontStyle: "bold", color: isLight ? "#d4af37" : "#60a5fa",
        letterSpacing: 2,
      }).setOrigin(0.5).setDepth(DEPTH + 2).setAlpha(0);
      portraitObjs.push(nameText);

      // YOU / ENEMY label
      const tag = piece === (data.isLocalAttacker ? data.attacker : data.defender) ? "YOU" : "ENEMY";
      const tagText = this.add.text(cx, H / 2 + 90, tag, {
        fontSize: "10px", fontFamily: "Inter, sans-serif",
        color: "#6b7280", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(DEPTH + 2).setAlpha(0);
      portraitObjs.push(tagText);
    };

    makeCard(data.attacker, W * 0.26);
    makeCard(data.defender, W * 0.74);

    // ── "GET READY" banner ──────────────────────────────────────────────
    const bannerW = 200, bannerH = 100;
    const bannerBg = this.add.graphics().setDepth(DEPTH + 1);
    bannerBg.fillStyle(0x5c3a00, 0.95);
    bannerBg.fillRoundedRect(W / 2 - bannerW / 2, H / 2 - bannerH / 2, bannerW, bannerH, 6);
    bannerBg.lineStyle(2, 0xd4af37, 0.8);
    bannerBg.strokeRoundedRect(W / 2 - bannerW / 2, H / 2 - bannerH / 2, bannerW, bannerH, 6);
    // Corner rivets
    bannerBg.fillStyle(0xd4af37, 1);
    for (const [ox, oy] of [[-bannerW/2, -bannerH/2],[bannerW/2, -bannerH/2],
                             [-bannerW/2, bannerH/2], [bannerW/2, bannerH/2]]) {
      bannerBg.fillCircle(W / 2 + ox, H / 2 + oy, 4);
    }

    const getReady = this.add.text(W / 2, H / 2, "GET\nREADY", {
      fontSize: "34px", fontFamily: "'Georgia', 'Times New Roman', serif",
      fontStyle: "bold", color: "#f9fafb",
      align: "center", lineSpacing: 4,
      shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(DEPTH + 2);

    // Collect all objects for fade-out
    const allObjs = [overlay, bannerBg, getReady];

    // Quick fade-in, hold, then fade out → unlock combat
    this.tweens.add({
      targets: allObjs, alpha: { from: 0, to: 1 },
      duration: 350, ease: "Quad.easeOut",
      onComplete: () => {
        this.time.delayedCall(1600, () => {
          this.tweens.add({
            targets: allObjs,
            alpha: 0, duration: 400, ease: "Quad.easeIn",
            onComplete: () => {
              allObjs.forEach(o => o.destroy());
              // 1 second after the screen clears, unlock combat
              this.time.delayedCall(800, () => { this.combatLocked = false; });
            },
          });
        });
      },
    });

    // Fade portrait cards in alongside the banner
    this.tweens.add({
      targets: portraitObjs, alpha: 1,
      duration: 350, ease: "Quad.easeOut",
      onComplete: () => {
        this.time.delayedCall(1600, () => {
          this.tweens.add({
            targets: portraitObjs, alpha: 0, duration: 400, ease: "Quad.easeIn",
            onComplete: () => portraitObjs.forEach(o => (o as Phaser.GameObjects.GameObject & { destroy(): void }).destroy()),
          });
        });
      },
    });
  }

  // ── Arena visuals ──────────────────────────────────────────────────────

  private arenaBackground(step: number): number {
    return [0x050505, 0x050510, 0x10051a, 0x051008, 0x05100f, 0x1a1a1a][step] ?? 0x0a0a0a;
  }

  /**
   * Spec §2 — Health Modifiers by Tile Color (multiplicative, 3-tier):
   *   Favorable tile  → ×1.25  (massive HP advantage)
   *   Neutral tile    → ×1.00  (gray, oscillating mid-point)
   *   Hostile tile    → ×0.35  (30-50% of max — "severely penalized")
   *
   * "advantage" = 1.0 fully favorable, 0.5 neutral, 0.0 fully hostile.
   * Linear segments: [0.0→0.5] maps ×0.35→×1.00, [0.5→1.0] maps ×1.00→×1.25.
   */
  private hpMultiplier(
    side: "light" | "dark",
    squareType: "light" | "dark" | "oscillating",
    step: number,   // 0 = white (full light), 5 = black (full dark)
  ): number {
    let lightAdvantage: number;
    if (squareType === "light")      lightAdvantage = 1.0;
    else if (squareType === "dark")  lightAdvantage = 0.0;
    else                             lightAdvantage = 1 - step / 5; // oscillating

    const advantage = side === "light" ? lightAdvantage : 1 - lightAdvantage;
    if (advantage >= 0.5) return 1.0 + (advantage - 0.5) * 0.5;  // 1.00→1.25
    else                  return 0.35 + advantage * 1.30;          // 0.35→1.00
  }

  private drawArenaFrame(step: number) {
    const g = this.add.graphics();
    const borderColor = step >= 3 ? 0x818cf8 : 0xfb7185;
    g.lineStyle(3, borderColor, 0.5);
    g.strokeRect(4, 4, ARENA_W - 8, ARENA_H - 8);
    const corners: [number, number][] = [[0,0],[ARENA_W,0],[0,ARENA_H],[ARENA_W,ARENA_H]];
    for (const [cx, cy] of corners) {
      g.lineStyle(2, 0xf59e0b, 0.8);
      g.strokeRect(cx === 0 ? 8 : ARENA_W - 22, cy === 0 ? 8 : ARENA_H - 22, 14, 14);
    }
  }

  private createBarriers() {
    const defs: [number, number, number, number][] = [
      [120, 160, 80, 22], [260, 110, 70, 20], [380, 160, 80, 22], [470, 210, 60, 20],
      [120, 416, 80, 22], [260, 466, 70, 20], [380, 416, 80, 22], [470, 366, 60, 20],
    ];
    for (let i = 0; i < defs.length; i++) {
      const [x, y, w, h] = defs[i];
      this.barrierRects.push({ x, y, w, h });
      const color = BARRIER_COLORS[i % BARRIER_COLORS.length];
      const rect = this.add.rectangle(x, y, w, h, color);
      rect.setStrokeStyle(1, 0x6b7280, 0.5);
    }
  }

  // ── Unit creation ──────────────────────────────────────────────────────

  private createUnit(piece: BoardPiece, x: number, y: number, hpMult: number, isLocal: boolean): CombatUnit {
    // Scale both current and max HP proportionally (handles pre-existing wounds per spec)
    const maxHp = Math.max(1, Math.round(piece.maxHp * hpMult));
    const hp    = Math.max(1, Math.round(piece.hp    * hpMult));
    const isLight = piece.side === "light";
    const strokeColor = isLight ? 0x818cf8 : 0xfb7185;

    // Sprite image (60px tall, centred on unit position)
    const SPRITE_H = 60;
    const hasSprite = this.textures.exists(piece.type);
    let label: Phaser.GameObjects.Image | Phaser.GameObjects.Text;

    if (hasSprite) {
      const img = this.add.image(x, y, piece.type);
      const src = this.textures.get(piece.type).getSourceImage();
      const scale = SPRITE_H / Math.max(src.width as number, src.height as number);
      img.setScale(scale);
      label = img;
    } else {
      label = this.add.text(x, y + 1, PIECE_LABEL[piece.type] ?? "?", {
        fontSize: "24px",
        fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
      }).setOrigin(0.5);
    }

    // Subtle team-colour ring behind sprite so it reads on dark backgrounds
    const circle = this.add.arc(x, y, UNIT_RADIUS, 0, 360, false, 0x000000, 0);
    circle.setStrokeStyle(2, strokeColor, 0.55);

    // "YOU" / "ENEMY" tag
    const tagText = isLocal ? "YOU" : "ENEMY";
    const tagColor = isLocal ? (isLight ? "#818cf8" : "#fb7185") : "#6b7280";
    this.add.text(x, y - 52, tagText, {
      fontSize: "10px", fontFamily: "Inter,sans-serif",
      fontStyle: "bold", color: tagColor,
    }).setOrigin(0.5).setName(`tag_${isLocal ? "local" : "remote"}`);

    // HP bar (color-coded, 84px wide)
    const barColor = this.hpColor(1);
    const hpBg  = this.add.rectangle(x, y - 42, BAR_W, 9, 0x1f2937).setStrokeStyle(1, 0x374151);
    const hpBar = this.add.rectangle(x - BAR_W / 2, y - 42, BAR_W, 9, barColor).setOrigin(0, 0.5);

    // Numeric HP text
    const hpText = this.add.text(x, y - 42, `${hp}/${maxHp}`, {
      fontSize: "9px", fontFamily: "Inter,sans-serif", color: "#9ca3af",
    }).setOrigin(0.5);

    // Entrance animation — sprite slides up from below and fades in
    label.setAlpha(0);
    circle.setAlpha(0);
    const startY = (label as Phaser.GameObjects.Image).y + 20;
    (label as Phaser.GameObjects.Image).y = startY;
    this.tweens.add({
      targets: label,
      alpha: 1, y: startY - 20,
      duration: 400, ease: "Back.easeOut",
    });
    this.tweens.add({ targets: circle, alpha: 1, duration: 400, ease: "Quad.easeOut" });

    return { piece, circle, label: label as Phaser.GameObjects.Text, hpBg, hpBar, hpText, hp, maxHp, lastFired: 0, vx: 0, vy: 0, isLocal };
  }

  private hpColor(pct: number): number {
    if (pct > 0.6) return 0x22c55e;
    if (pct > 0.3) return 0xf59e0b;
    return 0xef4444;
  }

  // ── Touch controls ─────────────────────────────────────────────────────

  private setupTouchControls() {
    const isTouchDevice = this.sys.game.device.input.touch;
    if (!isTouchDevice) return;

    this.input.addPointer(1); // support 2 simultaneous touches

    const jx = this.joystickBaseX;
    const jy = this.joystickBaseY;

    // Joystick base
    this.joystickBase = this.add.arc(jx, jy, 52, 0, 360, false, 0xffffff, 0.1)
      .setStrokeStyle(2, 0xffffff, 0.25).setDepth(20);

    // Joystick thumb
    this.joystickThumb = this.add.arc(jx, jy, 24, 0, 360, false, 0xffffff, 0.35)
      .setDepth(21);

    // Fire button
    const fireX = ARENA_W - 90;
    const fireY = ARENA_H - 90;
    const fireBtn = this.add.arc(fireX, fireY, 46, 0, 360, false, 0xfb7185, 0.25)
      .setStrokeStyle(2, 0xfb7185, 0.5).setDepth(20);
    this.add.text(fireX, fireY, "⚡", { fontSize: "28px" }).setOrigin(0.5).setDepth(21);

    // Pulsing hint
    this.tweens.add({
      targets: fireBtn, scaleX: 1.12, scaleY: 1.12,
      alpha: { from: 0.25, to: 0.5 },
      duration: 700, yoyo: true, repeat: -1,
    });

    // Touch events
    this.input.on("pointerdown", (ptr: Phaser.Input.Pointer) => {
      if (ptr.x < ARENA_W * 0.6 && this.joystickPointerId === -1) {
        // Left zone → joystick
        this.joystickPointerId = ptr.id;
        this.joystickBaseX = ptr.x;
        this.joystickBaseY = ptr.y;
        this.joystickBase?.setPosition(ptr.x, ptr.y);
        this.joystickThumb?.setPosition(ptr.x, ptr.y);
      } else if (ptr.x >= ARENA_W * 0.6 && this.fireBtnPointerId === -1) {
        // Right zone → fire
        this.fireBtnPointerId = ptr.id;
        this.touchFireTriggered = true;
      }
    });

    this.input.on("pointermove", (ptr: Phaser.Input.Pointer) => {
      if (ptr.id !== this.joystickPointerId) return;
      const dx = ptr.x - this.joystickBaseX;
      const dy = ptr.y - this.joystickBaseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = 48;
      const clampedDist = Math.min(dist, maxR);
      const angle = Math.atan2(dy, dx);
      const tx = this.joystickBaseX + Math.cos(angle) * clampedDist;
      const ty = this.joystickBaseY + Math.sin(angle) * clampedDist;
      this.joystickThumb?.setPosition(tx, ty);
      this.joystickDx = dist > 8 ? (dx / dist) : 0;
      this.joystickDy = dist > 8 ? (dy / dist) : 0;
    });

    this.input.on("pointerup", (ptr: Phaser.Input.Pointer) => {
      if (ptr.id === this.joystickPointerId) {
        this.joystickPointerId = -1;
        this.joystickDx = 0; this.joystickDy = 0;
        this.joystickThumb?.setPosition(this.joystickBaseX, this.joystickBaseY);
      }
      if (ptr.id === this.fireBtnPointerId) {
        this.fireBtnPointerId = -1;
      }
    });
  }

  // ── Update loop ────────────────────────────────────────────────────────

  update(time: number) {
    if (this.ended || this.combatLocked) return;
    this.handleLocalInput(time);
    this.runAI(this.remoteUnit, time);
    this.moveUnit(this.attacker);
    this.moveUnit(this.defender);
    this.updateProjectiles();
    this.checkEnd();
  }

  private handleLocalInput(time: number) {
    const u = this.localUnit;
    const speed = 190;
    let dx = 0, dy = 0;

    // Keyboard (always active)
    const wKey = this.input.keyboard!.addKey("W");
    const aKey = this.input.keyboard!.addKey("A");
    const sKey = this.input.keyboard!.addKey("S");
    const dKey = this.input.keyboard!.addKey("D");
    if (this.cursors.left.isDown  || aKey.isDown) dx -= 1;
    if (this.cursors.right.isDown || dKey.isDown) dx += 1;
    if (this.cursors.up.isDown    || wKey.isDown) dy -= 1;
    if (this.cursors.down.isDown  || sKey.isDown) dy += 1;

    // Touch joystick overrides if active
    if (this.joystickPointerId !== -1) {
      dx = this.joystickDx;
      dy = this.joystickDy;
    }

    // Normalize diagonals
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    u.vx = dx * speed;
    u.vy = dy * speed;

    // Fire — keyboard
    const cooldown = 1000 / u.piece.attackSpeed;
    if (Phaser.Input.Keyboard.JustDown(this.fireKey) && time - u.lastFired > cooldown) {
      this.fireProjectile(u, u === this.attacker ? this.defender : this.attacker, time);
    }
    // Fire — touch
    if (this.touchFireTriggered) {
      this.touchFireTriggered = false;
      if (time - u.lastFired > cooldown) {
        this.fireProjectile(u, u === this.attacker ? this.defender : this.attacker, time);
      }
    }
  }

  private runAI(u: CombatUnit, time: number) {
    if (!u.aiTarget) return;
    const target = u.aiTarget;
    const dx = target.circle.x - u.circle.x;
    const dy = target.circle.y - u.circle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 130;
    const idealDist = 150;

    if (dist > idealDist + 10) {
      u.vx = (dx / dist) * speed;
      u.vy = (dy / dist) * speed;
    } else if (dist < idealDist - 10) {
      u.vx = -(dx / dist) * speed;
      u.vy = -(dy / dist) * speed;
    } else {
      u.vx = 0; u.vy = 0;
    }

    const cooldown = 1000 / u.piece.attackSpeed;
    if (time - u.lastFired > cooldown) {
      this.fireProjectile(u, target, time);
    }
  }

  private moveUnit(u: CombatUnit) {
    const dt = this.game.loop.delta / 1000;
    let nx = u.circle.x + u.vx * dt;
    let ny = u.circle.y + u.vy * dt;

    // Clamp to arena bounds
    nx = Phaser.Math.Clamp(nx, UNIT_RADIUS + 4, ARENA_W - UNIT_RADIUS - 4);
    ny = Phaser.Math.Clamp(ny, UNIT_RADIUS + 4, ARENA_H - UNIT_RADIUS - 4);

    // Barrier collision — push unit out of overlapping barriers
    for (const b of this.barrierRects) {
      const halfW = b.w / 2 + UNIT_RADIUS;
      const halfH = b.h / 2 + UNIT_RADIUS;
      const overlapX = Math.abs(nx - b.x) < halfW;
      const overlapY = Math.abs(ny - b.y) < halfH;
      if (overlapX && overlapY) {
        // Push out on shortest axis
        const pushX = halfW - Math.abs(nx - b.x);
        const pushY = halfH - Math.abs(ny - b.y);
        if (pushX < pushY) nx += nx < b.x ? -pushX : pushX;
        else                ny += ny < b.y ? -pushY : pushY;
      }
    }

    u.circle.setPosition(nx, ny);
    u.label.setPosition(nx, ny + 1);
    u.hpBg.setPosition(nx, ny - 40);
    u.hpBar.setPosition(nx - BAR_W / 2, ny - 40);
    u.hpText.setPosition(nx, ny - 40);
  }

  private fireProjectile(from: CombatUnit, to: CombatUnit, time: number) {
    from.lastFired = time;
    const angle = Phaser.Math.Angle.Between(from.circle.x, from.circle.y, to.circle.x, to.circle.y);
    const speed = from.piece.projectileSpeed || 300;
    const color = from.piece.side === "light" ? PROJ_LIGHT : PROJ_DARK;

    const proj = this.add.arc(from.circle.x, from.circle.y, 5, 0, 360, false, color);
    proj.setData("vx",     Math.cos(angle) * speed);
    proj.setData("vy",     Math.sin(angle) * speed);
    proj.setData("owner",  from === this.attacker ? "attacker" : "defender");
    proj.setData("damage", 2);
    this.projectiles.add(proj);
  }

  private updateProjectiles() {
    const dt = this.game.loop.delta / 1000;
    for (const obj of this.projectiles.getChildren()) {
      const proj = obj as Phaser.GameObjects.Arc;
      proj.x += proj.getData("vx") * dt;
      proj.y += proj.getData("vy") * dt;

      // Out of bounds
      if (proj.x < 0 || proj.x > ARENA_W || proj.y < 0 || proj.y > ARENA_H) {
        proj.destroy(); continue;
      }

      // Barrier collision
      let hitBarrier = false;
      for (const b of this.barrierRects) {
        if (Math.abs(proj.x - b.x) < b.w / 2 + 5 && Math.abs(proj.y - b.y) < b.h / 2 + 5) {
          hitBarrier = true; break;
        }
      }
      if (hitBarrier) { proj.destroy(); continue; }

      // Unit hit
      const owner  = proj.getData("owner");
      const target = owner === "attacker" ? this.defender : this.attacker;
      if (Phaser.Math.Distance.Between(proj.x, proj.y, target.circle.x, target.circle.y) < UNIT_RADIUS + 6) {
        const dmg = proj.getData("damage") as number;
        this.applyDamage(target, dmg);
        proj.destroy();
      }
    }
  }

  private applyDamage(target: CombatUnit, dmg: number) {
    target.hp = Math.max(0, target.hp - dmg);
    const pct = target.hp / target.maxHp;

    // Update HP bar width + color
    target.hpBar.width = BAR_W * pct;
    target.hpBar.fillColor = this.hpColor(pct);
    target.hpText.setText(`${target.hp}/${target.maxHp}`);

    // Red pulse when critically low
    if (pct < 0.3) {
      this.tweens.add({
        targets: target.hpBar, alpha: { from: 0.4, to: 1 }, duration: 250, yoyo: true,
      });
    }

    // Camera shake
    this.cameras.main.shake(100, 0.010);

    // Hit flash
    this.tweens.add({ targets: target.circle, alpha: 0.15, duration: 70, yoyo: true });

    // Floating damage number
    const floatText = this.add.text(
      target.circle.x + Phaser.Math.Between(-12, 12),
      target.circle.y - 10,
      `-${dmg}`,
      { fontSize: "18px", fontStyle: "bold", fontFamily: "Inter,sans-serif", color: "#fbbf24" }
    ).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: floatText,
      y: floatText.y - 44, alpha: 0, scaleX: 1.3, scaleY: 1.3,
      duration: 650, ease: "Quad.easeOut",
      onComplete: () => floatText.destroy(),
    });

    // Hit burst (4 small sparks)
    const burstColor = target.piece.side === "light" ? PROJ_DARK : PROJ_LIGHT;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const spark = this.add.arc(target.circle.x, target.circle.y, 4, 0, 360, false, burstColor)
        .setDepth(29);
      this.tweens.add({
        targets: spark,
        x: target.circle.x + Math.cos(angle) * 28,
        y: target.circle.y + Math.sin(angle) * 28,
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: 280, ease: "Quad.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  private checkEnd() {
    if (this.attacker.hp <= 0 || this.defender.hp <= 0) {
      this.ended = true;
      // Big flash on kill
      const winner = this.attacker.hp > 0 ? this.attacker : this.defender;
      const winColor = winner.piece.side === "light" ? 0x818cf8 : 0xfb7185;
      this.cameras.main.flash(400, (winColor >> 16) & 0xff, (winColor >> 8) & 0xff, winColor & 0xff, false);

      this.time.delayedCall(700, () => {
        this.onCombatEnd?.(this.attacker.hp, this.defender.hp);
        this.scene.stop();
      });
    }
  }
}

const PIECE_LABEL: Record<string, string> = {
  wizard:"🧙", sorceress:"🔮", unicorn:"🦄", basilisk:"🐍",
  archer:"🏹", manticore:"🦁", valkyrie:"⚔️", banshee:"👻",
  golem:"🗿", troll:"👹", djinni:"🌪️", dragon:"🐉",
  phoenix:"🦅", shapeshifter:"🌀", knight:"♞", goblin:"👺",
  elemental_fire:"🔥", elemental_earth:"🪨", elemental_water:"💧", elemental_air:"💨",
};
