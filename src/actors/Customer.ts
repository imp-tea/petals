import Phaser from "phaser";
import type { Need } from "../state/GameState";

function ensureTexture(scene: Phaser.Scene, key: string, color: number) {
  if (scene.textures.exists(key)) {
    return;
  }
  const gfx = scene.add.graphics();
  gfx.fillStyle(color, 1);
  gfx.fillRect(0, 0, 16, 16);
  gfx.generateTexture(key, 16, 16);
  gfx.destroy();
}

export default class Customer extends Phaser.Physics.Arcade.Sprite {
  readonly need: Need;
  private readonly roamArea: Phaser.Geom.Rectangle;
  private target: Phaser.Math.Vector2 | null = null;
  private repathTime = 0;
  private readonly speed = 40;

  constructor(scene: Phaser.Scene, x: number, y: number, need: Need, roamArea: Phaser.Geom.Rectangle) {
    ensureTexture(scene, "customer", 0xfbbf24);
    super(scene, x, y, "customer");

    this.need = need;
    this.roamArea = new Phaser.Geom.Rectangle(roamArea.x, roamArea.y, roamArea.width, roamArea.height);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(16, 16);
    this.setOffset(0, 0);
  }

  update(time: number) {
    if (!this.active) {
      this.setVelocity(0, 0);
      return;
    }

    if (this.target) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
      if (distance < 4) {
        this.setVelocity(0, 0);
        this.target = null;
        this.repathTime = time + Phaser.Math.Between(800, 1600);
      }
    }

    if (!this.target && time > this.repathTime) {
      this.chooseNewTarget();
    }
  }

  private chooseNewTarget() {
    const x = Phaser.Math.Between(this.roamArea.left + 8, this.roamArea.right - 8);
    const y = Phaser.Math.Between(this.roamArea.top + 8, this.roamArea.bottom - 8);
    this.target = new Phaser.Math.Vector2(x, y);
    this.scene.physics.moveTo(this, x, y, this.speed);
  }
}
