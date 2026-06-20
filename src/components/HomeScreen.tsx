import { useMemo, useState } from "react";
import { ArrowRight, Clock, Sparkles, Users } from "lucide-react";
import { games, type GameDefinition } from "../config/games";
import { platform } from "../config/platform";
import { PlatformHeader } from "./PlatformHeader";

const filters = ["Todos", "Individual", "Grupal", "Datos y decisiones", "Optimización", "Simulación"];
const modeLabel = { individual: "Individual", group: "Grupal", both: "Individual o grupal" };
const difficultyLabel = { easy: "Fácil", medium: "Intermedio", progressive: "Progresivo" };

function GameCard({ game, onPlay }: { game: GameDefinition; onPlay: () => void }) {
  return <article className={`catalog-card ${!game.enabled ? "disabled" : ""}`} onClick={game.enabled ? onPlay : undefined} onKeyDown={(event) => { if (game.enabled && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onPlay(); } }} tabIndex={game.enabled ? 0 : undefined} aria-label={`${game.title}. ${game.shortDescription}`}>
    <div className="card-top"><div className="card-icon" aria-hidden="true">{game.icon}</div><span>{difficultyLabel[game.difficulty]}</span></div>
    <div className="card-copy"><h2>{game.title}</h2><p>{game.shortDescription}</p></div>
    <div className="game-meta"><span><Clock size={17} />{game.duration}</span><span><Users size={17} />{modeLabel[game.mode]}</span></div>
    <div className="tag-row">{game.categories.slice(0, 2).map(category => <span key={category}>{category}</span>)}</div>
    <button className="card-play" type="button" disabled={!game.enabled} onClick={(event) => { event.stopPropagation(); onPlay(); }}>{game.enabled ? <><span>Jugar</span><ArrowRight size={18} /></> : "Próximamente"}</button>
  </article>;
}

export function HomeScreen({ sound, onSound, onPlay }: { sound: boolean; onSound: (value: boolean) => void; onPlay: (game: GameDefinition) => void }) {
  const [filter, setFilter] = useState("Todos");
  const visible = useMemo(() => games.filter(game => filter === "Todos" || (filter === "Individual" && game.mode !== "group") || (filter === "Grupal" && game.mode !== "individual") || game.categories.includes(filter)), [filter]);
  return <div className="catalog-page">
    <PlatformHeader sound={sound} onSound={onSound} />
    <main>
      <section className="catalog-hero">
        <div className="hero-copy"><p className="hero-kicker"><Sparkles size={16} /> Aprende tomando decisiones</p><h1>{platform.name}</h1><p>{platform.subtitle}</p><small>{platform.intro}</small><a href="#juegos" className="hero-action">Explorar desafíos <ArrowRight size={18} /></a></div>
        <div className="hero-brand"><img src="/logo-ingenieria-industrial.png" alt="Ingeniería Industrial, Universidad de Chile" /><div><strong>10</strong><span>experiencias interactivas</span></div></div>
      </section>
      <section className="catalog-section" id="juegos" aria-labelledby="games-title"><div className="section-heading"><div><p>Catálogo</p><h2 id="games-title">Elige un desafío</h2></div><span>{visible.length} juegos disponibles</span></div>
        <div className="filters" role="group" aria-label="Filtrar juegos">{filters.map(item => <button type="button" className={filter === item ? "selected" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
        <div className="catalog-grid">{visible.map(game => <GameCard game={game} onPlay={() => onPlay(game)} key={game.id} />)}</div>
      </section>
    </main>
  </div>;
}
