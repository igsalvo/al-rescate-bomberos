import { useMemo, useState } from "react";
import { levels, stations, trucks } from "../game/levels";
import { calculateDispatchScore, gradeForScore, starsForHundredScore } from "../game/scoring";
import { collectObstacles } from "../game/pathfinding";
import type { Difficulty, GameMode, GameScreen, LevelConfig, LevelResultData, TripEvent } from "../game/types";
import { EDUCATIONAL_MESSAGE } from "../config/content";

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
    preparationTime: number;
    travelTime: number;
    tripEvent?: TripEvent;
  }) => {
    const station = stations.find((item) => item.id === params.stationId)!;
    const truck = trucks.find((item) => item.id === params.truckId)!;
    const playerTime = Math.round((params.travelTime + params.preparationTime) * 10) / 10;
    const scoring = calculateDispatchScore({
      level: params.level,
      truck,
      path: params.path,
      preparationTime: params.preparationTime,
      travelTime: params.travelTime,
      event: params.tripEvent
    });
    const score = scoring.score;
    const obstacles = collectObstacles(params.path, params.level.weather);
    const explanation = `Obtuviste ${score} puntos. ${truck.name} ${params.level.recommendedTruckTypes?.includes(truck.type) ? "era adecuado" : "no era el vehículo más especializado"} para ${params.level.emergencyLabel.toLowerCase()}, y ${params.routeName.toLowerCase()} ${obstacles.includes("traffic") || obstacles.includes("works") ? "presentaba condiciones que afectaron el recorrido" : "mantuvo condiciones controladas"}.`;
    const achievements = [
      scoring.breakdown.route >= 24 ? "Ruta inteligente" : "",
      scoring.breakdown.truck >= 24 ? "Vehículo correcto" : "",
      scoring.breakdown.safety >= 8 ? "Respuesta segura" : "",
      params.tripEvent?.choiceRequired ? "Bajo presión" : "",
      score >= 95 ? "Despacho perfecto" : ""
    ].filter(Boolean);

    const result: LevelResultData = {
      levelId: params.level.id,
      levelTitle: params.level.title,
      companyName: station.name,
      truckName: truck.name,
      routeName: params.routeName,
      playerTime,
      preparationTime: params.preparationTime,
      travelTime: params.travelTime,
      optimalTime: scoring.bestTime,
      decisionTime: Math.round(params.decisionTime),
      score,
      stars: starsForHundredScore(score),
      obstacles,
      breakdown: scoring.breakdown,
      grade: gradeForScore(score),
      strengths: scoring.strengths,
      improvements: scoring.improvements,
      achievements,
      educationalMessage: EDUCATIONAL_MESSAGE,
      bestCombination: scoring.bestCombination,
      tripEvent: params.tripEvent,
      explanation,
      playerPath: params.path,
      optimalPath: scoring.bestPath
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
