import Phaser from "phaser";
import Customer from "../actors/Customer";
import Player from "../actors/Player";
import AdvicePanel, { type OfferResult } from "../ui/AdvicePanel";
import type { Need, Plant } from "../state/GameState";
import { GameState } from "../state/GameState";
import { PlantManager } from "../systems/PlantManager";

const TILE = 32;

const CUSTOMER_NEED: Need = {
  light: 0.6,
  moisture: 0.55,
  soil: [0.55, 0.45, 0.6],
  container: true,
  color: [0.6, 0.25, 0.7],
  size: ["shrub", 0.4],
  hardiness: 0.72,
  wildlife_goal: ["pollinators"]
};

export default class MainScene extends Phaser.Scene {
  private player!: Player;
  private customer!: Customer;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private interactPrompt?: Phaser.GameObjects.Text;
  private cashText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private advicePanel!: AdvicePanel;
  private plantManager!: PlantManager;
  private gameState!: GameState;

  constructor() {
    super("MainScene");
  }

  create() {
    this.gameState = new GameState();
    this.plantManager = new PlantManager();
    this.advicePanel = new AdvicePanel();

    this.createTextures();
    this.createRoom();
    this.createActors();
    this.createHud();

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(time: number) {
    if (!this.advicePanel.isOpen) {
      this.player.releaseMovement();
    }

    this.player.update();
    this.customer.update(time);

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.customer.x, this.customer.y);
    const canInteract = distance < 36;
    this.interactPrompt?.setVisible(canInteract && !this.advicePanel.isOpen);

    if (canInteract && Phaser.Input.Keyboard.JustDown(this.interactKey) && !this.advicePanel.isOpen) {
      this.openAdvice();
    }
  }

  private createTextures() {
    this.createTexture("tile-floor", 0x162044);
    this.createTexture("tile-wall", 0x1f2937);
  }

  private createTexture(key: string, color: number, size = TILE) {
    if (this.textures.exists(key)) {
      return;
    }
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 1);
    gfx.fillRect(0, 0, size, size);
    gfx.generateTexture(key, size, size);
    gfx.destroy();
  }

  private createRoom() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.tileSprite(width / 2, height / 2, width, height, "tile-floor");

    this.walls = this.physics.add.staticGroup();

    for (let x = TILE / 2; x < width; x += TILE) {
      this.walls.create(x, TILE / 2, "tile-wall");
      this.walls.create(x, height - TILE / 2, "tile-wall");
    }

    for (let y = TILE + TILE / 2; y < height - TILE; y += TILE) {
      this.walls.create(TILE / 2, y, "tile-wall");
      this.walls.create(width - TILE / 2, y, "tile-wall");
    }

    const shelfY = height / 2;
    for (let x = TILE * 3 + TILE / 2; x <= width - TILE * 3; x += TILE) {
      this.walls.create(x, shelfY, "tile-wall");
    }
  }

  private createActors() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.player = new Player(this, width / 2 - 40, height / 2 + 30);
    this.customer = new Customer(
      this,
      width / 2 + 50,
      height / 2,
      CUSTOMER_NEED,
      new Phaser.Geom.Rectangle(TILE * 2, TILE * 2, width - TILE * 4, height - TILE * 4)
    );

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.customer, this.walls);
    this.physics.add.collider(this.player, this.customer);
  }

  private createHud() {
    this.cashText = this.add.text(12, 10, "Cash: $0.00", {
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "12px",
      color: "#f8fafc"
    }).setOrigin(0, 0);

    this.logText = this.add.text(12, 26, "", {
      fontFamily: "Consolas, monospace",
      fontSize: "10px",
      color: "#94a3b8",
      lineSpacing: 4
    }).setOrigin(0, 0);

    this.interactPrompt = this.add.text(this.scale.width / 2, this.scale.height - 24, "Press E to help", {
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "11px",
      color: "#facc15",
      align: "center"
    }).setOrigin(0.5);

    this.updateHud();
    this.updateLog();
    this.interactPrompt.setVisible(false);
  }

  private openAdvice() {
    this.player.freezeMovement();
    const suggestions = this.plantManager.getTopMatches(
      CUSTOMER_NEED,
      3,
      this.gameState.playerHardiness
    );

    this.advicePanel.open(CUSTOMER_NEED, suggestions, (plant, fitScore) => this.handleOffer(plant, fitScore));
  }

  private handleOffer(plant: Plant, fitScore: number): OfferResult {
    const event = this.gameState.attemptSale(plant, fitScore);
    if (event.success) {
      this.plantManager.consume(plant.id);
    }
    const remainingStock = this.plantManager.getStock(plant.id);
    this.updateHud();
    this.updateLog();
    return { event, remainingStock };
  }

  private updateHud() {
    this.cashText.setText(`Cash: $${this.gameState.getCash().toFixed(2)}`);
  }

  private updateLog() {
    const entries = this.gameState.getLog();
    const logLines = ["Log:", ...(entries.length ? entries : ["No sales yet. Talk to the customer!"])];
    this.logText.setText(logLines);
  }
}
