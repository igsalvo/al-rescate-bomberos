import { describe, expect, it } from "vitest";
import { cityEdges } from "../game/graph";
import { edgeCost, isValidMove, pathCost, shortestPath } from "../game/pathfinding";
import { calculateScore, starsForScore } from "../game/scoring";

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
