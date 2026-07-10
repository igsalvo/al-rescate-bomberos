import { GRID_ROWS, GRID_SIZE, type GridCell, type NormalizedRect, type ScenarioConfig } from "./types";

export const DEFAULT_CALIBRATION: NormalizedRect = { x1: 0.095, y1: 0.095, x2: 0.905, y2: 0.905 };

export function coordinateFor(row: number, column: number) {
  return `${GRID_ROWS[row]}${column + 1}`;
}

export function createDefaultGrid(): GridCell[] {
  return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
    const row = Math.floor(index / GRID_SIZE);
    const column = index % GRID_SIZE;
    return {
      row,
      column,
      coordinate: coordinateFor(row, column),
      terrain: "combustible",
      ignitionEligible: false,
      firebreakAllowed: true
    };
  });
}

export function createDefaultScenario(): ScenarioConfig {
  return {
    grid: createDefaultGrid(),
    calibration: DEFAULT_CALIBRATION,
    gridOpacity: 0.58,
    focusCount: 2,
    firebreakBudget: 14,
    rounds: 10,
    wind: "E",
    locked: false
  };
}

export const terrainLabels: Record<GridCell["terrain"], string> = {
  combustible: "Combustible",
  road: "Camino",
  water: "Agua",
  rock: "Roca",
  city: "Ciudad",
  infrastructure: "Infraestructura"
};

export const terrainColors: Record<GridCell["terrain"], string> = {
  combustible: "#6faf5f",
  road: "#d9c38f",
  water: "#4fa8cf",
  rock: "#848b94",
  city: "#d86a4b",
  infrastructure: "#6d78bd"
};
