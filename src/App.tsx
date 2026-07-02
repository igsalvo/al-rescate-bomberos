import { useEffect, useRef, useState, type ReactNode } from "react";
import { DifficultySelector } from "./components/DifficultySelector";
import { EducationalGame } from "./components/EducationalGame";
import { FinalResult } from "./components/FinalResult";
import { GameMap } from "./components/GameMap";
import { HomeScreen } from "./components/HomeScreen";
import { LevelResult } from "./components/LevelResult";
import { PlatformHeader } from "./components/PlatformHeader";
import { SimulationMode } from "./components/SimulationMode";
import { StartScreen } from "./components/StartScreen";
import { gameBySlug, games, type GameDefinition } from "./config/games";
import { levels } from "./game/levels";
import { useAudio } from "./hooks/useAudio";
import { useGameState } from "./hooks/useGameState";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { navigate } from "./lib/router";
import { InstructionModal } from "./components/InstructionModal";
import { gameInstructions } from "./config/instructions";
import "./styles/global.css";
import { MultiplayerPanel } from "./components/MultiplayerPanel";
import { RoomBar } from "./components/RoomBar";
import { useMultiplayer } from "./multiplayer/MultiplayerContext";

function BomberosGame({ audio, onCatalog }: { audio: ReturnType<typeof useAudio>; onCatalog: () => void }) {
  const game = useGameState();
  const { submitScore } = useMultiplayer();
  const reducedMotion = useReducedMotion();
  const [instructionsOpen,setInstructionsOpen]=useState(true);
  const submitted = useRef("");
  useEffect(() => { if (game.screen !== "finalResult" || !game.results.length) return; const marker=game.results.map(result=>result.score).join("-"); if(submitted.current===marker)return; submitted.current=marker; void submitScore("bomberos", Math.round(game.totals.score/game.results.length)).catch(() => undefined); }, [game.screen, game.results, game.totals.score, submitScore]);
  const wrap=(content:ReactNode)=><>{content}<button className="floating-help" type="button" onClick={()=>setInstructionsOpen(true)}>¿Cómo jugar?</button><InstructionModal open={instructionsOpen} title="¡Al rescate!" icon="🚒" instructions={gameInstructions.bomberos} onClose={()=>setInstructionsOpen(false)}/></>;
  if (game.screen === "difficulty") return wrap(<><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onCatalog} onRestart={game.resetAll}/><DifficultySelector onChoose={game.chooseDifficulty} onBack={() => game.setScreen("start")} /></>);
  if (game.screen === "playing") return wrap(<GameMap key={game.level.id} level={game.level} soundEnabled={audio.enabled} setSoundEnabled={audio.setSound} onBeep={audio.beep} startSiren={audio.startSiren} stopSiren={audio.stopSiren} reducedMotion={reducedMotion} onBack={onCatalog} onRestart={game.resetAll} onFinish={(params) => game.finishLevel({ ...params, level: game.level })} />);
  if (game.screen === "levelResult" && game.latestResult) return wrap(<><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onCatalog} onRestart={game.resetAll}/><LevelResult result={game.latestResult} hasNext={game.completeRun && game.results.length < levels.length} onNext={game.nextLevel} onRetry={game.retryLevel} onHome={onCatalog} /></>);
  if (game.screen === "finalResult") return wrap(<><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onCatalog} onRestart={game.resetAll}/><FinalResult results={game.results} totals={game.totals} onRestart={game.startComplete} onHome={onCatalog} /></>);
  return wrap(<div className="with-floating-back"><button className="floating-back" type="button" onClick={onCatalog}>← Volver a juegos</button><StartScreen onStart={() => { audio.ensureAudio(); audio.beep("alarm"); game.startComplete(); }} /></div>);
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [multiplayerOpen,setMultiplayerOpen]=useState(false);
  const { room, playerId, startGame } = useMultiplayer();
  const audio = useAudio();
  useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener("popstate", update); return () => window.removeEventListener("popstate", update); }, []);
  const roomVersion = useRef(0);
  useEffect(()=>{if(!room?.gameId||room.version===roomVersion.current)return;roomVersion.current=room.version;const game=games.find(item=>item.id===room.gameId);if(game)navigate(`/juegos/${game.slug}`);},[room?.gameId,room?.version]);
  const goHome = () => navigate("/");
  const chooseGame=async(game:GameDefinition)=>{if(room&&room.hostId!==playerId){setMultiplayerOpen(true);return;}if(room)await startGame(game.id);navigate(`/juegos/${game.slug}`);};
  if (path === "/") return <><RoomBar/><HomeScreen sound={audio.enabled} onSound={audio.setSound} onPlay={chooseGame} onMultiplayer={()=>setMultiplayerOpen(true)} onSimulation={() => navigate("/simulaciones")} /><MultiplayerPanel open={multiplayerOpen} onClose={()=>setMultiplayerOpen(false)}/></>;
  const simulationMatch = path.match(/^\/simulaciones(?:\/([^/]+))?\/?$/);
  if (simulationMatch) return <SimulationMode slug={simulationMatch[1]} audio={audio} onHome={goHome} />;
  const match = path.match(/^\/juegos\/([^/]+)\/?$/); const selected = match ? gameBySlug(match[1]) : undefined;
  if (!selected || !selected.enabled) return <main className="not-found"><h1>Juego no disponible</h1><button className="primary" onClick={goHome}>Volver al catálogo</button></main>;
  if (selected.id === "bomberos") return <><RoomBar gameId={selected.id}/><BomberosGame audio={audio} onCatalog={goHome} /></>;
  return <><RoomBar gameId={selected.id}/><div className={`game-page theme-${selected.id}`}><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={goHome} /><EducationalGame game={selected} onHome={goHome} /></div></>;
}
