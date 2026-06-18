import { useMemo, useState } from "react";
import { levels, stations, trucks } from "../game/levels";
import { calculateScore, starsForScore } from "../game/scoring";
import { collectObstacles, edgeIdsToNodePath, pathCost, shortestPath } from "../game/pathfinding";
import type { Difficulty, GameMode, GameScreen, LevelConfig, LevelResultData } from "../game/types";

export function useGameState() {
  const [screen, setScreen] = useState<GameScreen>("start");
  const [mode, setMode] = useState<GameMode>("individual");
  const [teamName, setTeamName] = useState("");
  const [completeRun, setCompleteRun] = useState(true);
  const [levelIndex, setLevelIndex] = useState(0);
  const [results, setResults] = useState<LevelResultData[]>([]);

  const level = levels[levelIndex];

  const resetAll = () => {
    setScreen("start");
    setLevelIndex(0);
    setResults([]);
    setCompleteRun(true);
  };

  const startComplete = () => {
    setCompleteRun(true);
    setLevelIndex(0);
    setResults([]);
    setScreen("playing");
  };

  const chooseDifficulty = (difficulty: Difficulty) => {
    const index = levels.findIndex((item) => item.id === difficulty);
    setCompleteRun(false);
    setLevelIndex(index);
    setResults([]);
    setScreen("playing");
  };

  const finishLevel = (params: {
    level: LevelConfig;
    stationId: string;
    truckId: string;
    routeName: string;
    path: string[];
    decisionTime: number;
  }) => {
    const station = stations.find((item) => item.id === params.stationId)!;
    const truck = trucks.find((item) => item.id === params.truckId)!;
    const routeTime = pathCost(params.path, params.level.weather);
    const playerTime = Math.round((routeTime + truck.preparationTime) * 10) / 10;
    const best = shortestPath(params.level.startNodeByStation[params.stationId], params.level.targetNode, params.level.weather);
    const optimalTime = Math.round((best.time + truck.preparationTime) * 10) / 10;
    const score = calculateScore(playerTime, optimalTime);
    const obstacles = collectObstacles(params.path, params.level.weather);
    const gap = Math.max(0, Math.round((playerTime - optimalTime) * 10) / 10);
    const explanation =
      gap <= 1
        ? "Tu decisión fue muy cercana a la mejor alternativa disponible."
        : obstacles.includes("traffic")
          ? `El tráfico aumentó el tiempo. Una mejor ruta ahorraba ${gap} segundos.`
          : obstacles.includes("closed")
            ? "La calle cerrada obliga a buscar un desvío disponible."
            : obstacles.includes("rain")
              ? `La lluvia aumentó el tiempo de viaje. Una mejor ruta ahorraba ${gap} segundos.`
              : `Una mejor ruta permitía ahorrar ${gap} segundos.`;

    const result: LevelResultData = {
      levelId: params.level.id,
      levelTitle: params.level.title,
      companyName: station.name,
      truckName: truck.name,
      routeName: params.routeName,
      playerTime,
      optimalTime,
      decisionTime: Math.round(params.decisionTime),
      score,
      stars: starsForScore(score),
      obstacles,
      explanation,
      playerPath: params.path,
      optimalPath: best.nodes
    };
    setResults((current) => [...current, result]);
    setScreen("levelResult");
  };

  const nextLevel = () => {
    if (!completeRun || levelIndex >= levels.length - 1) {
      setScreen("finalResult");
      return;
    }
    setLevelIndex((current) => current + 1);
    setScreen("playing");
  };

  const retryLevel = () => {
    setResults((current) => current.filter((result) => result.levelId !== level.id));
    setScreen("playing");
  };

  const latestResult = results[results.length - 1];
  const totals = useMemo(
    () => ({
      score: results.reduce((sum, result) => sum + result.score, 0),
      stars: results.reduce((sum, result) => sum + result.stars, 0),
      playerTime: Math.round(results.reduce((sum, result) => sum + result.playerTime, 0) * 10) / 10,
      optimalTime: Math.round(results.reduce((sum, result) => sum + result.optimalTime, 0) * 10) / 10
    }),
    [results]
  );

  return {
    screen,
    setScreen,
    mode,
    setMode,
    teamName,
    setTeamName,
    completeRun,
    level,
    results,
    latestResult,
    totals,
    startComplete,
    chooseDifficulty,
    finishLevel,
    nextLevel,
    retryLevel,
    resetAll
  };
}
