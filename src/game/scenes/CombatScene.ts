import * as Phaser from "phaser";
import { LUMINANCE_COLORS } from "@/lib/constants";
import type { BoardPiece, CombatState } from "@/lib/types";

const ARENA_W = 576;
const ARENA_H = 576;

// Modern arena palette
const BARRIER_COLORS = [0x374151, 0x4b5563, 0x6b7280];
const PROJ_LIGHT = 0x818cf8;
const PROJ_DARK  = 0xfb7185;

interface CombatUnit {
  piece: BoardPiece;
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  hpBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
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
  private barriers: Phaser.GameObjects.Rectangle[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private onCombatEnd?: (attackerHp: number, defenderHp: number) => void;
  private ended = false;
  private isLocalAttacker = true;

  constructor() {
    super({ key: "CombatScene" });
  }

  create(data: SceneData) {
    this.ended = false;
    this.onCombatEnd = data.onCombatEnd;
    this.isLocalAttacker = data.isLocalAttacker;

    const lumStep = data.combatState.squareLuminance;
    this.cameras.main.setBackgroundColor(this.arenaBackground(lumStep));

    this.projectiles = this.add.group();
    this.createBarriers();
    this.drawArenaFrame(lumStep);

    const aBonus = this.hpBonus(data.attacker.side, lumStep);
    const dBonus = this.hpBonus(data.defender.side, lumStep);

    this.attacker = this.createUnit(data.attacker, 80,          ARENA_H / 2, aBonus, data.isLocalAttacker);
    this.defender = this.createUnit(data.defender, ARENA_W - 80, ARENA_H / 2, dBonus, !data.isLocalAttacker);

    this.localUnit  = data.isLocalAttacker ? this.attacker : this.defender;
    this.remoteUnit = data.isLocalAttacker ? this.defender : this.attacker;
    this.remoteUnit.aiTarget = this.localUnit;

    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.fireKey  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Title card
    const title = this.add.text(ARENA_W / 2, 28, "⚔  BATTLE  ⚔", {
      fontSize: "18px", fontFamily: "Inter, sans-serif", fontStyle: "bold", color: "#f59e0b",
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: { from: 0, to: 1 }, duration: 400 });
  }

  private arenaBackground(step: number): number {
    const bases = [0x050505, 0x050510, 0x10051a, 0x051008, 0x05100f, 0x1a1a1a];
    return bases[step] ?? 0x0a0a0a;
  }

  private hpBonus(side: "light" | "dark", step: number): number {
    return side === "light" ? Math.round((step / 5) * 7) : Math.round(((5 - step) / 5) * 7);
  }

  private drawArenaFrame(step: number) {
    const g = this.add.graphics();
    // Outer glow border
    const borderColor = step >= 3 ? 0x818cf8 : 0xfb7185;
    g.lineStyle(3, borderColor, 0.5);
    g.strokeRect(4, 4, ARENA_W - 8, ARENA_H - 8);
    // Corner accents
    const corners: [number, number][] = [[0,0],[ARENA_W,0],[0,ARENA_H],[ARENA_W,ARENA_H]];
    for (const [cx, cy] of corners) {
      g.lineStyle(2, 0xf59e0b, 0.8);
      g.strokeRect(cx === 0 ? 8 : ARENA_W - 22, cy === 0 ? 8 : ARENA_H - 22, 14, 14);
    }
  }

  private createBarriers() {
    const positions = [
      [120, 140], [240, 100], [360, 140], [460, 200],
      [120, 430], [240, 470], [360, 430], [460, 380],
    ];
    for (let i = 0; i < positions.length; i++) {
      const [x, y] = positions[i];
      const w = 60 + (i % 3) * 20;
      const h = 20 + (i % 2) * 14;
      const color = BARRIER_COLORS[i % BARRIER_COLORS.length];
      const b = this.add.rectangle(x, y, w, h, color);
      b.setStrokeStyle(1, 0x6b7280, 0.5);
      this.barriers.push(b);
    }
  }

  private createUnit(piece: BoardPiece, x: number, y: number, hpBonus: number, isLocal: boolean): CombatUnit {
    const hp = Math.min(piece.hp + hpBonus, piece.maxHp + hpBonus);
    const isLight = piece.side === "light";
    const fillColor = isLight ? 0x3730a3 : 0x9f1239;
    const strokeColor = isLight ? 0x818cf8 : 0xfb7185;

    const circle = this.add.arc(x, y, 24, 0, 360, false, fillColor);
    circle.setStrokeStyle(2, strokeColor);

    const label = this.add.text(x, y, PIECE_LABEL[piece.type] ?? "?", {
      fontSize: "13px", fontFamily: "Inter, sans-serif", fontStyle: "bold", color: "#fff",
    }).setOrigin(0.5);

    // HP bar
    const barW = 60;
    const hpBg = this.add.rectangle(x, y - 38, barW, 8, 0x1f2937).setStrokeStyle(1, 0x374151);
    const hpBar = this.add.rectangle(x - barW / 2, y - 38, barW, 8, isLight ? 0x818cf8 : 0xfb7185).setOrigin(0, 0.5);

    // Name label
    this.add.text(x, y - 50, piece.type.toUpperCase(), {
      fontSize: "9px", fontFamily: "Inter, sans-serif", color: isLight ? "#818cf8" : "#fb7185",
    }).setOrigin(0.5);

    return { piece, circle, label, hpBg, hpBar, hp, maxHp: hp, lastFired: 0, vx: 0, vy: 0, isLocal };
  }

  update(time: number) {
    if (this.ended) return;
    this.handleLocalInput(time);
    this.runAI(this.remoteUnit, time);
    this.moveUnit(this.attacker);
    this.moveUnit(this.defender);
    this.updateProjectiles();
    this.checkEnd();
  }

  private handleLocalInput(time: number) {
    const u = this.localUnit;
    const speed = 180;
    u.vx = 0; u.vy = 0;
    if (this.cursors.left.isDown)  u.vx = -speed;
    if (this.cursors.right.isDown) u.vx =  speed;
    if (this.cursors.up.isDown)    u.vy = -speed;
    if (this.cursors.down.isDown)  u.vy =  speed;

    if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
      const cooldown = 1000 / u.piece.attackSpeed;
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
    const speed = 120;

    // Move toward target but keep distance ~150px
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
    const nx = Phaser.Math.Clamp(u.circle.x + u.vx * dt, 28, ARENA_W - 28);
    const ny = Phaser.Math.Clamp(u.circle.y + u.vy * dt, 28, ARENA_H - 28);
    u.circle.setPosition(nx, ny);
    u.label.setPosition(nx, ny);
    u.hpBg.setPosition(nx, ny - 38);
    u.hpBar.setPosition(nx - 30, ny - 38);
  }

  private fireProjectile(from: CombatUnit, to: CombatUnit, time: number) {
    from.lastFired = time;
    const angle = Phaser.Math.Angle.Between(from.circle.x, from.circle.y, to.circle.x, to.circle.y);
    const speed = from.piece.projectileSpeed || 280;
    const color = from.piece.side === "light" ? PROJ_LIGHT : PROJ_DARK;

    const proj = this.add.circle(from.circle.x, from.circle.y, 5, color);
    proj.setData("vx", Math.cos(angle) * speed);
    proj.setData("vy", Math.sin(angle) * speed);
    proj.setData("owner", from === this.attacker ? "attacker" : "defender");
    proj.setData("damage", 2);
    this.projectiles.add(proj);
  }

  private updateProjectiles() {
    const dt = this.game.loop.delta / 1000;
    for (const obj of this.projectiles.getChildren()) {
      const proj = obj as Phaser.GameObjects.Arc;
      proj.x += proj.getData("vx") * dt;
      proj.y += proj.getData("vy") * dt;

      if (proj.x < 0 || proj.x > ARENA_W || proj.y < 0 || proj.y > ARENA_H) {
        proj.destroy(); continue;
      }
      const owner = proj.getData("owner");
      const target = owner === "attacker" ? this.defender : this.attacker;
      if (Phaser.Math.Distance.Between(proj.x, proj.y, target.circle.x, target.circle.y) < 26) {
        target.hp = Math.max(0, target.hp - proj.getData("damage"));
        const pct = target.hp / target.maxHp;
        target.hpBar.width = 60 * pct;
        // Flash effect
        this.tweens.add({ targets: target.circle, alpha: 0.3, duration: 60, yoyo: true });
        proj.destroy();
      }
    }
  }

  private checkEnd() {
    if (this.attacker.hp <= 0 || this.defender.hp <= 0) {
      this.ended = true;
      this.time.delayedCall(600, () => {
        this.onCombatEnd?.(this.attacker.hp, this.defender.hp);
        this.scene.stop();
      });
    }
  }
}

const PIECE_LABEL: Record<string, string> = {
  wizard:"Wiz", sorceress:"Sor", unicorn:"Uni", basilisk:"Bas",
  archer:"Arc", manticore:"Man", valkyrie:"Val", banshee:"Ban",
  golem:"Gol", troll:"Trl", djinni:"Djn", dragon:"Drg",
  phoenix:"Phx", shapeshifter:"Shp", knight:"Knt", goblin:"Gob",
  elemental_fire:"EFi", elemental_earth:"EEr", elemental_water:"EWt", elemental_air:"EAr",
};
