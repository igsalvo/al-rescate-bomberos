export const scoreToStars = (score: number) => score >= 900 ? 3 : score >= 700 ? 2 : 1;
export const clampScore = (score: number) => Math.max(0, Math.min(1000, Math.round(score)));

export type FireCell = "forest" | "home" | "nature" | "fire";
export const spreadFire = (board: FireCell[][], breaks: Set<string>, steps = 3) => {
  let burning = new Set<string>();
  board.forEach((row, y) => row.forEach((cell, x) => cell === "fire" && burning.add(`${x},${y}`)));
  for (let step = 0; step < steps; step += 1) {
    const next = new Set(burning);
    burning.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
        if (board[ny]?.[nx] && !breaks.has(`${nx},${ny}`)) next.add(`${nx},${ny}`);
      });
    });
    burning = next;
  }
  return burning;
};

export const fireSpreadFrames = (board: FireCell[][], breaks: Set<string>, steps = 5) => {
  let burning = new Set<string>();
  board.forEach((row, y) => row.forEach((cell, x) => cell === "fire" && burning.add(`${x},${y}`)));
  const frames = [new Set(burning)];
  for (let step = 0; step < steps; step += 1) {
    const next = new Set(burning);
    burning.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
        if (board[ny]?.[nx] && !breaks.has(`${nx},${ny}`)) next.add(`${nx},${ny}`);
      });
    });
    if (next.size === burning.size) break;
    burning = next;
    frames.push(new Set(burning));
  }
  return frames;
};

export const energyTotal = (services: Array<{ consumption: number; active: boolean }>) =>
  services.reduce((sum, service) => sum + (service.active ? service.consumption : 0), 0);

export const championProbabilities = (teams: Array<{ attack: number; defense: number; form: number }>) => {
  const weights = teams.map((team) => team.attack * .4 + team.defense * .35 + team.form * .25);
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map((value) => Math.round(value / total * 100));
};

export const hospitalImpact = (hospital: { waiting: number; beds: number; staff: number }) =>
  Math.min(hospital.waiting, hospital.beds + 4, Math.floor(hospital.staff * 1.5));

export const optimalKnapsack = (items: Array<{ weight: number; utility: number }>, capacity: number) => {
  const table = Array.from({ length: capacity + 1 }, () => 0);
  items.forEach((item) => {
    for (let weight = capacity; weight >= item.weight; weight -= 1) {
      table[weight] = Math.max(table[weight], table[weight - item.weight] + item.utility);
    }
  });
  return table[capacity];
};
