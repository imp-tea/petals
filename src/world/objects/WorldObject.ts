import Phaser from "phaser";
import { TILE_SIZE } from "../constants";

export interface WorldObjectConfig {
  texture: string;
  tilePosition: { x: number; y: number };
  tileSize?: { width: number; height: number };
  frame?: number;
  depth?: number;
  origin?: { x: number; y: number };
  body?: {
    size?: { width: number; height: number };
    offset?: { x: number; y: number };
    immovable?: boolean;
    static?: boolean;
    enable?: boolean;
  };
  animationKey?: string;
  animationConfig?: Omit<Phaser.Types.Animations.Animation, "key">;
}

export default class WorldObject extends Phaser.Physics.Arcade.Sprite {
  readonly tilePosition: { x: number; y: number };
  readonly tileSize: { width: number; height: number };
  readonly config: WorldObjectConfig;

  constructor(scene: Phaser.Scene, config: WorldObjectConfig) {
    const tileSize = config.tileSize ?? { width: 1, height: 1 };
    const origin = config.origin ?? { x: 0.5, y: 0.5 };
    const x = (config.tilePosition.x + tileSize.width * origin.x) * TILE_SIZE;
    const y = (config.tilePosition.y + tileSize.height * origin.y) * TILE_SIZE;

    super(scene, x, y, config.texture, config.frame);

    this.tilePosition = config.tilePosition;
    this.tileSize = tileSize;
    this.config = { ...config, tileSize, origin };

    scene.add.existing(this);
    scene.physics.add.existing(this, config.body?.static ?? false);

    this.setOrigin(origin.x, origin.y);

    if (typeof config.depth === "number") {
      this.setDepth(config.depth);
    }

    const body = this.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | undefined;
    if (body) {
      if (config.body?.size) {
        body.setSize(config.body.size.width, config.body.size.height);
      }
      if (config.body?.offset) {
        body.setOffset(config.body.offset.x, config.body.offset.y);
      }
      if (config.body?.immovable && "setImmovable" in body) {
        (body as Phaser.Physics.Arcade.Body).setImmovable(true);
      }
      if (config.body?.enable === false) {
        body.enable = false;
      }
    }

    if (config.animationKey && config.animationConfig) {
      if (!scene.anims.exists(config.animationKey)) {
        scene.anims.create({ key: config.animationKey, ...config.animationConfig });
      }
      this.play(config.animationKey);
    }
  }
}
