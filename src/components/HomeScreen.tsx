import { useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, Sparkles, Target, Users, Wifi } from "lucide-react";
import { games, type GameDefinition } from "../config/games";
import { platform } from "../config/platform";
import { PlatformHeader } from "./PlatformHeader";

const filters = ["Todos", "Datos y decisiones", "Optimización", "Simulación"];
const modeLabel = { individual: "Individual", group: "Grupal", both: "Individual o grupal" };
const difficultyLabel = { easy: "Fácil", medium: "Intermedio", progressive: "Progresivo" };

function GameCard({ game, onPlay }: { game: GameDefinition; onPlay: () => void }) {
  return <article className={`catalog-card ${!game.enabled ? "disabled" : ""}`} onClick={game.enabled ? onPlay : undefined} onKeyDown={(event) => { if (game.enabled && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onPlay(); } }} tabIndex={game.enabled ? 0 : undefined} aria-label={`${game.title}. ${game.shortDescription}`}>
    <div className="card-top"><div className="card-icon" aria-hidden="true">{game.icon}</div><span>{difficultyLabel[game.difficulty]}</span></div>
    <div className="card-copy"><h2>{game.title}</h2><p>{game.shortDescription}</p></div>
    <div className="game-meta"><span><Users size={17} />{modeLabel[game.mode]}</span><span><Target size={17}/>{game.categories[0]}</span></div>
    <div className="tag-row">{game.categories.slice(0, 2).map(category => <span key={category}>{category}</span>)}</div>
    <button className="card-play" type="button" disabled={!game.enabled} onClick={(event) => { event.stopPropagation(); onPlay(); }}>{game.enabled ? <><span>Comenzar desafío</span><ArrowRight size={18} /></> : "Próximamente"}</button>
  </article>;
}

export function HomeScreen({ sound, onSound, onPlay, onMultiplayer }: { sound: boolean; onSound: (value: boolean) => void; onPlay: (game: GameDefinition) => void; onMultiplayer: () => void }) {
  const [filter, setFilter] = useState("Todos");
  const visible = useMemo(() => games.filter(game => filter === "Todos" || game.categories.includes(filter)), [filter]);
  return <div className="catalog-page">
    <PlatformHeader sound={sound} onSound={onSound} />
    <main>
      <section className="catalog-hero">
        <div className="hero-copy"><p className="hero-kicker"><Sparkles size={16} /> Aprende jugando y experimentando</p><h1>{platform.name}</h1><p>{platform.subtitle}</p><small>{platform.intro}</small><div className="hero-actions"><a href="#juegos" className="hero-action">Jugar individual <ArrowRight size={18} /></a><button type="button" className="multiplayer-action" onClick={onMultiplayer}><Wifi size={18}/> Crear o unirme a una partida</button></div><div className="hero-benefits"><span><BrainCircuit/>Decisiones reales</span><span><Target/>Resultados inmediatos</span><span><Users/>Para jugar solo o en grupo</span></div></div>
        <div className="hero-brand"><img src="/logo-ingenieria-industrial.png" alt="Ingeniería Industrial, Universidad de Chile" /><div><strong>10</strong><span>experiencias interactivas</span></div></div>
      </section>
      <section className="catalog-section" id="juegos" aria-labelledby="games-title"><div className="section-heading"><div><p>Catálogo interactivo</p><h2 id="games-title">¿Qué quieres resolver hoy?</h2><small>Todos los desafíos incluyen instrucciones y resultados explicados.</small></div><span>{visible.length} juegos disponibles</span></div>
        <div className="filters" role="group" aria-label="Filtrar juegos">{filters.map(item => <button type="button" className={filter === item ? "selected" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
        <div className="catalog-grid">{visible.map(game => <GameCard game={game} onPlay={() => onPlay(game)} key={game.id} />)}</div>
      </section>
    </main>
  </div>;
}
