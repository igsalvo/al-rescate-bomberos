import { DifficultySelector } from "./components/DifficultySelector";
import { FinalResult } from "./components/FinalResult";
import { GameMap } from "./components/GameMap";
import { LevelResult } from "./components/LevelResult";
import { StartScreen } from "./components/StartScreen";
import { levels } from "./game/levels";
import { useAudio } from "./hooks/useAudio";
import { useGameState } from "./hooks/useGameState";
import { useReducedMotion } from "./hooks/useReducedMotion";
import "./styles/global.css";

export default function App() {
  const game = useGameState();
  const audio = useAudio();
  const reducedMotion = useReducedMotion();

  if (game.screen === "difficulty") {
    return <DifficultySelector onChoose={game.chooseDifficulty} onBack={() => game.setScreen("start")} />;
  }

  if (game.screen === "playing") {
    return (
      <GameMap
        key={game.level.id}
        level={game.level}
        soundEnabled={audio.enabled}
        setSoundEnabled={audio.setSound}
        onBeep={audio.beep}
        startSiren={audio.startSiren}
        stopSiren={audio.stopSiren}
        reducedMotion={reducedMotion}
        onFinish={(params) => game.finishLevel({ ...params, level: game.level })}
      />
    );
  }

  if (game.screen === "levelResult" && game.latestResult) {
    const hasNext = game.completeRun && game.results.length < levels.length;
    return (
      <LevelResult
        result={game.latestResult}
        hasNext={hasNext}
        onNext={game.nextLevel}
        onRetry={game.retryLevel}
        onHome={game.resetAll}
      />
    );
  }

  if (game.screen === "finalResult") {
    return <FinalResult results={game.results} totals={game.totals} onRestart={game.startComplete} onHome={game.resetAll} />;
  }

  return (
    <StartScreen
      mode={game.mode}
      setMode={game.setMode}
      teamName={game.teamName}
      setTeamName={game.setTeamName}
      soundEnabled={audio.enabled}
      setSoundEnabled={audio.setSound}
      onStart={() => {
        audio.ensureAudio();
        audio.beep("alarm");
        game.startComplete();
      }}
      onDifficulty={() => game.setScreen("difficulty")}
    />
  );
}
