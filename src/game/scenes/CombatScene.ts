import * as Phaser from "phaser";
import type { BoardPiece, CombatState } from "@/lib/types";

// ── World ─────────────────────────────────────────────────────────────────────
const SCALE   = 64;
const WORLD_W = 16 * SCALE;   // 1024
const WORLD_H = 10 * SCALE;   // 640
const SPAWN_A = { x: WORLD_W / 2 - 4 * SCALE, y: WORLD_H / 2 };  // 256, 320
const SPAWN_D = { x: WORLD_W / 2 + 4 * SCALE, y: WORLD_H / 2 };  // 768, 320

// ── HUD (screen-space) ────────────────────────────────────────────────────────
const HUD_Y       = 20;
const BAR_W       = 120;
const BAR_H       = 10;
const HUD_LEFT_X  = BAR_W / 2 + 14;          // 74
const HUD_RIGHT_X = 576 - BAR_W / 2 - 14;    // 502

const PROJ_LIGHT = 0x818cf8;
const PROJ_DARK  = 0xfb7185;

// ── Spec types ────────────────────────────────────────────────────────────────
interface AttackSpec {
  type: "projectile" | "melee_cone" | "melee_rectangle" | "melee_circle_aoe";
  damage: number;
  cooldown: number;
  windup: number;
  active: number;
  recovery: number;
  range: number;
  proj?: { spawnOffset: number; radius: number; speed: number };
  hitbox?: { radius?: number; angleDeg?: number; length?: number; width?: number; centerOffset?: number };
}
interface UnitSpec {
  hp: number; speed: number; bodyRadius: number; flying: boolean;
  attack: AttackSpec;
}

// ── All unit specs from JSON spec ─────────────────────────────────────────────
const UNIT_SPECS: Record<string, UnitSpec> = {
  // ── Light ──
  archer:  { hp:  70, speed: 2.7, bodyRadius: 0.30, flying: false,
    attack: { type:"projectile",       damage:16, cooldown:0.55, windup:0.22, active:0,    recovery:0.33, range:6.8,
      proj:{ spawnOffset:0.34, radius:0.08, speed:8.5 } } },
  knight:  { hp: 100, speed: 3.1, bodyRadius: 0.37, flying: false,
    attack: { type:"melee_cone",       damage:12, cooldown:0.60, windup:0.18, active:0.10, recovery:0.42, range:0.85,
      hitbox:{ radius:0.85, angleDeg:95 } } },
  valkyrie:{ hp: 110, speed: 3.3, bodyRadius: 0.35, flying: false,
    attack: { type:"melee_rectangle",  damage:14, cooldown:0.57, windup:0.20, active:0.08, recovery:0.37, range:1.15,
      hitbox:{ length:1.15, width:0.36 } } },
  unicorn: { hp:  95, speed: 3.6, bodyRadius: 0.36, flying: false,
    attack: { type:"melee_rectangle",  damage:13, cooldown:0.46, windup:0.14, active:0.07, recovery:0.39, range:0.95,
      hitbox:{ length:0.95, width:0.34 } } },
  golem:   { hp: 140, speed: 2.6, bodyRadius: 0.46, flying: false,
    attack: { type:"melee_circle_aoe", damage:10, cooldown:1.08, windup:0.42, active:0.12, recovery:0.66, range:1.10,
      hitbox:{ centerOffset:0.55, radius:0.55 } } },
  djinni:  { hp:  80, speed: 3.2, bodyRadius: 0.32, flying: true,
    attack: { type:"projectile",       damage:14, cooldown:0.54, windup:0.20, active:0,    recovery:0.34, range:5.0,
      proj:{ spawnOffset:0.32, radius:0.10, speed:7.2 } } },
  wizard:  { hp:  90, speed: 2.7, bodyRadius: 0.34, flying: false,
    attack: { type:"projectile",       damage:12, cooldown:0.66, windup:0.26, active:0,    recovery:0.40, range:5.8,
      proj:{ spawnOffset:0.35, radius:0.12, speed:6.5 } } },
  phoenix: { hp:  85, speed: 2.9, bodyRadius: 0.33, flying: true,
    attack: { type:"projectile",       damage:15, cooldown:0.52, windup:0.18, active:0,    recovery:0.34, range:5.6,
      proj:{ spawnOffset:0.34, radius:0.10, speed:8.0 } } },
  // ── Dark ──
  goblin:      { hp:  75, speed: 3.6, bodyRadius: 0.31, flying: false,
    attack: { type:"melee_cone",       damage:11, cooldown:0.57, windup:0.14, active:0.08, recovery:0.43, range:0.75,
      hitbox:{ radius:0.75, angleDeg:90 } } },
  manticore:   { hp: 110, speed: 2.8, bodyRadius: 0.35, flying: false,
    attack: { type:"projectile",       damage:14, cooldown:0.60, windup:0.24, active:0,    recovery:0.36, range:6.4,
      proj:{ spawnOffset:0.33, radius:0.09, speed:8.0 } } },
  troll:       { hp: 150, speed: 2.6, bodyRadius: 0.47, flying: false,
    attack: { type:"melee_cone",       damage:10, cooldown:1.03, windup:0.40, active:0.12, recovery:0.63, range:0.95,
      hitbox:{ radius:0.95, angleDeg:100 } } },
  basilisk:    { hp: 105, speed: 2.6, bodyRadius: 0.40, flying: false,
    attack: { type:"projectile",       damage:12, cooldown:0.58, windup:0.22, active:0,    recovery:0.36, range:5.2,
      proj:{ spawnOffset:0.34, radius:0.11, speed:7.0 } } },
  shapeshifter:{ hp: 100, speed: 3.1, bodyRadius: 0.36, flying: false,
    attack: { type:"melee_cone",       damage:12, cooldown:0.56, windup:0.16, active:0.09, recovery:0.40, range:0.82,
      hitbox:{ radius:0.82, angleDeg:100 } } },
  sorceress:   { hp:  90, speed: 2.7, bodyRadius: 0.34, flying: false,
    attack: { type:"projectile",       damage:13, cooldown:0.62, windup:0.24, active:0,    recovery:0.38, range:5.8,
      proj:{ spawnOffset:0.35, radius:0.12, speed:6.8 } } },
  dragon:      { hp: 130, speed: 2.2, bodyRadius: 0.48, flying: true,
    attack: { type:"projectile",       damage:16, cooldown:0.80, windup:0.34, active:0,    recovery:0.46, range:5.5,
      proj:{ spawnOffset:0.45, radius:0.16, speed:6.2 } } },
  // ── Fallbacks ──
  banshee:     { hp:  80, speed: 2.9, bodyRadius: 0.32, flying: false,
    attack: { type:"projectile",       damage:13, cooldown:0.60, windup:0.22, active:0,    recovery:0.34, range:5.5,
      proj:{ spawnOffset:0.32, radius:0.10, speed:7.0 } } },
};
const FALLBACK_SPEC: UnitSpec = UNIT_SPECS.knight;

// ── Per-unit projectile visual configs ────────────────────────────────────────
type ImpactType = "spark" | "flame_small" | "flame_large" | "magic_blue" | "dark_pulse" | "venom_splat";

interface ProjVisualConfig {
  draw: (g: Phaser.GameObjects.Graphics, r: number) => void;
  rotateWithVelocity: boolean;
  trailColor: number;
  trailAlpha: number;
  trailInterval: number; // ms between trail spawns
  trailRatio: number;    // trail radius = rPx * trailRatio
  trailLife: number;     // ms
  impactType: ImpactType;
}

const PROJ_VISUALS: Record<string, ProjVisualConfig> = {
  // ── Physical ──────────────────────────────────────────────────────────────
  archer: {
    draw: (g, r) => {
      g.fillStyle(0xc8a96e, 1.0);
      g.fillRect(-r * 2.8, -r * 0.32, r * 4.5, r * 0.64);
      g.fillStyle(0xd1d5db, 1.0);
      g.fillPoints([{ x: r*1.7, y: -r*0.55 }, { x: r*3.5, y: 0 }, { x: r*1.7, y: r*0.55 }] as Phaser.Math.Vector2[], true);
      g.fillStyle(0xf9fafb, 0.75);
      g.fillPoints([{ x: -r*2.8, y: 0 }, { x: -r*1.6, y: -r*1.1 }, { x: -r*0.9, y: 0 }] as Phaser.Math.Vector2[], true);
      g.fillPoints([{ x: -r*2.8, y: 0 }, { x: -r*1.6, y:  r*1.1 }, { x: -r*0.9, y: 0 }] as Phaser.Math.Vector2[], true);
    },
    rotateWithVelocity: true,
    trailColor: 0xe5e7eb, trailAlpha: 0.22, trailInterval: 55, trailRatio: 0.35, trailLife: 75,
    impactType: "spark",
  },
  manticore: {
    draw: (g, r) => {
      g.fillStyle(0x374151, 1.0);
      g.fillPoints([{ x: -r*2.0, y: -r*0.55 }, { x: r*2.8, y: 0 }, { x: -r*2.0, y: r*0.55 }] as Phaser.Math.Vector2[], true);
      g.fillStyle(0x9ca3af, 0.55);
      g.fillPoints([{ x: -r*1.8, y: -r*0.22 }, { x: r*1.8, y: 0 }, { x: -r*1.8, y: r*0.22 }] as Phaser.Math.Vector2[], true);
    },
    rotateWithVelocity: true,
    trailColor: 0x4b5563, trailAlpha: 0.22, trailInterval: 48, trailRatio: 0.32, trailLife: 65,
    impactType: "spark",
  },
  // ── Fire ──────────────────────────────────────────────────────────────────
  dragon: {
    draw: (g, r) => {
      g.fillStyle(0xff4500, 0.28); g.fillCircle(0, 0, r * 2.5);
      g.fillStyle(0xff6b00, 0.60); g.fillCircle(0, 0, r * 1.75);
      g.fillStyle(0xff8c00, 0.85); g.fillCircle(0, 0, r * 1.15);
      g.fillStyle(0xffec00, 1.00); g.fillCircle(0, 0, r * 0.55);
    },
    rotateWithVelocity: false,
    trailColor: 0xff6b00, trailAlpha: 0.65, trailInterval: 18, trailRatio: 1.15, trailLife: 240,
    impactType: "flame_large",
  },
  wizard: {
    draw: (g, r) => {
      g.fillStyle(0xff8c00, 0.42); g.fillCircle(0, 0, r * 1.65);
      g.fillStyle(0xfbbf24, 0.85); g.fillCircle(0, 0, r * 1.05);
      g.fillStyle(0xfde68a, 1.00); g.fillCircle(0, 0, r * 0.50);
    },
    rotateWithVelocity: false,
    trailColor: 0xfbbf24, trailAlpha: 0.38, trailInterval: 38, trailRatio: 0.78, trailLife: 145,
    impactType: "flame_small",
  },
  phoenix: {
    draw: (g, r) => {
      g.fillStyle(0xff6b35, 0.85); g.fillCircle(0,        0, r);
      g.fillStyle(0xff9c5a, 0.55); g.fillCircle(-r * 0.7, 0, r * 0.75);
      g.fillStyle(0xffec00, 1.00); g.fillCircle( r * 0.25, 0, r * 0.42);
    },
    rotateWithVelocity: true,
    trailColor: 0xff8c42, trailAlpha: 0.62, trailInterval: 22, trailRatio: 0.65, trailLife: 115,
    impactType: "flame_small",
  },
  // ── Magic ──────────────────────────────────────────────────────────────────
  djinni: {
    draw: (g, r) => {
      g.fillStyle(0x818cf8, 0.32); g.fillCircle(0, 0, r * 1.45);
      g.fillStyle(0xbfdbfe, 0.90); g.fillRect(-r * 2.3, -r * 0.44, r * 4.6, r * 0.88);
      g.fillStyle(0xf0f9ff, 1.00); g.fillCircle(0, 0, r * 0.48);
    },
    rotateWithVelocity: true,
    trailColor: 0x818cf8, trailAlpha: 0.48, trailInterval: 28, trailRatio: 0.58, trailLife: 100,
    impactType: "magic_blue",
  },
  sorceress: {
    draw: (g, r) => {
      g.fillStyle(0x4c1d95, 0.38); g.fillCircle(0, 0, r * 1.75);
      g.fillStyle(0x1a0533, 0.96); g.fillCircle(0, 0, r * 1.10);
      g.lineStyle(2, 0xa855f7, 0.90); g.strokeCircle(0, 0, r * 1.05);
      g.fillStyle(0x7c3aed, 0.65); g.fillCircle(0, 0, r * 0.50);
    },
    rotateWithVelocity: false,
    trailColor: 0x7c3aed, trailAlpha: 0.45, trailInterval: 42, trailRatio: 0.70, trailLife: 165,
    impactType: "dark_pulse",
  },
  // ── Biological ────────────────────────────────────────────────────────────
  basilisk: {
    draw: (g, r) => {
      g.fillStyle(0x15803d, 0.90); g.fillCircle( 0,        0, r * 1.25);
      g.fillStyle(0x22c55e, 0.85); g.fillCircle(-r * 0.28, -r * 0.28, r * 0.70);
      g.fillStyle(0x4ade80, 0.70); g.fillCircle( r * 0.25,  r * 0.25, r * 0.50);
      g.fillStyle(0xf0fdf4, 0.50); g.fillCircle(-r * 0.15, -r * 0.45, r * 0.22);
    },
    rotateWithVelocity: false,
    trailColor: 0x16a34a, trailAlpha: 0.38, trailInterval: 55, trailRatio: 0.42, trailLife: 120,
    impactType: "venom_splat",
  },
};

const FALLBACK_PROJ_VISUAL: ProjVisualConfig = {
  draw: (g, r) => { g.fillStyle(0x818cf8, 0.80); g.fillCircle(0, 0, r); },
  rotateWithVelocity: false,
  trailColor: 0x818cf8, trailAlpha: 0.35, trailInterval: 40, trailRatio: 0.55, trailLife: 110,
  impactType: "magic_blue",
};

// ── Obstacle ──────────────────────────────────────────────────────────────────
interface Obstacle { x:number; y:number; r:number; gfx:Phaser.GameObjects.Graphics; }

// ── CombatUnit ────────────────────────────────────────────────────────────────
interface CombatUnit {
  piece: BoardPiece;
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  ring: Phaser.GameObjects.Arc;
  hpBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  x: number; y: number;
  hp: number; maxHp: number;
  spec: UnitSpec;
  speedPx: number; bodyPx: number;
  isLocal: boolean; isFlying: boolean;
  facing: number;
  vx: number; vy: number;
  attackPhase: "idle"|"windup"|"active"|"recovery"|"cooldown";
  attackTimer: number;
  cooldownEnd: number;
  aimX: number; aimY: number;
  aiTarget?: CombatUnit;
  dmgDealt: number; dmgTaken: number;
}

interface SceneData {
  attacker: BoardPiece; defender: BoardPiece;
  combatState: CombatState; isLocalAttacker: boolean;
  onCombatEnd: (aHp: number, dHp: number) => void;
}

// ── Scene ─────────────────────────────────────────────────────────────────────
export class CombatScene extends Phaser.Scene {
  private localUnit!: CombatUnit;
  private remoteUnit!: CombatUnit;
  private attacker!: CombatUnit;
  private defender!: CombatUnit;
  private projectiles!: Phaser.GameObjects.Group;
  private obstacles: Obstacle[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private onCombatEnd?: (aHp: number, dHp: number) => void;
  private ended = false;
  private combatLocked = true;

  // Touch joystick
  private joystickBase?: Phaser.GameObjects.Arc;
  private joystickThumb?: Phaser.GameObjects.Arc;
  private joystickBaseX = 80;
  private joystickBaseY = 290; // landscape canvas (576×360): 70px from bottom
  private joystickPointerId = -1;
  private joystickDx = 0;
  private joystickDy = 0;

  // Touch right-drag aim
  private rightDragId = -1;
  private rightDragOx = 0;
  private rightDragOy = 0;

  // Aim-line visual (world-space, updated each frame on mobile drag)
  private aimLine?: Phaser.GameObjects.Graphics;

  constructor() { super({ key: "CombatScene" }); }

  preload() {
    const types = [
      "wizard","unicorn","golem","djinni","phoenix","manticore","archer","valkyrie",
      "sorceress","dragon","basilisk","shapeshifter","knight","banshee","troll","goblin",
      "elemental_fire","elemental_earth","elemental_water","elemental_air",
    ];
    for (const t of types)
      if (!this.textures.exists(t)) this.load.image(t, `/sprites/${t}.png`);
  }

  create(data: SceneData) {
    this.ended = false;
    this.combatLocked = true;
    this.onCombatEnd = data.onCombatEnd;
    this.joystickPointerId = -1;
    this.rightDragId = -1;
    this.obstacles = [];

    // Switch to landscape (576×360 = 8:5, matching the 1024×640 world ratio exactly)
    this.scene.sleep("BoardScene");
    this.scale.resize(576, 360);

    // Camera & world
    const lumStep = data.combatState.squareLuminance;
    this.cameras.main.setBackgroundColor(this.arenaBackground(lumStep));
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    const startZoom = Math.min(this.scale.width / WORLD_W, this.scale.height / WORLD_H);
    this.cameras.main.setZoom(startZoom);
    this.cameras.main.centerOn(WORLD_W / 2, WORLD_H / 2);

    this.drawArenaFrame();
    this.createObstacles();
    this.projectiles = this.add.group();

    // Units
    const { squareType, squareLuminance: step } = data.combatState;
    const aMods = this.getLuminanceMods(data.attacker.side, squareType, step);
    const dMods = this.getLuminanceMods(data.defender.side, squareType, step);

    this.attacker = this.createUnit(data.attacker, SPAWN_A.x, SPAWN_A.y, aMods,  data.isLocalAttacker);
    this.defender = this.createUnit(data.defender, SPAWN_D.x, SPAWN_D.y, dMods, !data.isLocalAttacker);

    this.localUnit  = data.isLocalAttacker ? this.attacker : this.defender;
    this.remoteUnit = data.isLocalAttacker ? this.defender : this.attacker;
    this.remoteUnit.aiTarget = this.localUnit;

    // Keyboard
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.addKey("W");
    this.input.keyboard!.addKey("A");
    this.input.keyboard!.addKey("S");
    this.input.keyboard!.addKey("D");

    // PC left-click attack
    this.input.on("pointerdown", (ptr: Phaser.Input.Pointer) => {
      if (ptr.button !== 0 || this.combatLocked || this.ended) return;
      if (this.sys.game.device.input.touch) return;   // mobile uses drag
      const u = this.localUnit;
      const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
      u.facing = Phaser.Math.Angle.Between(u.x, u.y, wp.x, wp.y);
      if (u.attackPhase === "idle") this.startAttack(u, wp.x, wp.y);
    });

    this.setupTouchControls();
    this.showGetReadyScreen(data);
  }

  // ── Luminance ─────────────────────────────────────────────────────────────
  private getLuminanceMods(
    side: "light"|"dark",
    squareType: "light"|"dark"|"oscillating",
    step: number,
  ): { dealt:number; taken:number } {
    let favor: number;
    if (squareType === "light")     favor = side === "light" ? 1.0 : 0.0;
    else if (squareType === "dark") favor = side === "dark"  ? 1.0 : 0.0;
    else                            favor = side === "light" ? 1 - step/5 : step/5;
    if (favor >= 0.67)      return { dealt:1.2, taken:0.8 };
    else if (favor <= 0.33) return { dealt:0.8, taken:1.2 };
    else                    return { dealt:1.0, taken:1.0 };
  }

  // ── Arena visuals ─────────────────────────────────────────────────────────
  private arenaBackground(step: number): number {
    return ([0x050505,0x050510,0x10051a,0x051008,0x05100f,0x1a1a1a] as number[])[step] ?? 0x0a0a0a;
  }

  private drawArenaFrame() {
    const g = this.add.graphics();
    g.lineStyle(3, 0x374151, 0.5);
    g.strokeRect(4, 4, WORLD_W - 8, WORLD_H - 8);
  }

  private createObstacles() {
    const count = Phaser.Math.Between(4, 5);
    const placed: Obstacle[] = [];
    let attempts = 0;
    while (placed.length < count && attempts < 300) {
      attempts++;
      const x = Phaser.Math.FloatBetween(4, 12) * SCALE;
      const y = Phaser.Math.FloatBetween(2, 8)  * SCALE;
      const r = Phaser.Math.FloatBetween(0.6, 1.0) * SCALE;
      if (Phaser.Math.Distance.Between(x,y, SPAWN_A.x,SPAWN_A.y) < r + 2.5*SCALE) continue;
      if (Phaser.Math.Distance.Between(x,y, SPAWN_D.x,SPAWN_D.y) < r + 2.5*SCALE) continue;
      let clash = false;
      for (const o of placed) {
        if (Phaser.Math.Distance.Between(x,y, o.x,o.y) < r + o.r + SCALE) { clash=true; break; }
      }
      if (clash) continue;

      const isCircle = placed.length % 2 === 0;
      const gfx = this.add.graphics();
      gfx.fillStyle(0x374151, 1);
      gfx.lineStyle(1, 0x6b7280, 0.6);
      if (isCircle) {
        gfx.fillCircle(x, y, r);
        gfx.strokeCircle(x, y, r);
      } else {
        const rw = r * 1.6, rh = r;
        gfx.fillRoundedRect(x - rw/2, y - rh/2, rw, rh, 8);
        gfx.strokeRoundedRect(x - rw/2, y - rh/2, rw, rh, 8);
      }
      placed.push({ x, y, r, gfx });
    }
    this.obstacles = placed;
  }

  // ── Unit creation ─────────────────────────────────────────────────────────
  private createUnit(
    piece: BoardPiece, wx: number, wy: number,
    mods: { dealt:number; taken:number }, isLocal: boolean,
  ): CombatUnit {
    const spec    = UNIT_SPECS[piece.type] ?? FALLBACK_SPEC;
    const bodyPx  = spec.bodyRadius * SCALE;
    const speedPx = spec.speed * SCALE;
    const isLight = piece.side === "light";
    const ringCol = isLight ? 0x818cf8 : 0xfb7185;

    // Sprite
    const spriteH = bodyPx * 2.8;
    const hasSprite = this.textures.exists(piece.type);
    let sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
    if (hasSprite) {
      const img = this.add.image(wx, wy, piece.type);
      const src = this.textures.get(piece.type).getSourceImage() as HTMLImageElement;
      const sc = spriteH / Math.max(src.width || 1, src.height || 1);
      img.setScale(sc);
      sprite = img;
    } else {
      sprite = this.add.text(wx, wy, PIECE_LABEL[piece.type] ?? "?", {
        fontSize: "22px",
        fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
      }).setOrigin(0.5);
    }

    // Ring
    const ring = this.add.arc(wx, wy, bodyPx + 4, 0, 360, false, 0, 0);
    ring.setStrokeStyle(2, ringCol, 0.65);

    // HUD (screen-space)
    const hudX = isLocal ? HUD_LEFT_X : HUD_RIGHT_X;
    const hpBg  = this.add.rectangle(hudX, HUD_Y, BAR_W, BAR_H, 0x1f2937)
      .setStrokeStyle(1, 0x374151).setScrollFactor(0).setDepth(10);
    const hpBar = this.add.rectangle(hudX - BAR_W/2, HUD_Y, BAR_W, BAR_H, this.hpColor(1))
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(10);
    // Use spec HP values (70-150 range) so damage figures are meaningful.
    // Scale by the piece's current board-health ratio to preserve wounds.
    const specMaxHp = spec.hp;
    const specHp    = Math.max(1, Math.round(specMaxHp * (piece.hp / piece.maxHp)));

    const hpText = this.add.text(hudX, HUD_Y, `${specHp}/${specMaxHp}`, {
      fontSize: "8px", fontFamily: "Inter,sans-serif", color: "#9ca3af",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(11);

    // Name tag (HUD)
    const label = piece.type.charAt(0).toUpperCase() + piece.type.slice(1);
    const tag   = isLocal ? "YOU" : "ENEMY";
    this.add.text(hudX, HUD_Y - 13, `${tag} · ${label}`, {
      fontSize: "9px", fontFamily: "Inter,sans-serif",
      color: isLight ? "#818cf8" : "#fb7185", fontStyle: "bold",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(11);

    // Entrance
    sprite.setAlpha(0);
    ring.setAlpha(0);
    const sy = wy + 20;
    (sprite as Phaser.GameObjects.Image).y = sy;
    this.tweens.add({ targets: sprite, alpha:1, y: wy, duration:400, ease:"Back.easeOut" });
    this.tweens.add({ targets: ring, alpha:1, duration:400 });

    return {
      piece, sprite, ring, hpBg, hpBar, hpText,
      x: wx, y: wy, hp: specHp, maxHp: specMaxHp,
      spec, speedPx, bodyPx, isLocal, isFlying: spec.flying,
      facing: isLocal ? 0 : Math.PI,
      vx:0, vy:0,
      attackPhase:"idle", attackTimer:0, cooldownEnd:0, aimX:0, aimY:0,
      dmgDealt: mods.dealt, dmgTaken: mods.taken,
    };
  }

  private hpColor(pct: number): number {
    if (pct > 0.6) return 0x22c55e;
    if (pct > 0.3) return 0xf59e0b;
    return 0xef4444;
  }

  // ── GET READY ─────────────────────────────────────────────────────────────
  private showGetReadyScreen(data: SceneData) {
    // Use actual canvas dimensions (576×360 landscape after resize)
    const W = this.scale.width, H = this.scale.height, D = 500;
    const overlay = this.add.rectangle(W/2,H/2,W,H,0x000000,0.82)
      .setScrollFactor(0).setDepth(D);

    const portraitObjs: Phaser.GameObjects.GameObject[] = [];
    const makeCard = (piece: BoardPiece, cx: number) => {
      const cw=130, ch=160;
      const isLight = piece.side === "light";
      const borderCol = isLight ? 0xd4af37 : 0x3b82f6;
      const bg = this.add.graphics().setScrollFactor(0).setDepth(D+1).setAlpha(0);
      bg.fillStyle(0x111827, 0.95);
      bg.fillRoundedRect(cx-cw/2, H/2-ch/2, cw, ch, 8);
      bg.lineStyle(3, borderCol, 1);
      bg.strokeRoundedRect(cx-cw/2, H/2-ch/2, cw, ch, 8);
      bg.fillStyle(borderCol, 1);
      for (const [ox,oy] of [[-cw/2,-ch/2],[cw/2,-ch/2],[-cw/2,ch/2],[cw/2,ch/2]])
        bg.fillCircle(cx+ox, H/2+oy, 5);
      portraitObjs.push(bg);

      if (this.textures.exists(piece.type)) {
        const img = this.add.image(cx, H/2-14, piece.type);
        const src = this.textures.get(piece.type).getSourceImage() as HTMLImageElement;
        img.setScale(90 / Math.max(src.width||1, src.height||1))
           .setScrollFactor(0).setDepth(D+2).setAlpha(0);
        portraitObjs.push(img);
      } else {
        const em = this.add.text(cx, H/2-20, PIECE_LABEL[piece.type]??"?", {
          fontSize:"54px", fontFamily:"'Apple Color Emoji',sans-serif",
        }).setOrigin(0.5).setScrollFactor(0).setDepth(D+2).setAlpha(0);
        portraitObjs.push(em);
      }

      const name = piece.type.charAt(0).toUpperCase()+piece.type.slice(1);
      portraitObjs.push(this.add.text(cx, H/2+56, name,{
        fontSize:"13px",fontFamily:"Inter,sans-serif",fontStyle:"bold",
        color: isLight?"#d4af37":"#60a5fa",letterSpacing:2,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(D+2).setAlpha(0));
      const tag = piece===(data.isLocalAttacker?data.attacker:data.defender)?"YOU":"ENEMY";
      portraitObjs.push(this.add.text(cx, H/2+74, tag,{
        fontSize:"10px",fontFamily:"Inter,sans-serif",color:"#6b7280",fontStyle:"bold",
      }).setOrigin(0.5).setScrollFactor(0).setDepth(D+2).setAlpha(0));
    };
    makeCard(data.attacker, W*0.26);
    makeCard(data.defender, W*0.74);

    const bw=180,bh=86;
    const bannerBg = this.add.graphics().setScrollFactor(0).setDepth(D+1);
    bannerBg.fillStyle(0x5c3a00,0.95);
    bannerBg.fillRoundedRect(W/2-bw/2,H/2-bh/2,bw,bh,6);
    bannerBg.lineStyle(2,0xd4af37,0.8);
    bannerBg.strokeRoundedRect(W/2-bw/2,H/2-bh/2,bw,bh,6);
    bannerBg.fillStyle(0xd4af37,1);
    for (const [ox,oy] of [[-bw/2,-bh/2],[bw/2,-bh/2],[-bw/2,bh/2],[bw/2,bh/2]])
      bannerBg.fillCircle(W/2+ox,H/2+oy,4);
    const getReady = this.add.text(W/2,H/2,"GET\nREADY",{
      fontSize:"30px",fontFamily:"'Georgia','Times New Roman',serif",
      fontStyle:"bold",color:"#f9fafb",align:"center",lineSpacing:4,
      shadow:{offsetX:2,offsetY:2,color:"#000",blur:4,fill:true},
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D+2);

    // Zoom in during GET READY
    this.tweens.add({ targets:this.cameras.main, zoom:1.0, duration:1200, ease:"Cubic.easeOut", delay:300 });

    const allObjs = [overlay, bannerBg, getReady];
    this.tweens.add({
      targets:allObjs, alpha:{from:0,to:1}, duration:350, ease:"Quad.easeOut",
      onComplete: () => this.time.delayedCall(1600, () =>
        this.tweens.add({ targets:allObjs, alpha:0, duration:400, ease:"Quad.easeIn",
          onComplete: () => { allObjs.forEach(o=>o.destroy());
            this.time.delayedCall(600, () => { this.combatLocked=false; }); } })),
    });
    this.tweens.add({
      targets:portraitObjs, alpha:1, duration:350, ease:"Quad.easeOut",
      onComplete: () => this.time.delayedCall(1600, () =>
        this.tweens.add({ targets:portraitObjs, alpha:0, duration:400, ease:"Quad.easeIn",
          onComplete: () => portraitObjs.forEach(o=>(o as {destroy():void}).destroy()) })),
    });
  }

  // ── Touch controls ────────────────────────────────────────────────────────
  private setupTouchControls() {
    if (!this.sys.game.device.input.touch) return;
    this.input.addPointer(2);

    // Positions based on actual canvas size (landscape: 576×360)
    const SW = this.scale.width, SH = this.scale.height;
    const jY = SH - 72;  // 72px from bottom
    this.joystickBaseX = 80;
    this.joystickBaseY = jY;

    this.joystickBase = this.add.arc(this.joystickBaseX, this.joystickBaseY, 52,0,360,false,0xffffff,0.1)
      .setStrokeStyle(2,0xffffff,0.25).setScrollFactor(0).setDepth(20);
    this.joystickThumb = this.add.arc(this.joystickBaseX, this.joystickBaseY, 24,0,360,false,0xffffff,0.35)
      .setScrollFactor(0).setDepth(21);

    // Right thumb: aim zone hint
    const aimHintX = SW - 80, aimHintY = jY;
    const aimHint = this.add.arc(aimHintX, aimHintY, 46,0,360,false,0xfb7185,0.15)
      .setStrokeStyle(2,0xfb7185,0.35).setScrollFactor(0).setDepth(20);
    this.add.text(aimHintX, aimHintY,"AIM\n& FIRE",{
      fontSize:"9px",fontFamily:"Inter,sans-serif",color:"rgba(251,113,133,0.55)",align:"center",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.tweens.add({ targets:aimHint, alpha:{from:0.15,to:0.45}, duration:900, yoyo:true, repeat:-1 });

    // Aim line (world-space, updated each frame)
    this.aimLine = this.add.graphics().setDepth(22);

    const leftBound = this.scale.width * 0.52; // left 52% = movement zone
    this.input.on("pointerdown",(ptr:Phaser.Input.Pointer)=>{
      if (ptr.x < leftBound && this.joystickPointerId===-1) {
        this.joystickPointerId=ptr.id;
        this.joystickBaseX=ptr.x; this.joystickBaseY=ptr.y;
        this.joystickBase?.setPosition(ptr.x,ptr.y);
        this.joystickThumb?.setPosition(ptr.x,ptr.y);
      } else if (ptr.x >= leftBound && this.rightDragId===-1) {
        this.rightDragId=ptr.id;
        this.rightDragOx=ptr.x; this.rightDragOy=ptr.y;
      }
    });

    this.input.on("pointermove",(ptr:Phaser.Input.Pointer)=>{
      if (ptr.id===this.joystickPointerId) {
        const dx=ptr.x-this.joystickBaseX, dy=ptr.y-this.joystickBaseY;
        const dist=Math.sqrt(dx*dx+dy*dy), maxR=48;
        const clamp=Math.min(dist,maxR), a=Math.atan2(dy,dx);
        this.joystickThumb?.setPosition(this.joystickBaseX+Math.cos(a)*clamp, this.joystickBaseY+Math.sin(a)*clamp);
        this.joystickDx=dist>8?dx/dist:0; this.joystickDy=dist>8?dy/dist:0;
      }
      if (ptr.id===this.rightDragId && !this.combatLocked && !this.ended) {
        const dx=ptr.x-this.rightDragOx, dy=ptr.y-this.rightDragOy;
        if (Math.sqrt(dx*dx+dy*dy)>8) this.localUnit.facing=Math.atan2(dy,dx);
      }
    });

    this.input.on("pointerup",(ptr:Phaser.Input.Pointer)=>{
      if (ptr.id===this.joystickPointerId) {
        this.joystickPointerId=-1; this.joystickDx=0; this.joystickDy=0;
        this.joystickThumb?.setPosition(this.joystickBaseX,this.joystickBaseY);
      }
      if (ptr.id===this.rightDragId) {
        this.rightDragId=-1;
        if (!this.combatLocked && !this.ended) {
          const u=this.localUnit;
          if (u.attackPhase==="idle") {
            const ax=u.x+Math.cos(u.facing)*u.spec.attack.range*SCALE;
            const ay=u.y+Math.sin(u.facing)*u.spec.attack.range*SCALE;
            this.startAttack(u,ax,ay);
          }
        }
      }
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────
  update(time: number, delta: number) {
    if (this.ended) return;

    // Always sync visuals
    this.syncVisuals(this.attacker);
    this.syncVisuals(this.defender);

    if (this.combatLocked) return;

    // Mouse aim (non-touch)
    if (!this.sys.game.device.input.touch) {
      const wp = this.cameras.main.getWorldPoint(this.input.activePointer.x, this.input.activePointer.y);
      this.localUnit.facing = Phaser.Math.Angle.Between(this.localUnit.x, this.localUnit.y, wp.x, wp.y);
    }

    this.handleLocalInput();
    this.runAI(this.remoteUnit, time);
    this.tickAttack(this.attacker, delta, time);
    this.tickAttack(this.defender, delta, time);
    this.moveUnit(this.attacker, delta);
    this.moveUnit(this.defender, delta);
    this.updateProjectiles(delta);
    this.updateAimLine();
    this.checkEnd();

    // Camera follows midpoint
    const mx = (this.localUnit.x + this.remoteUnit.x) / 2;
    const my = (this.localUnit.y + this.remoteUnit.y) / 2;
    this.cameras.main.centerOn(mx, my);
  }

  private updateAimLine() {
    if (!this.aimLine) return;
    this.aimLine.clear();
    // Show aim line on mobile only when right-thumb is actively dragging
    if (!this.sys.game.device.input.touch || this.rightDragId === -1) return;

    const u    = this.localUnit;
    const rang = u.spec.attack.range * SCALE;
    const cos  = Math.cos(u.facing), sin = Math.sin(u.facing);
    const ex   = u.x + cos * rang,   ey = u.y + sin * rang;

    // Dashed targeting line
    const segs = 10;
    this.aimLine.lineStyle(2, 0xfbbf24, 0.5);
    for (let i = 0; i < segs; i++) {
      const t0 = (i + 0.08) / segs;
      const t1 = (i + 0.58) / segs;
      this.aimLine.lineBetween(
        u.x + cos * rang * t0, u.y + sin * rang * t0,
        u.x + cos * rang * t1, u.y + sin * rang * t1,
      );
    }
    // Crosshair at tip
    this.aimLine.lineStyle(2, 0xfbbf24, 0.75);
    this.aimLine.strokeCircle(ex, ey, 8);
    this.aimLine.lineBetween(ex - 12, ey, ex + 12, ey);
    this.aimLine.lineBetween(ex, ey - 12, ex, ey + 12);
  }

  private syncVisuals(u: CombatUnit) {
    u.sprite.setPosition(u.x, u.y);
    u.ring.setPosition(u.x, u.y);
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  private handleLocalInput() {
    const u  = this.localUnit;
    const wK = this.input.keyboard!.addKey("W");
    const aK = this.input.keyboard!.addKey("A");
    const sK = this.input.keyboard!.addKey("S");
    const dK = this.input.keyboard!.addKey("D");
    let dx=0, dy=0;
    if (this.cursors.left.isDown  || aK.isDown) dx-=1;
    if (this.cursors.right.isDown || dK.isDown) dx+=1;
    if (this.cursors.up.isDown    || wK.isDown) dy-=1;
    if (this.cursors.down.isDown  || sK.isDown) dy+=1;
    if (this.joystickPointerId!==-1) { dx=this.joystickDx; dy=this.joystickDy; }
    if (dx!==0&&dy!==0) { dx*=0.707; dy*=0.707; }
    u.vx=dx*u.speedPx; u.vy=dy*u.speedPx;

    // Space = fire toward enemy (keyboard fallback)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && u.attackPhase==="idle") {
      const e=this.remoteUnit;
      u.facing=Phaser.Math.Angle.Between(u.x,u.y,e.x,e.y);
      this.startAttack(u,e.x,e.y);
    }
  }

  // ── Attack state machine ──────────────────────────────────────────────────
  private startAttack(u: CombatUnit, ax: number, ay: number) {
    if (u.attackPhase!=="idle") return;
    u.attackPhase="windup"; u.attackTimer=u.spec.attack.windup*1000;
    u.aimX=ax; u.aimY=ay;
  }

  private tickAttack(u: CombatUnit, delta: number, time: number) {
    if (u.attackPhase==="cooldown") { if (time>=u.cooldownEnd) u.attackPhase="idle"; return; }
    if (u.attackPhase==="idle") return;
    u.attackTimer-=delta;
    if (u.attackTimer>0) return;
    if (u.attackPhase==="windup") {
      this.resolveAttack(u);
      if (u.spec.attack.active>0) { u.attackPhase="active"; u.attackTimer=u.spec.attack.active*1000; }
      else                         { u.attackPhase="recovery"; u.attackTimer=u.spec.attack.recovery*1000; }
    } else if (u.attackPhase==="active") {
      u.attackPhase="recovery"; u.attackTimer=u.spec.attack.recovery*1000;
    } else if (u.attackPhase==="recovery") {
      u.attackPhase="cooldown"; u.cooldownEnd=time+u.spec.attack.cooldown*1000;
    }
  }

  private resolveAttack(u: CombatUnit) {
    if (u.spec.attack.type==="projectile") this.fireProjectile(u);
    else this.resolveMelee(u, u===this.attacker?this.defender:this.attacker);
  }

  // ── Projectile ────────────────────────────────────────────────────────────
  private fireProjectile(from: CombatUnit) {
    const p   = from.spec.attack.proj!;
    const ang = from.facing;
    const sx  = from.x + Math.cos(ang) * p.spawnOffset * SCALE;
    const sy  = from.y + Math.sin(ang) * p.spawnOffset * SCALE;
    const rPx = Math.max(4, p.radius * SCALE);
    const tgt = from === this.attacker ? this.defender : this.attacker;
    const vis = PROJ_VISUALS[from.piece.type] ?? FALLBACK_PROJ_VISUAL;

    const g = this.add.graphics();
    g.setPosition(sx, sy);
    if (vis.rotateWithVelocity) g.rotation = ang;
    vis.draw(g, rPx);
    g.setDepth(20);

    g.setData("vx",         Math.cos(ang) * p.speed * SCALE);
    g.setData("vy",         Math.sin(ang) * p.speed * SCALE);
    g.setData("owner",      from === this.attacker ? "attacker" : "defender");
    g.setData("dmg",        from.spec.attack.damage);
    g.setData("rPx",        rPx);
    g.setData("maxR",       from.spec.attack.range * SCALE);
    g.setData("dist",       0);
    g.setData("flying",     tgt.isFlying);
    g.setData("visKey",     from.piece.type);
    g.setData("trailTimer", 0);
    this.projectiles.add(g);
  }

  private updateProjectiles(delta: number) {
    const dt = delta / 1000;
    for (const obj of [...this.projectiles.getChildren()]) {
      const g  = obj as Phaser.GameObjects.Graphics;
      const vx = g.getData("vx") as number;
      const vy = g.getData("vy") as number;
      g.x += vx * dt;
      g.y += vy * dt;

      const traveled = (g.getData("dist") as number) + Math.hypot(vx, vy) * dt;
      g.setData("dist", traveled);

      if (g.x < 0 || g.x > WORLD_W || g.y < 0 || g.y > WORLD_H) { g.destroy(); continue; }
      if (traveled > (g.getData("maxR") as number)) { g.destroy(); continue; }

      const rPx    = g.getData("rPx") as number;
      const visKey = g.getData("visKey") as string;
      const vis    = PROJ_VISUALS[visKey] ?? FALLBACK_PROJ_VISUAL;

      // Keep velocity-aligned projectiles pointed the right way
      if (vis.rotateWithVelocity) g.rotation = Math.atan2(vy, vx);

      // Spawn trail particle at configured interval
      let tt = (g.getData("trailTimer") as number) + delta;
      if (tt >= vis.trailInterval) {
        tt = 0;
        const tr = this.add.arc(g.x, g.y, rPx * vis.trailRatio, 0, 360, false, vis.trailColor, vis.trailAlpha);
        tr.setDepth(19);
        this.tweens.add({ targets: tr, alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: vis.trailLife, ease: "Quad.easeOut", onComplete: () => tr.destroy() });
      }
      g.setData("trailTimer", tt);

      // Obstacle collision (skip for flying targets)
      if (!(g.getData("flying") as boolean)) {
        let hit = false;
        for (const o of this.obstacles)
          if (Phaser.Math.Distance.Between(g.x, g.y, o.x, o.y) < o.r + rPx) { hit = true; break; }
        if (hit) { g.destroy(); continue; }
      }

      // Unit hit detection
      const owner = g.getData("owner") as string;
      const atk   = owner === "attacker" ? this.attacker : this.defender;
      const tgt   = owner === "attacker" ? this.defender : this.attacker;
      if (Phaser.Math.Distance.Between(g.x, g.y, tgt.x, tgt.y) <= rPx + tgt.bodyPx) {
        this.spawnImpact(g.x, g.y, vis.impactType);
        this.applyDamage(atk, tgt, g.getData("dmg") as number);
        g.destroy();
      }
    }
  }

  private spawnImpact(x: number, y: number, type: ImpactType) {
    const cfgs: Record<ImpactType, { colors: number[]; count: number; spread: number; r: number; life: number }> = {
      spark:       { colors: [0xd1d5db, 0xf9fafb, 0x9ca3af], count: 5, spread: 26, r: 3.0, life: 190 },
      flame_small: { colors: [0xff8c42, 0xffec00, 0xff6b35], count: 6, spread: 30, r: 4.5, life: 215 },
      flame_large: { colors: [0xff6b00, 0xff4500, 0xffec00, 0xff8c00], count: 9, spread: 54, r: 6.0, life: 295 },
      magic_blue:  { colors: [0x93c5fd, 0x818cf8, 0xe0f2fe], count: 6, spread: 30, r: 4.0, life: 215 },
      dark_pulse:  { colors: [0xa855f7, 0x7c3aed, 0x4c1d95], count: 7, spread: 36, r: 5.0, life: 250 },
      venom_splat: { colors: [0x22c55e, 0x4ade80, 0x15803d], count: 6, spread: 32, r: 5.0, life: 235 },
    };
    const cfg = cfgs[type];

    for (let i = 0; i < cfg.count; i++) {
      const angle = (i / cfg.count) * Math.PI * 2 + Phaser.Math.Between(-18, 18) * 0.0175;
      const dist  = Phaser.Math.Between(Math.round(cfg.spread * 0.45), cfg.spread);
      const col   = cfg.colors[i % cfg.colors.length];
      const sp = this.add.arc(x, y, cfg.r, 0, 360, false, col).setDepth(29);
      this.tweens.add({
        targets: sp,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scaleX: 0.1, scaleY: 0.1,
        duration: cfg.life, ease: "Quad.easeOut",
        onComplete: () => sp.destroy(),
      });
    }

    // Type-specific bonus VFX
    if (type === "dark_pulse") {
      const ring = this.add.graphics().setDepth(28);
      ring.setPosition(x, y);
      ring.lineStyle(2.5, 0xa855f7, 0.85);
      ring.strokeCircle(0, 0, 9);
      this.tweens.add({ targets: ring, scaleX: 4.5, scaleY: 4.5, alpha: 0, duration: 285, ease: "Quad.easeOut", onComplete: () => ring.destroy() });
    }
    if (type === "venom_splat") {
      const splat = this.add.arc(x, y, 11, 0, 360, false, 0x22c55e, 0.42).setDepth(18);
      this.tweens.add({ targets: splat, scaleX: 1.9, scaleY: 1.9, alpha: 0, duration: 360, ease: "Quad.easeOut", onComplete: () => splat.destroy() });
    }
    if (type === "flame_large") {
      const flash = this.add.arc(x, y, 14, 0, 360, false, 0xff8c00, 0.45).setDepth(28);
      this.tweens.add({ targets: flash, scaleX: 2.8, scaleY: 2.8, alpha: 0, duration: 200, ease: "Quad.easeOut", onComplete: () => flash.destroy() });
    }
  }

  // ── Melee ─────────────────────────────────────────────────────────────────
  private resolveMelee(from: CombatUnit, enemy: CombatUnit) {
    const atk=from.spec.attack, hb=atk.hitbox!, facing=from.facing;
    let hit=false;

    if (atk.type==="melee_cone") {
      const r=(hb.radius??1)*SCALE, half=(hb.angleDeg??90)/2;
      const dist=Phaser.Math.Distance.Between(from.x,from.y,enemy.x,enemy.y);
      if (dist<=r+enemy.bodyPx) {
        const toE=Phaser.Math.Angle.Between(from.x,from.y,enemy.x,enemy.y);
        const diff=Math.abs(Phaser.Math.Angle.ShortestBetween(
          Phaser.Math.RadToDeg(facing), Phaser.Math.RadToDeg(toE)));
        if (diff<=half) hit=true;
      }
      this.flashCone(from.x,from.y,r,half,facing);

    } else if (atk.type==="melee_rectangle") {
      const len=(hb.length??1)*SCALE, wid=(hb.width??0.4)*SCALE;
      const cos=Math.cos(-facing), sin=Math.sin(-facing);
      const dx=enemy.x-from.x, dy=enemy.y-from.y;
      const lx=dx*cos-dy*sin, ly=dx*sin+dy*cos;
      if (Math.abs(lx-len/2)<=len/2+enemy.bodyPx && Math.abs(ly)<=wid/2+enemy.bodyPx) hit=true;
      this.flashRect(from.x,from.y,len,wid,facing);

    } else if (atk.type==="melee_circle_aoe") {
      const off=(hb.centerOffset??0.5)*SCALE, r=(hb.radius??0.5)*SCALE;
      const cx=from.x+Math.cos(facing)*off, cy=from.y+Math.sin(facing)*off;
      if (Phaser.Math.Distance.Between(cx,cy,enemy.x,enemy.y)<=r+enemy.bodyPx) hit=true;
      this.flashCircle(cx,cy,r);
    }

    if (hit) this.applyDamage(from,enemy,atk.damage);
  }

  private flashCone(ox:number,oy:number,r:number,halfDeg:number,angle:number) {
    const g=this.add.graphics().setDepth(25);
    g.fillStyle(0xfbbf24,0.55);
    const segs=8, startA=angle-Phaser.Math.DegToRad(halfDeg), endA=angle+Phaser.Math.DegToRad(halfDeg);
    const pts=[{x:ox,y:oy}];
    for (let i=0;i<=segs;i++) {
      const a=startA+(endA-startA)*(i/segs);
      pts.push({x:ox+Math.cos(a)*r,y:oy+Math.sin(a)*r});
    }
    g.fillPoints(pts as Phaser.Math.Vector2[],true);
    this.tweens.add({targets:g,alpha:0,duration:150,onComplete:()=>g.destroy()});
  }

  private flashRect(ox:number,oy:number,len:number,wid:number,angle:number) {
    const g=this.add.graphics().setDepth(25);
    g.fillStyle(0xfbbf24,0.5);
    const cos=Math.cos(angle),sin=Math.sin(angle);
    const pts=[
      {x:ox-sin*(-wid/2),          y:oy+cos*(-wid/2)},
      {x:ox+cos*len-sin*(-wid/2),  y:oy+sin*len+cos*(-wid/2)},
      {x:ox+cos*len-sin*(wid/2),   y:oy+sin*len+cos*(wid/2)},
      {x:ox-sin*(wid/2),           y:oy+cos*(wid/2)},
    ];
    g.fillPoints(pts as Phaser.Math.Vector2[],true);
    this.tweens.add({targets:g,alpha:0,duration:150,onComplete:()=>g.destroy()});
  }

  private flashCircle(cx:number,cy:number,r:number) {
    const g=this.add.graphics().setDepth(25);
    g.fillStyle(0xfbbf24,0.5);
    g.fillCircle(cx,cy,r);
    this.tweens.add({targets:g,alpha:0,duration:200,onComplete:()=>g.destroy()});
  }

  // ── Damage ────────────────────────────────────────────────────────────────
  private applyDamage(attacker: CombatUnit, target: CombatUnit, baseDmg: number) {
    const dmg = Math.max(1, Math.round(baseDmg * attacker.dmgDealt * target.dmgTaken));
    target.hp = Math.max(0, target.hp - dmg);
    const pct = target.hp / target.maxHp;

    target.hpBar.width    = BAR_W * pct;
    target.hpBar.fillColor = this.hpColor(pct);
    target.hpText.setText(`${target.hp}/${target.maxHp}`);
    if (pct<0.3) this.tweens.add({targets:target.hpBar,alpha:{from:0.4,to:1},duration:250,yoyo:true});

    this.cameras.main.shake(80, 0.008);
    this.tweens.add({targets:target.ring, alpha:0.1, duration:60, yoyo:true});

    // Floating number
    const fx=target.x+Phaser.Math.Between(-14,14), fy=target.y-target.bodyPx-6;
    const ft=this.add.text(fx,fy,`-${dmg}`,{
      fontSize:"18px",fontStyle:"bold",fontFamily:"Inter,sans-serif",color:"#fbbf24",
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({targets:ft,y:fy-44,alpha:0,scaleX:1.3,scaleY:1.3,duration:650,ease:"Quad.easeOut",onComplete:()=>ft.destroy()});

    // Sparks
    const sc=target.piece.side==="light"?PROJ_DARK:PROJ_LIGHT;
    for (let i=0;i<4;i++) {
      const a=(i/4)*Math.PI*2;
      const sp=this.add.arc(target.x,target.y,4,0,360,false,sc).setDepth(29);
      this.tweens.add({targets:sp,x:target.x+Math.cos(a)*28,y:target.y+Math.sin(a)*28,
        alpha:0,scaleX:0.2,scaleY:0.2,duration:280,ease:"Quad.easeOut",onComplete:()=>sp.destroy()});
    }
  }

  // ── Movement ──────────────────────────────────────────────────────────────
  private moveUnit(u: CombatUnit, delta: number) {
    const dt=delta/1000;
    let nx=u.x+u.vx*dt, ny=u.y+u.vy*dt;
    nx=Phaser.Math.Clamp(nx, u.bodyPx+4, WORLD_W-u.bodyPx-4);
    ny=Phaser.Math.Clamp(ny, u.bodyPx+4, WORLD_H-u.bodyPx-4);

    // Obstacle push-out (ground only)
    if (!u.isFlying) {
      for (const obs of this.obstacles) {
        const dist=Phaser.Math.Distance.Between(nx,ny,obs.x,obs.y);
        const min=obs.r+u.bodyPx;
        if (dist<min) {
          const a=Math.atan2(ny-obs.y,nx-obs.x);
          nx=obs.x+Math.cos(a)*min; ny=obs.y+Math.sin(a)*min;
        }
      }
    }

    // Soft unit collision
    const other=u===this.attacker?this.defender:this.attacker;
    const minD=u.bodyPx+other.bodyPx;
    const ddx=nx-other.x, ddy=ny-other.y;
    const d=Math.hypot(ddx,ddy)||1;
    if (d<minD) { const push=(minD-d)/2; nx+=(ddx/d)*push; ny+=(ddy/d)*push; }

    u.x=nx; u.y=ny;
  }

  // ── AI ────────────────────────────────────────────────────────────────────
  private runAI(u: CombatUnit, time: number) {
    if (!u.aiTarget) return;
    const tgt=u.aiTarget;
    const dist=Phaser.Math.Distance.Between(u.x,u.y,tgt.x,tgt.y);
    const rangePx=u.spec.attack.range*SCALE;
    const isMelee=u.spec.attack.type!=="projectile";
    const ideal=isMelee?rangePx*0.85:rangePx*0.65;
    const dz=u.bodyPx*2;

    u.facing=Phaser.Math.Angle.Between(u.x,u.y,tgt.x,tgt.y);

    if (dist>ideal+dz) {
      u.vx=Math.cos(u.facing)*u.speedPx; u.vy=Math.sin(u.facing)*u.speedPx;
    } else if (dist<ideal-dz&&!isMelee) {
      u.vx=-Math.cos(u.facing)*u.speedPx; u.vy=-Math.sin(u.facing)*u.speedPx;
    } else {
      u.vx=0; u.vy=0;
    }

    if (dist<=rangePx && u.attackPhase==="idle") this.startAttack(u,tgt.x,tgt.y);
  }

  // ── End ───────────────────────────────────────────────────────────────────
  private checkEnd() {
    if (this.attacker.hp>0&&this.defender.hp>0) return;
    this.ended=true;
    const loser=this.attacker.hp<=0?this.attacker:this.defender;
    const winner=loser===this.attacker?this.defender:this.attacker;
    const wc=winner.piece.side==="light"?0x818cf8:0xfb7185;
    this.tweens.add({targets:loser.sprite,scaleX:0,scaleY:0,alpha:0.1,duration:400,ease:"Quad.easeIn"});
    this.cameras.main.flash(300,(wc>>16)&0xff,(wc>>8)&0xff,wc&0xff,false);
    this.time.delayedCall(500,()=>{
      // Convert spec-scale HP back to board-scale so GameRoom's piece state stays consistent.
      // Loser always returns 0; winner's HP ratio is preserved.
      const scale = (u: CombatUnit) =>
        u.hp <= 0 ? 0 : Math.max(1, Math.round(u.hp / u.maxHp * u.piece.maxHp));
      this.onCombatEnd?.(scale(this.attacker), scale(this.defender));
      // Restore portrait canvas and wake the board
      this.scale.resize(576, 576);
      this.scene.wake("BoardScene");
      this.scene.stop();
    });
  }
}

const PIECE_LABEL: Record<string,string> = {
  wizard:"🧙",sorceress:"🔮",unicorn:"🦄",basilisk:"🐍",
  archer:"🏹",manticore:"🦁",valkyrie:"⚔️",banshee:"👻",
  golem:"🗿",troll:"👹",djinni:"🌪️",dragon:"🐉",
  phoenix:"🦅",shapeshifter:"🌀",knight:"♞",goblin:"👺",
  elemental_fire:"🔥",elemental_earth:"🪨",elemental_water:"💧",elemental_air:"💨",
};
