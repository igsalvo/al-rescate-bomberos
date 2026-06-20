import { useEffect, useState } from "react";
import { DifficultySelector } from "./components/DifficultySelector";
import { EducationalGame } from "./components/EducationalGame";
import { FinalResult } from "./components/FinalResult";
import { GameMap } from "./components/GameMap";
import { HomeScreen } from "./components/HomeScreen";
import { LevelResult } from "./components/LevelResult";
import { PlatformHeader } from "./components/PlatformHeader";
import { StartScreen } from "./components/StartScreen";
import { gameBySlug, type GameDefinition } from "./config/games";
import { levels } from "./game/levels";
import { useAudio } from "./hooks/useAudio";
import { useGameState } from "./hooks/useGameState";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { navigate } from "./lib/router";
import "./styles/global.css";

function BomberosGame({ audio, onCatalog }: { audio: ReturnType<typeof useAudio>; onCatalog: () => void }) {
  const game = useGameState();
  const reducedMotion = useReducedMotion();
  if (game.screen === "difficulty") return <><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onCatalog} onRestart={game.resetAll}/><DifficultySelector onChoose={game.chooseDifficulty} onBack={() => game.setScreen("start")} /></>;
  if (game.screen === "playing") return <GameMap key={game.level.id} level={game.level} soundEnabled={audio.enabled} setSoundEnabled={audio.setSound} onBeep={audio.beep} startSiren={audio.startSiren} stopSiren={audio.stopSiren} reducedMotion={reducedMotion} onBack={onCatalog} onRestart={game.resetAll} onFinish={(params) => game.finishLevel({ ...params, level: game.level })} />;
  if (game.screen === "levelResult" && game.latestResult) return <><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onCatalog} onRestart={game.resetAll}/><LevelResult result={game.latestResult} hasNext={game.completeRun && game.results.length < levels.length} onNext={game.nextLevel} onRetry={game.retryLevel} onHome={onCatalog} /></>;
  if (game.screen === "finalResult") return <><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onCatalog} onRestart={game.resetAll}/><FinalResult results={game.results} totals={game.totals} onRestart={game.startComplete} onHome={onCatalog} /></>;
  return <div className="with-floating-back"><button className="floating-back" type="button" onClick={onCatalog}>← Volver a juegos</button><StartScreen onStart={() => { audio.ensureAudio(); audio.beep("alarm"); game.startComplete(); }} /></div>;
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const audio = useAudio();
  useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener("popstate", update); return () => window.removeEventListener("popstate", update); }, []);
  const goHome = () => navigate("/");
  if (path === "/") return <HomeScreen sound={audio.enabled} onSound={audio.setSound} onPlay={(game: GameDefinition) => navigate(`/juegos/${game.slug}`)} />;
  const match = path.match(/^\/juegos\/([^/]+)\/?$/); const selected = match ? gameBySlug(match[1]) : undefined;
  if (!selected || !selected.enabled) return <main className="not-found"><h1>Juego no disponible</h1><button className="primary" onClick={goHome}>Volver al catálogo</button></main>;
  if (selected.id === "bomberos") return <BomberosGame audio={audio} onCatalog={goHome} />;
  return <div className={`game-page theme-${selected.id}`}><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={goHome} /><EducationalGame game={selected} onHome={goHome} /></div>;
}
