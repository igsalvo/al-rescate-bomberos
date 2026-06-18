import { Volume2, VolumeX } from "lucide-react";

export function AudioControls({
  enabled,
  onChange
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button className="icon-button" type="button" onClick={() => onChange(!enabled)} aria-pressed={enabled}>
      {enabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
      <span>{enabled ? "Sonido" : "Silencio"}</span>
    </button>
  );
}
