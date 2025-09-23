export type Direction8 =
  | "right"
  | "down_right"
  | "down"
  | "down_left"
  | "left"
  | "up_left"
  | "up"
  | "up_right";

export const DIRECTIONS_8: Direction8[] = [
  "right",
  "down_right",
  "down",
  "down_left",
  "left",
  "up_left",
  "up",
  "up_right"
];

export function vectorToDirection8(x: number, y: number, fallback: Direction8): Direction8 {
  const threshold = 0.01;
  if (Math.abs(x) < threshold && Math.abs(y) < threshold) {
    return fallback;
  }

  const rad = Math.atan2(y, x);
  const deg = (rad * 180) / Math.PI;
  const normalized = (deg + 360) % 360;
  const index = Math.round(normalized / 45) % DIRECTIONS_8.length;
  return DIRECTIONS_8[index]!;
}
