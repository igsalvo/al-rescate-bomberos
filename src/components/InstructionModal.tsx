import { useEffect } from "react";
import { CheckCircle2, Lightbulb, Target, X } from "lucide-react";
import type { GameInstructions } from "../config/instructions";

export function InstructionModal({ open, title, icon, instructions, onClose }: { open: boolean; title: string; icon: string; instructions: GameInstructions; onClose: () => void }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.classList.remove("modal-open"); window.removeEventListener("keydown", closeOnEscape); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="instruction-modal" role="dialog" aria-modal="true" aria-labelledby="instruction-title">
      <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar instrucciones"><X /></button>
      <div className="instruction-title"><span aria-hidden="true">{icon}</span><div><small>ANTES DE COMENZAR</small><h2 id="instruction-title">{title}</h2></div></div>
      <div className="instruction-objective"><Target aria-hidden="true"/><div><strong>Tu misión</strong><p>{instructions.objective}</p></div></div>
      <ol>{instructions.steps.map((step,index)=><li key={step}><span>{index+1}</span><p>{step}</p><CheckCircle2 aria-hidden="true"/></li>)}</ol>
      <div className="instruction-tip"><Lightbulb aria-hidden="true"/><p><strong>Pista:</strong> {instructions.tip}</p></div>
      <button className="primary instruction-start" type="button" autoFocus onClick={onClose}>Entendido, comenzar</button>
    </section>
  </div>;
}
