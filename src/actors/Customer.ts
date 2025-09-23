import Phaser from "phaser";
import type { Need } from "../state/GameState";
import { DIRECTIONS_8, type Direction8, vectorToDirection8 } from "./direction";

const SPEED = 60;

const ANIM_KEYS: Record<Direction8, string> = {
  right: "customer-walk-right",
  down_right: "customer-walk-down-right",
  down: "customer-walk-down",
  down_left: "customer-walk-down-left",
  left: "customer-walk-left",
  up_left: "customer-walk-up-left",
  up: "customer-walk-up",
  up_right: "customer-walk-up-right"
};

export default class Customer extends Phaser.Physics.Arcade.Sprite {
  readonly need: Need;
  private readonly roamArea: Phaser.Geom.Rectangle;
  private target: Phaser.Math.Vector2 | null = null;
  private repathTime = 0;
  private lastDirection: Direction8 = "down";

  static registerAnimations(scene: Phaser.Scene) {
    if (scene.anims.exists(ANIM_KEYS.down)) {
      return;
    }

    DIRECTIONS_8.forEach(direction => {
      scene.anims.create({
        key: ANIM_KEYS[direction],
        frames: scene.anims.generateFrameNumbers(ANIM_KEYS[direction], { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    });
  }

  constructor(scene: Phaser.Scene, x: number, y: number, need: Need, roamArea: Phaser.Geom.Rectangle) {
    super(scene, x, y, ANIM_KEYS.down, 0);

    this.need = need;
    this.roamArea = new Phaser.Geom.Rectangle(roamArea.x, roamArea.y, roamArea.width, roamArea.height);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(4);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(36, 48);
    body.setOffset(14, 12);
  }

  update(time: number) {
    if (!this.active) {
      this.setVelocity(0, 0);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.target) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
      if (distance < 12) {
        this.setVelocity(0, 0);
        this.target = null;
        this.repathTime = time + Phaser.Math.Between(1200, 2000);
      }
    }

    if (!this.target && time > this.repathTime) {
      this.chooseNewTarget();
    }

    this.updateAnimation(body.velocity.x, body.velocity.y);
  }

  private chooseNewTarget() {
    const x = Phaser.Math.Between(Math.floor(this.roamArea.left + 32), Math.floor(this.roamArea.right - 32));
    const y = Phaser.Math.Between(Math.floor(this.roamArea.top + 32), Math.floor(this.roamArea.bottom - 32));
    this.target = new Phaser.Math.Vector2(x, y);
    this.scene.physics.moveTo(this, x, y, SPEED);
  }

  private updateAnimation(x: number, y: number) {
    const moving = x * x + y * y > 4;
    if (!moving) {
      this.anims.stop();
      this.setTexture(ANIM_KEYS[this.lastDirection]);
      this.setFrame(0);
      return;
    }

    this.lastDirection = vectorToDirection8(x, y, this.lastDirection);
    this.anims.play(ANIM_KEYS[this.lastDirection], true);
  }
}
