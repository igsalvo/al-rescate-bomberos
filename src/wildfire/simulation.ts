import { GRID_SIZE, type GridCell, type LockedScenario, type SimulationFrame, type SimulationResult, type TeamStrategy, type WindDirection } from "./types";

const windDelta: Record<WindDirection, [number, number]> = {
  N: [-1, 0],
  NE: [-1, 1],
  E: [0, 1],
  SE: [1, 1],
  S: [1, 0],
  SW: [1, -1],
  W: [0, -1],
  NW: [-1, -1]
};

const baseNeighbors: Array<[number, number]> = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const burnable = new Set<GridCell["terrain"]>(["combustible", "city", "infrastructure"]);

export function cellKey(row: number, column: number) {
  return `${row},${column}`;
}

export function parseCellKey(key: string) {
  const [row, column] = key.split(",").map(Number);
  return { row, column };
}

export function isBurnable(cell: GridCell) {
  return burnable.has(cell.terrain);
}

function terrainValue(cell: GridCell) {
  if (cell.terrain === "city") return 6;
  if (cell.terrain === "infrastructure") return 5;
  if (cell.terrain === "combustible") return 1;
  return 0;
}

function neighborKeys(key: string, wind: WindDirection) {
  const { row, column } = parseCellKey(key);
  const windBias = windDelta[wind];
  const deltas = [...baseNeighbors, windBias, windBias];
  return deltas
    .map(([dr, dc]) => [row + dr, column + dc] as const)
    .filter(([nextRow, nextColumn]) => nextRow >= 0 && nextRow < GRID_SIZE && nextColumn >= 0 && nextColumn < GRID_SIZE)
    .map(([nextRow, nextColumn]) => cellKey(nextRow, nextColumn));
}

export function chooseIgnitions(grid: GridCell[], count: number): string[] {
  const eligible = grid.filter((cell) => cell.ignitionEligible && isBurnable(cell));
  const source = eligible.length ? eligible : grid.filter(isBurnable);
  return source
    .sort((a, b) => a.coordinate.localeCompare(b.coordinate))
    .slice(0, Math.max(1, count))
    .map((cell) => cellKey(cell.row, cell.column));
}

export function runWildfireSimulation(scenario: LockedScenario, strategy: TeamStrategy): SimulationResult {
  const cellsByKey = new Map(scenario.grid.map((cell) => [cellKey(cell.row, cell.column), cell]));
  const blocked = new Set(strategy.firebreaks);
  const burned = new Set<string>();
  let burning = new Set(scenario.ignitionCells.filter((key) => !blocked.has(key)));
  const frames: SimulationFrame[] = [{ round: 0, burning: [...burning], burned: [], blocked: [...blocked] }];

  for (let round = 1; round <= scenario.rounds; round += 1) {
    const next = new Set<string>();
    burning.forEach((key) => {
      burned.add(key);
      neighborKeys(key, scenario.wind).forEach((neighborKey) => {
        const cell = cellsByKey.get(neighborKey);
        if (!cell || blocked.has(neighborKey) || burned.has(neighborKey) || burning.has(neighborKey)) return;
        if (isBurnable(cell)) next.add(neighborKey);
      });
    });
    burning = next;
    frames.push({ round, burning: [...burning], burned: [...burned], blocked: [...blocked] });
    if (burning.size === 0) break;
  }

  const totalValue = scenario.grid.reduce((sum, cell) => sum + terrainValue(cell), 0);
  const burnedValue = [...burned, ...burning].reduce((sum, key) => sum + terrainValue(cellsByKey.get(key)!), 0);
  const protectedValue = Math.max(0, totalValue - burnedValue);
  const containmentBonus = burning.size === 0 ? 140 : 0;
  const efficiencyBonus = Math.max(0, scenario.firebreakBudget - blocked.size) * 4;
  const score = Math.max(0, Math.min(1000, Math.round((protectedValue / Math.max(1, totalValue)) * 820 + containmentBonus + efficiencyBonus)));

  return {
    frames,
    score,
    burnedCells: new Set([...burned, ...burning]).size,
    protectedValue,
    totalValue,
    contained: burning.size === 0
  };
}
