import { cityEdges } from "./graph";
import type { ObstacleType, StreetEdge } from "./types";

export function edgeCost(edge: StreetEdge, weather: "clear" | "rain" = "clear"): number {
  if (edge.closed || edge.obstacles?.includes("closed")) return Number.POSITIVE_INFINITY;
  let cost = edge.baseTime;
  if (edge.obstacles?.includes("traffic")) cost += 5;
  if (edge.obstacles?.includes("works")) cost += 4;
  if (edge.obstacles?.includes("otherEmergency")) cost += 3;
  if (weather === "rain") cost *= 1.3;
  return Math.round(cost * 10) / 10;
}

export function findEdgeBetween(from: string, to: string): StreetEdge | undefined {
  return cityEdges.find(
    (edge) => (edge.from === from && edge.to === to) || (edge.bidirectional && edge.from === to && edge.to === from)
  );
}

export function isValidMove(from: string, to: string): boolean {
  const edge = findEdgeBetween(from, to);
  if (!edge || edge.closed) return false;
  return edge.from === from || edge.bidirectional;
}

export function edgeIdsToNodePath(edgeIds: string[], startNode: string): string[] {
  const path = [startNode];
  let current = startNode;
  for (const edgeId of edgeIds) {
    const edge = cityEdges.find((item) => item.id === edgeId);
    if (!edge) continue;
    if (edge.from === current) current = edge.to;
    else if (edge.bidirectional && edge.to === current) current = edge.from;
    else current = edge.to;
    path.push(current);
  }
  return path;
}

export function pathCost(nodes: string[], weather: "clear" | "rain" = "clear"): number {
  let total = 0;
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const edge = findEdgeBetween(nodes[index], nodes[index + 1]);
    if (!edge || !isValidMove(nodes[index], nodes[index + 1])) return Number.POSITIVE_INFINITY;
    total += edgeCost(edge, weather);
  }
  return Math.round(total * 10) / 10;
}

export function collectObstacles(nodes: string[], weather: "clear" | "rain" = "clear"): ObstacleType[] {
  const values = new Set<ObstacleType>();
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const edge = findEdgeBetween(nodes[index], nodes[index + 1]);
    edge?.obstacles?.forEach((obstacle) => values.add(obstacle));
  }
  if (weather === "rain") values.add("rain");
  return [...values];
}

export function shortestPath(start: string, target: string, weather: "clear" | "rain" = "clear") {
  const nodes = new Set<string>();
  cityEdges.forEach((edge) => {
    nodes.add(edge.from);
    nodes.add(edge.to);
  });

  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const unvisited = new Set(nodes);
  nodes.forEach((node) => distances.set(node, Number.POSITIVE_INFINITY));
  distances.set(start, 0);

  while (unvisited.size > 0) {
    const current = [...unvisited].sort((a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity))[0];
    if (!current || current === target) break;
    unvisited.delete(current);

    for (const edge of cityEdges) {
      const neighbors: string[] = [];
      if (edge.from === current) neighbors.push(edge.to);
      if (edge.bidirectional && edge.to === current) neighbors.push(edge.from);
      if (edge.closed) continue;

      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor)) continue;
        const nextDistance = (distances.get(current) ?? Infinity) + edgeCost(edge, weather);
        if (nextDistance < (distances.get(neighbor) ?? Infinity)) {
          distances.set(neighbor, nextDistance);
          previous.set(neighbor, current);
        }
      }
    }
  }

  if (!Number.isFinite(distances.get(target) ?? Infinity)) {
    return { nodes: [], time: Number.POSITIVE_INFINITY };
  }

  const path = [target];
  let cursor = target;
  while (cursor !== start) {
    const before = previous.get(cursor);
    if (!before) break;
    path.unshift(before);
    cursor = before;
  }

  return { nodes: path, time: Math.round((distances.get(target) ?? 0) * 10) / 10 };
}
