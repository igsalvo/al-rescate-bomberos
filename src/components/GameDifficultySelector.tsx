import { Gauge, ShieldCheck, Sparkles } from "lucide-react";

export type EducationalDifficulty = "easy" | "medium" | "hard";

const options: Array<{
  id: EducationalDifficulty;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
}> = [
  { id: "easy", title: "Fácil", description: "Aprende la mecánica con menos elementos y pistas claras.", icon: ShieldCheck },
  { id: "medium", title: "Medio", description: "Más información y decisiones simultáneas.", icon: Gauge },
  { id: "hard", title: "Difícil", description: "Mayor complejidad visual y menos margen de error.", icon: Sparkles }
];

export function GameDifficultySelector({ gameTitle, onChoose }: { gameTitle: string; onChoose: (difficulty: EducationalDifficulty) => void }) {
  return <section className="play-panel game-difficulty-selector" aria-labelledby="difficulty-title">
    <p className="eyebrow">Antes de comenzar</p>
    <h2 id="difficulty-title">Elige la dificultad</h2>
    <p>Selecciona cómo quieres jugar “{gameTitle}”.</p>
    <div className="difficulty-grid">
      {options.map(({ id, title, description, icon: Icon }) => <button className="difficulty-card" type="button" key={id} onClick={() => onChoose(id)}>
        <Icon aria-hidden="true" />
        <strong>{title}</strong>
        <span>{description}</span>
      </button>)}
    </div>
  </section>;
}
