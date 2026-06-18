import { Flame, GraduationCap, Siren } from "lucide-react";
import type { LevelConfig } from "../game/types";

export function EmergencyMarker({ level }: { level: LevelConfig }) {
  const Icon = level.emergencyType === "fire" ? Flame : level.emergencyType === "school" ? GraduationCap : Siren;
  return (
    <foreignObject x={level.emergencyPosition.x - 46} y={level.emergencyPosition.y - 50} width="92" height="72">
      <div className="emergency-marker" role="img" aria-label={level.emergencyLabel}>
        <Icon aria-hidden="true" />
        <span>{level.emergencyLabel}</span>
      </div>
    </foreignObject>
  );
}
