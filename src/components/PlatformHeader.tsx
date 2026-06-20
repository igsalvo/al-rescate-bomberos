import { ArrowLeft, RotateCcw } from "lucide-react";
import { platform } from "../config/platform";
import { AudioControls } from "./AudioControls";

export function PlatformHeader({ sound, onSound, onBack, onRestart }: { sound: boolean; onSound: (value: boolean) => void; onBack?: () => void; onRestart?: () => void }) {
  return <header className="platform-header">
    {onBack ? <button className="brand-button" type="button" onClick={onBack} aria-label="Volver al catálogo"><img src="/logo-ingenieria-industrial.png" alt="" /><span>{platform.name}</span></button>
      : <div className="brand-button"><img src="/logo-ingenieria-industrial.png" alt="Ingeniería Industrial, Universidad de Chile" /></div>}
    <nav aria-label="Controles del juego">
      {onBack && <button className="header-action" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Volver a juegos</button>}
      {onRestart && <button className="header-action" type="button" onClick={onRestart}><RotateCcw aria-hidden="true" /> Reiniciar</button>}
      <AudioControls enabled={sound} onChange={onSound} />
    </nav>
  </header>;
}
