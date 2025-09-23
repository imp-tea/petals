import data from "../data/plants.json";
import type { Need, Plant } from "../state/GameState";
import { fitScore, sortByFit } from "./match";

describe("fitScore", () => {
  const plants = (data as { plants: Plant[] }).plants;
  const beautyberry = plants.find(p => p.id === "callicarpa_americana");
  const coneflower = plants.find(p => p.id === "echinacea_purpurea");
  const pitcher = plants.find(p => p.id === "sarracenia_leucophylla");

  const need: Need = {
    light: 0.6,
    moisture: 0.55,
    soil: [0.55, 0.45, 0.6],
    container: true,
    color: [0.6, 0.25, 0.7],
    size: ["shrub", 0.4],
    hardiness: 0.7,
    wildlife_goal: ["pollinators"]
  };

  it("returns a higher score for a closely matched plant", () => {
    expect(beautyberry).toBeDefined();
    expect(coneflower).toBeDefined();

    const beautyberryScore = fitScore(beautyberry!, need, 0.7);
    const coneflowerScore = fitScore(coneflower!, need, 0.7);

    expect(beautyberryScore).toBeGreaterThan(coneflowerScore);
    expect(beautyberryScore).toBeGreaterThan(0.55);
  });

  it("penalizes hardiness mismatches", () => {
    expect(pitcher).toBeDefined();
    const strongMatch = fitScore(pitcher!, { ...need, hardiness: 0.75 }, 0.8);
    const weakMatch = fitScore(pitcher!, { ...need, hardiness: 0.3 }, 0.3);
    expect(strongMatch).toBeGreaterThan(weakMatch);
  });

  it("orders plants by fit when sorting", () => {
    const ranked = sortByFit(plants, need, 0.7);
    expect(ranked[0]?.plant.id).toBe("callicarpa_americana");
    expect(ranked[0]?.score).toBeGreaterThanOrEqual(ranked[1]?.score ?? 0);
  });
});
