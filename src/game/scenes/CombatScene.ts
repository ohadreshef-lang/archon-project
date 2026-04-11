import * as Phaser from "phaser";
import { TILE_SIZE, LUMINANCE_COLORS } from "@/lib/constants";
import type { BoardPiece, CombatState } from "@/lib/types";

const ARENA_WIDTH  = 576;
const ARENA_HEIGHT = 576;
const BARRIER_COUNT = 8;

interface CombatUnit {
  piece: BoardPiece;
  sprite: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Rectangle;
  hp: number;
  maxHp: number;
  lastFired: number;
  velocity: Phaser.Math.Vector2;
  isLocal: boolean;
}

export class CombatScene extends Phaser.Scene {
  private attacker!: CombatUnit;
  private defender!: CombatUnit;
  private projectiles!: Phaser.GameObjects.Group;
  private barriers: Phaser.GameObjects.Rectangle[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private luminanceStep: number = 3;
  private onCombatEnd?: (attackerHp: number, defenderHp: number) => void;

  constructor() {
    super({ key: "CombatScene" });
  }

  init(data: { combatState: CombatState; attacker: BoardPiece; defender: BoardPiece; isAttacker: boolean; luminanceStep: number }) {
    this.luminanceStep = data.luminanceStep;
  }

  create(data: { combatState: CombatState; attacker: BoardPiece; defender: BoardPiece; isAttacker: boolean; luminanceStep: number }) {
    this.cameras.main.setBackgroundColor(LUMINANCE_COLORS[this.luminanceStep]);

    this.projectiles = this.add.group();
    this.createBarriers();

    const attackerHpBonus = this.calcHpBonus(data.attacker.side, this.luminanceStep);
    const defenderHpBonus = this.calcHpBonus(data.defender.side, this.luminanceStep);

    this.attacker = this.createUnit(data.attacker, 80, ARENA_HEIGHT / 2, attackerHpBonus, data.isAttacker);
    this.defender = this.createUnit(data.defender, ARENA_WIDTH - 80, ARENA_HEIGHT / 2, defenderHpBonus, !data.isAttacker);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private calcHpBonus(side: "light" | "dark", step: number): number {
    // Light gets bonus at high steps (white), dark gets bonus at low steps (black)
    if (side === "light") return Math.round((step / 5) * 7);
    return Math.round(((5 - step) / 5) * 7);
  }

  private createUnit(piece: BoardPiece, x: number, y: number, hpBonus: number, isLocal: boolean): CombatUnit {
    const hp = piece.hp + hpBonus;
    const sprite = this.add.text(x, y, "●", {
      fontSize: "32px",
      color: piece.side === "light" ? "#ffffff" : "#ff4444",
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(x, y - 30, 60, 8, 0x333333);
    const hpBar = this.add.rectangle(x - 30, y - 30, 60, 8, piece.side === "light" ? 0x00ff88 : 0xff4444);
    hpBar.setOrigin(0, 0.5);

    return { piece, sprite, hpBar, hp, maxHp: hp, lastFired: 0, velocity: new Phaser.Math.Vector2(0, 0), isLocal };
  }

  private createBarriers() {
    for (let i = 0; i < BARRIER_COUNT; i++) {
      const x = Phaser.Math.Between(120, ARENA_WIDTH - 120);
      const y = Phaser.Math.Between(80, ARENA_HEIGHT - 80);
      const w = Phaser.Math.Between(32, 80);
      const h = Phaser.Math.Between(20, 48);
      const barrier = this.add.rectangle(x, y, w, h, 0x888888);
      this.barriers.push(barrier);
    }
  }

  update(time: number) {
    this.handleInput(time);
    this.moveUnit(this.attacker);
    this.moveUnit(this.defender);
    this.updateProjectiles();
    this.checkCombatEnd();
  }

  private handleInput(time: number) {
    const unit = this.attacker.isLocal ? this.attacker : this.defender;
    const speed = 180;

    unit.velocity.set(0, 0);
    if (this.cursors.left.isDown)  unit.velocity.x = -speed;
    if (this.cursors.right.isDown) unit.velocity.x =  speed;
    if (this.cursors.up.isDown)    unit.velocity.y = -speed;
    if (this.cursors.down.isDown)  unit.velocity.y =  speed;

    if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
      const cooldown = 1000 / unit.piece.attackSpeed;
      if (time - unit.lastFired > cooldown) {
        this.fireProjectile(unit, time);
      }
    }
  }

  private moveUnit(unit: CombatUnit) {
    const dt = this.game.loop.delta / 1000;
    const nx = unit.sprite.x + unit.velocity.x * dt;
    const ny = unit.sprite.y + unit.velocity.y * dt;

    if (nx > 16 && nx < ARENA_WIDTH - 16) unit.sprite.x = nx;
    if (ny > 16 && ny < ARENA_HEIGHT - 16) unit.sprite.y = ny;

    unit.hpBar.x = unit.sprite.x - 30;
    unit.hpBar.y = unit.sprite.y - 30;
    unit.hpBar.width = 60 * (unit.hp / unit.maxHp);
  }

  private fireProjectile(unit: CombatUnit, time: number) {
    unit.lastFired = time;
    const target = unit === this.attacker ? this.defender : this.attacker;
    const angle = Phaser.Math.Angle.Between(unit.sprite.x, unit.sprite.y, target.sprite.x, target.sprite.y);

    const proj = this.add.circle(unit.sprite.x, unit.sprite.y, 5, unit.piece.side === "light" ? 0xffff00 : 0xff6600);
    const vx = Math.cos(angle) * unit.piece.projectileSpeed;
    const vy = Math.sin(angle) * unit.piece.projectileSpeed;
    proj.setData("vx", vx);
    proj.setData("vy", vy);
    proj.setData("owner", unit === this.attacker ? "attacker" : "defender");
    proj.setData("damage", 2);
    this.projectiles.add(proj);
  }

  private updateProjectiles() {
    const dt = this.game.loop.delta / 1000;
    for (const proj of this.projectiles.getChildren() as Phaser.GameObjects.Arc[]) {
      proj.x += proj.getData("vx") * dt;
      proj.y += proj.getData("vy") * dt;

      // Out of bounds
      if (proj.x < 0 || proj.x > ARENA_WIDTH || proj.y < 0 || proj.y > ARENA_HEIGHT) {
        proj.destroy();
        continue;
      }

      const owner = proj.getData("owner");
      const target = owner === "attacker" ? this.defender : this.attacker;
      const dist = Phaser.Math.Distance.Between(proj.x, proj.y, target.sprite.x, target.sprite.y);
      if (dist < 20) {
        target.hp = Math.max(0, target.hp - proj.getData("damage"));
        target.hpBar.width = 60 * (target.hp / target.maxHp);
        proj.destroy();
      }
    }
  }

  private checkCombatEnd() {
    if (this.attacker.hp <= 0 || this.defender.hp <= 0) {
      this.onCombatEnd?.(this.attacker.hp, this.defender.hp);
      this.scene.stop();
    }
  }

  setCombatEndHandler(fn: (attackerHp: number, defenderHp: number) => void) {
    this.onCombatEnd = fn;
  }
}
