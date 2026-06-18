import { levels } from "../game/levels";
import type { Difficulty } from "../game/types";

export function DifficultySelector({
  onChoose,
  onBack
}: {
  onChoose: (difficulty: Difficulty) => void;
  onBack: () => void;
}) {
  return (
    <main className="screen compact-screen">
      <section className="panel intro-panel">
        <p className="eyebrow">Elegir dificultad</p>
        <h1>Selecciona una mision</h1>
        <div className="difficulty-grid">
          {levels.map((level) => (
            <button className="difficulty-card" type="button" key={level.id} onClick={() => onChoose(level.id)}>
              <strong>{level.title}</strong>
              <span>{level.subtitle}</span>
              <small>{level.manualRouting ? "Recorrido manual" : "Rutas predisenadas"}</small>
            </button>
          ))}
        </div>
        <button className="secondary" type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    </main>
  );
}
