import { describe, expect, it } from "vitest";
import { cityEdges } from "../game/graph";
import { edgeCost, isValidMove, pathCost, shortestPath } from "../game/pathfinding";
import { calculateScore, starsForScore } from "../game/scoring";
import { games } from "../config/games";
import { gameInstructions } from "../config/instructions";
import { housingExamples, housingRounds } from "../config/housing";
import { championProbabilities, energyTotal, fireSpreadFrames, hospitalImpact, optimalKnapsack, scoreToStars, spreadFire } from "../game/common";
import { createDefaultGrid, createDefaultScenario } from "../wildfire/config";
import { chooseIgnitions, runWildfireSimulation } from "../wildfire/simulation";
import type { LockedScenario, TeamStrategy } from "../wildfire/types";

describe("calculo de tiempos", () => {
  it("aplica penalizaciones por trafico y trabajos", () => {
    const traffic = cityEdges.find((edge) => edge.id === "b-c")!;
    const works = cityEdges.find((edge) => edge.id === "d-i")!;
    expect(edgeCost(traffic)).toBe(8);
    expect(edgeCost(works)).toBe(8);
  });

  it("aumenta el tiempo con lluvia", () => {
    const normal = cityEdges.find((edge) => edge.id === "a-b")!;
    expect(edgeCost(normal, "rain")).toBe(5.2);
  });
});

describe("plataforma de juegos", () => {
  it("define diez rutas únicas y habilitadas en el catálogo", () => {
    expect(games).toHaveLength(10);
    expect(new Set(games.map((game) => game.slug)).size).toBe(10);
    expect(games.every((game) => game.enabled)).toBe(true);
  });

  it("incluye instrucciones configurables para todos los juegos", () => {
    expect(games.every((game) => gameInstructions[game.id]?.steps.length >= 3)).toBe(true);
  });

  it("vincula las investigaciones de F1 e incendios", () => {
    expect(games.find((game) => game.id === "formula-1")?.researchUrl).toContain("isci.cl");
    expect(games.find((game) => game.id === "incendio")?.researchUrl).toContain("dii.uchile.cl");
  });

  it("prepara tres ejemplos y cinco rondas de viviendas", () => {
    expect(housingExamples).toHaveLength(3);
    expect(housingRounds).toHaveLength(5);
    expect(housingRounds.every((house) => house.factors.length >= 3)).toBe(true);
  });

  it("aplica la escala común de estrellas", () => {
    expect(scoreToStars(900)).toBe(3);
    expect(scoreToStars(700)).toBe(2);
    expect(scoreToStars(699)).toBe(1);
  });

  it("bloquea la propagación en un cortafuego", () => {
    const burned = spreadFire([["fire", "forest", "home"]], new Set(["1,0"]), 3);
    expect(burned.has("2,0")).toBe(false);
  });

  it("genera fotogramas progresivos para animar el incendio", () => {
    const frames = fireSpreadFrames([["fire", "forest", "forest", "home"]], new Set(), 4);
    expect(frames.map((frame) => frame.size)).toEqual([1, 2, 3, 4]);
  });

  it("calcula consumo energético activo", () => {
    expect(energyTotal([{ consumption: 30, active: true }, { consumption: 20, active: false }])).toBe(30);
  });

  it("normaliza probabilidades de campeonato", () => {
    const probabilities = championProbabilities([{ attack: 90, defense: 80, form: 70 }, { attack: 70, defense: 80, form: 90 }]);
    expect(probabilities.reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it("resuelve la utilidad del problema de mochila", () => {
    expect(optimalKnapsack([{ weight: 3, utility: 5 }, { weight: 4, utility: 8 }, { weight: 2, utility: 3 }], 6)).toBe(11);
  });

  it("combina demanda y capacidad hospitalaria", () => {
    expect(hospitalImpact({ waiting: 40, beds: 2, staff: 4 })).toBe(6);
  });
});

describe("restricciones de calles", () => {
  it("detecta calles cerradas", () => {
    expect(pathCost(["h", "m"])).toBe(Number.POSITIVE_INFINITY);
  });

  it("respeta calles en un solo sentido", () => {
    expect(isValidMove("c", "h")).toBe(true);
    expect(isValidMove("h", "c")).toBe(false);
  });
});

describe("ruta optima", () => {
  it("encuentra una ruta disponible con Dijkstra", () => {
    const result = shortestPath("a", "n");
    expect(result.nodes[0]).toBe("a");
    expect(result.nodes[result.nodes.length - 1]).toBe("n");
    expect(result.time).toBeGreaterThan(0);
    expect(result.nodes.join("-")).not.toContain("h-m");
  });
});

describe("motor del simulador de incendios forestales", () => {
  it("elige focos solo desde celdas elegibles cuando existen", () => {
    const grid = createDefaultGrid().map((cell) => cell.coordinate === "A1" || cell.coordinate === "B2" ? { ...cell, ignitionEligible: true } : cell);
    expect(chooseIgnitions(grid, 2)).toEqual(["0,0", "1,1"]);
  });

  it("propaga el fuego por rondas y respeta cortafuegos", () => {
    const scenario: LockedScenario = { ...createDefaultScenario(), ignitionCells: ["0,0"], locked: true, lockedAt: "2026-07-01T00:00:00.000Z", rounds: 4, wind: "E" };
    const strategy: TeamStrategy = { firebreaks: ["0,1"], justification: "Bloquear avance principal con viento este.", locked: true };
    const result = runWildfireSimulation(scenario, strategy);
    const lastFrame = result.frames[result.frames.length - 1];
    const affected = new Set([...lastFrame.burned, ...lastFrame.burning]);
    expect(affected.has("0,1")).toBe(false);
    expect(result.frames.length).toBeGreaterThan(1);
  });

  it("prioriza valor protegido de ciudad e infraestructura en el puntaje", () => {
    const grid = createDefaultGrid().map((cell) => cell.coordinate === "A2" ? { ...cell, terrain: "city" as const } : cell);
    const scenario: LockedScenario = { ...createDefaultScenario(), grid, ignitionCells: ["0,0"], locked: true, lockedAt: "2026-07-01T00:00:00.000Z", rounds: 1, wind: "E" };
    const open = runWildfireSimulation(scenario, { firebreaks: [], justification: "", locked: true });
    const protectedRun = runWildfireSimulation(scenario, { firebreaks: ["0,1"], justification: "", locked: true });
    expect(protectedRun.score).toBeGreaterThan(open.score);
  });
});

describe("puntaje", () => {
  it("calcula puntaje relativo y estrellas", () => {
    expect(calculateScore(20, 18)).toBe(900);
    expect(starsForScore(900)).toBe(3);
    expect(starsForScore(800)).toBe(2);
    expect(starsForScore(500)).toBe(1);
  });
});

describe("reinicio conceptual de niveles", () => {
  it("un camino inicial vuelve a contener solo el nodo de salida", () => {
    const startNode = "a";
    const path = [startNode, "b", "c"];
    const resetPath = [path[0]];
    expect(resetPath).toEqual(["a"]);
  });
});
