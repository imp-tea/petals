import Phaser from "phaser";

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

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
  private readonly speed = 110;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    ensureTexture(scene, "player", 0x4caf50);
    super(scene, x, y, "player");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(16, 16);
    this.setOffset(0, 0);

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
      velocity.normalize().scale(this.speed);
    }

    this.setVelocity(velocity.x, velocity.y);
  }

  freezeMovement() {
    this.setVelocity(0, 0);
    this.setActive(false);
  }

  releaseMovement() {
    this.setActive(true);
  }
}
