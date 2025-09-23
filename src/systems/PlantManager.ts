import plantsData from "../data/plants.json";
import type { Need, Plant } from "../state/GameState";
import { sortByFit } from "./match";
import type { ScoredPlant } from "./match";

interface PlantDataset {
  plants: Plant[];
}

export interface PlantSuggestion extends ScoredPlant {
  stock: number;
}

export class PlantManager {
  private readonly plants: Plant[];
  private readonly stock: Map<string, number>;

  constructor(initialStock = 1) {
    this.plants = (plantsData as PlantDataset).plants;
    this.stock = new Map(this.plants.map(plant => [plant.id, initialStock]));
  }

  getTopMatches(need: Need, limit = 3, playerHardiness = 0.7): PlantSuggestion[] {
    const ranked = sortByFit(this.plants, need, playerHardiness);
    return ranked.slice(0, limit).map(entry => ({ ...entry, stock: this.getStock(entry.plant.id) }));
  }

  getPlantById(id: string): Plant | undefined {
    return this.plants.find(plant => plant.id === id);
  }

  getStock(id: string): number {
    return this.stock.get(id) ?? 0;
  }

  consume(id: string): boolean {
    const remaining = this.getStock(id);
    if (remaining <= 0) {
      return false;
    }
    this.stock.set(id, remaining - 1);
    return true;
  }
}
