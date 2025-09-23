import Phaser from "phaser";
import MainScene from "./scenes/MainScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 640,
  height: 512,
  parent: "app",
  backgroundColor: "#0b1320",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: window.devicePixelRatio || 1
  },
  pixelArt: false,
  dom: {
    createContainer: true
  },
  render: {
    antialias: true,
    roundPixels: true
  },
  scene: [MainScene]
};

export const game = new Phaser.Game(config);
