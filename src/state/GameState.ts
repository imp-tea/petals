import Phaser from "phaser";

export type SoilSignature = [number, number, number];
export type ColorVector = [number, number, number];
export type SizedClassification = [string, number];

export interface Plant {
  id: string;
  name: string;
  tags: {
    sun: number; // 0..1 (0 = deep shade, 1 = full sun)
    moisture: number; // 0..1 (0 = arid, 1 = saturated)
    soil: SoilSignature; // [drainage, pH, nutrients]
    size: SizedClassification; // [classification, relative scale]
    hardiness: [number, number]; // normalized 0..1
    container: boolean;
    bloom_color?: ColorVector;
    fruit_color?: ColorVector;
    bloom_season?: string[];
    wildlife?: string[];
  };
  base_cost: number;
  msrp: number;
  display_appeal: number;
}

export interface Need {
  light: number;
  moisture: number;
  soil: SoilSignature;
  container: boolean;
  color?: ColorVector;
  size: SizedClassification;
  hardiness: number;
  wildlife_goal: string[];
}

export interface SaleEvent {
  plantId: string;
  price: number;
  success: boolean;
  fitScore: number;
}

const DEFAULT_PLAYER_HARDINESS = 0.7; // roughly USDA zone 8 when normalized

export class GameState {
  private cash = 0;
  private readonly log: string[] = [];
  private readonly rng: Phaser.Math.RandomDataGenerator;
  readonly playerHardiness: number;
  private readonly dialogueBonus = 0.05;
  private readonly maxLogLines = 6;

  constructor(seed: string = Date.now().toString(), playerHardiness = DEFAULT_PLAYER_HARDINESS) {
    this.rng = new Phaser.Math.RandomDataGenerator([seed]);
    this.playerHardiness = Phaser.Math.Clamp(playerHardiness, 0, 1);
  }

  getCash(): number {
    return this.cash;
  }

  getLog(): readonly string[] {
    return this.log;
  }

  attemptSale(plant: Plant, fitScore: number, price = plant.msrp): SaleEvent {
    const base = 0.25;
    const mult = 0.6;
    const markup = Math.max(0, plant.msrp - plant.base_cost);
    const priceSensitivity = Math.min(0.45, plant.msrp / 110 + markup / 40);

    let saleChance = base + fitScore * mult + this.dialogueBonus - priceSensitivity;
    saleChance = Phaser.Math.Clamp(saleChance, 0, 1);

    const roll = this.rng.frac();
    const success = roll < saleChance;

    if (success) {
      this.cash += price;
      this.pushLog(`Sold ${plant.name} for $${price.toFixed(2)} (fit ${(fitScore * 100).toFixed(0)}%)`);
    } else {
      this.pushLog(`Missed: ${plant.name} (fit ${(fitScore * 100).toFixed(0)}%)`);
    }

    return {
      plantId: plant.id,
      price,
      success,
      fitScore
    };
  }

  private pushLog(entry: string) {
    this.log.push(entry);
    while (this.log.length > this.maxLogLines) {
      this.log.shift();
    }
  }
}
