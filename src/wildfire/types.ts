export const GRID_SIZE = 20;
export const GRID_ROWS = "ABCDEFGHIJKLMNOPQRST".split("");

export type TerrainType = "combustible" | "road" | "water" | "rock" | "city" | "infrastructure";
export type WindDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type FireStatus = "safe" | "burning" | "burned" | "blocked";

export interface GridCell {
  row: number;
  column: number;
  coordinate: string;
  terrain: TerrainType;
  ignitionEligible: boolean;
  firebreakAllowed: boolean;
}

export interface NormalizedRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ScenarioConfig {
  grid: GridCell[];
  mapImage?: string;
  calibration: NormalizedRect;
  gridOpacity: number;
  focusCount: number;
  firebreakBudget: number;
  rounds: number;
  wind: WindDirection;
  locked: boolean;
}

export interface LockedScenario extends ScenarioConfig {
  ignitionCells: string[];
  lockedAt: string;
}

export interface TeamStrategy {
  firebreaks: string[];
  justification: string;
  locked: boolean;
}

export interface SimulationFrame {
  round: number;
  burning: string[];
  burned: string[];
  blocked: string[];
}

export interface SimulationResult {
  frames: SimulationFrame[];
  score: number;
  burnedCells: number;
  protectedValue: number;
  totalValue: number;
  contained: boolean;
}

export type AdminTool =
  | TerrainType
  | "ignition"
  | "erase"
  | "multi"
  | "rectangle";
