import Phaser from "phaser";
import { DIRECTIONS_8, type Direction8, vectorToDirection8 } from "./direction";

const SPEED = 160;

const ANIM_KEYS: Record<Direction8, string> = {
  right: "player-walk-right",
  down_right: "player-walk-down-right",
  down: "player-walk-down",
  down_left: "player-walk-down-left",
  left: "player-walk-left",
  up_left: "player-walk-up-left",
  up: "player-walk-up",
  up_right: "player-walk-up-right"
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
  private lastDirection: Direction8 = "down";

  static registerAnimations(scene: Phaser.Scene) {
    if (scene.anims.exists(ANIM_KEYS.down)) {
      return;
    }

    DIRECTIONS_8.forEach(direction => {
      scene.anims.create({
        key: ANIM_KEYS[direction],
        frames: scene.anims.generateFrameNumbers(ANIM_KEYS[direction], { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    });
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ANIM_KEYS.down, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(5);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(36, 48);
    body.setOffset(14, 12);

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input plugin not available");
    }

    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }

  update() {
    if (!this.active) {
      this.setVelocity(0, 0);
      return;
    }

    const velocity = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left?.isDown || this.wasd.a.isDown) {
      velocity.x -= 1;
    }
    if (this.cursors.right?.isDown || this.wasd.d.isDown) {
      velocity.x += 1;
    }
    if (this.cursors.up?.isDown || this.wasd.w.isDown) {
      velocity.y -= 1;
    }
    if (this.cursors.down?.isDown || this.wasd.s.isDown) {
      velocity.y += 1;
    }

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(SPEED);
      this.lastDirection = vectorToDirection8(velocity.x, velocity.y, this.lastDirection);
      this.anims.play(ANIM_KEYS[this.lastDirection], true);
    } else {
      this.anims.stop();
      this.setTexture(ANIM_KEYS[this.lastDirection]);
      this.setFrame(0);
    }

    this.setVelocity(velocity.x, velocity.y);
  }

  freezeMovement() {
    this.setVelocity(0, 0);
    this.anims.stop();
    this.setFrame(0);
    this.setActive(false);
  }

  releaseMovement() {
    this.setActive(true);
  }
}
