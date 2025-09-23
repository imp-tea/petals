import type { ColorVector, Need, Plant, SoilSignature } from "../state/GameState";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const closeness = (a: number, b: number) => clamp01(1 - Math.abs(a - b));

const vectorCloseness = (a: SoilSignature, b: SoilSignature) => {
  let total = 0;
  for (let i = 0; i < a.length; i += 1) {
    total += closeness(a[i]!, b[i]!);
  }
  return total / a.length;
};

const colorMatch = (a: ColorVector | undefined, b: ColorVector) => {
  if (!a) {
    return 0;
  }
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  const distance = Math.sqrt(dr * dr + dg * dg + db * db);
  const maxDistance = Math.sqrt(3);
  return clamp01(1 - distance / maxDistance);
};

const rangeAffinity = ([min, max]: [number, number], value: number) => {
  if (value >= min && value <= max) {
    return 1;
  }
  const delta = value < min ? min - value : value - max;
  return clamp01(1 - delta * 3);
};

export function fitScore(plant: Plant, need: Need, playerHardiness = 0.7): number {
  const t = plant.tags;

  const sunScore = closeness(t.sun, need.light);
  const moistureScore = closeness(t.moisture, need.moisture);
  const soilScore = vectorCloseness(t.soil, need.soil);

  const containerScore = need.container ? (t.container ? 1 : 0) : 1;

  let colorScore = 1;
  if (need.color) {
    const bloomScore = colorMatch(t.bloom_color, need.color);
    const fruitScore = colorMatch(t.fruit_color, need.color);
    colorScore = Math.max(bloomScore, fruitScore, 0.2);
  }

  const [sizeClass, sizeValue] = t.size;
  const [needClass, needValue] = need.size;
  const sizeAffinity = closeness(sizeValue, needValue);
  const sizeScore = sizeClass === needClass ? sizeAffinity : sizeAffinity * 0.6;

  const wildlifeScore = need.wildlife_goal.length
    ? (t.wildlife?.some(w => need.wildlife_goal.includes(w)) ? 1 : 0.25)
    : 1;

  const hardinessRange = t.hardiness;
  const hardinessNeed = rangeAffinity(hardinessRange, need.hardiness);
  const hardinessPlayer = rangeAffinity(hardinessRange, playerHardiness);
  const hardinessScore = Math.max(hardinessNeed, hardinessPlayer * 0.8);

  const weighted = sunScore * 3 + moistureScore * 3 + soilScore * 3 + containerScore * 2 + colorScore * 1 + sizeScore * 2 + wildlifeScore * 1 + hardinessScore * 3;
  const totalWeight = 18;

  return clamp01(weighted / totalWeight);
}

export interface ScoredPlant {
  plant: Plant;
  score: number;
}

export function sortByFit(plants: Plant[], need: Need, playerHardiness = 0.7): ScoredPlant[] {
  return plants
    .map(plant => ({ plant, score: fitScore(plant, need, playerHardiness) }))
    .sort((a, b) => b.score - a.score);
}
