import { cityEdges } from "./graph";
import { collectObstacles, findEdgeBetween, pathCost, shortestPath } from "./pathfinding";
import type { FireTruck, LevelConfig, ScoreBreakdown, TripEvent } from "./types";

export function calculateScore(playerTime: number, optimalTime: number): number {
  if (!Number.isFinite(playerTime) || playerTime <= 0) return 0;
  return Math.max(0, Math.min(1000, Math.round(1000 * optimalTime / playerTime)));
}

export function starsForScore(score: number): number {
  if (score >= 900) return 3;
  if (score >= 750) return 2;
  return 1;
}

export function starsForHundredScore(score: number): number {
  if (score >= 85) return 3;
  if (score >= 65) return 2;
  return 1;
}

export function gradeForScore(score: number): string {
  if (score >= 90) return "Despacho excelente";
  if (score >= 75) return "Buena respuesta";
  if (score >= 60) return "Respuesta aceptable";
  return "Necesita ajustes";
}

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function edgeKinds(path: string[]) {
  const kinds: string[] = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = findEdgeBetween(path[index], path[index + 1]);
    if (edge) kinds.push(edge.kind);
  }
  return kinds;
}

function routeSafety(path: string[], level: LevelConfig, event?: TripEvent) {
  const obstacles = collectObstacles(path, level.weather);
  let score = 10;
  if (obstacles.includes("closed")) score -= 5;
  if (obstacles.includes("traffic")) score -= 2;
  if (obstacles.includes("works")) score -= 2;
  if (obstacles.includes("oneway")) score -= 1;
  if (obstacles.includes("rain")) score -= 1;
  if (event) score += event.safetyModifier;
  return clamp(score, 10);
}

export function calculateDispatchScore({
  level,
  truck,
  path,
  preparationTime,
  travelTime,
  event
}: {
  level: LevelConfig;
  truck: FireTruck;
  path: string[];
  preparationTime: number;
  travelTime: number;
  event?: TripEvent;
}): { score: number; breakdown: ScoreBreakdown; bestPath: string[]; bestTime: number; strengths: string[]; improvements: string[]; bestCombination: string } {
  const bestPath = shortestPath(level.startNodeByStation[truck.stationId], level.targetNode, level.weather);
  const bestTime = Math.round((bestPath.time + truck.preparationTime) * 10) / 10;
  const baseRouteTime = pathCost(path, level.weather);
  const bestRouteTime = bestPath.time;
  const recommended = level.recommendedTruckTypes ?? [];
  const truckMatch = recommended.includes(truck.type);
  const kinds = edgeKinds(path);
  const compatibleEdges = kinds.filter((kind) => truck.roadCompatibility.includes(kind as never)).length;
  const roadCompatibility = kinds.length ? compatibleEdges / kinds.length : 0;
  const obstacles = collectObstacles(path, level.weather);
  const totalTime = preparationTime + travelTime;
  const idealTotal = bestRouteTime + Math.min(...[truck.preparationTime]);
  const safety = routeSafety(path, level, event);

  const breakdown: ScoreBreakdown = {
    truck: clamp((truckMatch ? 23 : 10) + roadCompatibility * 7, 30),
    route: clamp((bestRouteTime / Math.max(baseRouteTime, 1)) * 24 + roadCompatibility * 4 + (obstacles.includes("closed") ? -8 : 2), 30),
    speed: clamp((Math.max(idealTotal, 1) / Math.max(totalTime, 1)) * 20, 20),
    safety,
    resources: clamp(10 - Math.max(0, truck.resourceLevel - (level.priority === "Crítica" ? 9 : level.priority === "Alta" ? 7 : 5)), 10)
  };
  const score = clamp(breakdown.truck + breakdown.route + breakdown.speed + breakdown.safety + breakdown.resources, 100);
  const strengths = [
    truckMatch ? "El carro seleccionado era compatible con la emergencia." : "",
    roadCompatibility >= 0.8 ? "El vehículo se adaptó bien al tipo de camino." : "",
    breakdown.route >= 24 ? "La ruta elegida evitó retrasos importantes." : "",
    breakdown.safety >= 8 ? "El recorrido mantuvo un buen nivel de seguridad." : ""
  ].filter(Boolean);
  const improvements = [
    !truckMatch ? "Un carro más especializado habría atendido mejor la emergencia." : "",
    roadCompatibility < 0.8 ? "El vehículo elegido tuvo dificultades con algunos tramos." : "",
    breakdown.route < 22 ? "Otra ruta reducía obstáculos o tiempo de desplazamiento." : "",
    preparationTime > 3 ? "El tiempo de preparación aumentó la respuesta total." : ""
  ].filter(Boolean);
  const bestRouteName = level.routeOptions?.find((route) => {
    const routePath = route.edgeIds
      .map((edgeId) => cityEdges.find((edge) => edge.id === edgeId))
      .filter(Boolean);
    return routePath.some((edge) => edge && bestPath.nodes.includes(edge.from) && bestPath.nodes.includes(edge.to));
  })?.name ?? "ruta más estable";
  return {
    score,
    breakdown,
    bestPath: bestPath.nodes,
    bestTime,
    strengths: strengths.length ? strengths : ["Completaste el despacho y llegaste al destino."],
    improvements: improvements.length ? improvements : ["La decisión estuvo muy cerca de la mejor alternativa."],
    bestCombination: `${truck.name} por ${bestRouteName}`
  };
}
