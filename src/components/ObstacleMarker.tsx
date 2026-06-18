import { Ban, CloudRain, Cone, Flame, TrafficCone } from "lucide-react";
import { OBSTACLE_LABELS } from "../config/content";
import type { ObstacleType, Point } from "../game/types";

const icons = {
  traffic: TrafficCone,
  closed: Ban,
  works: Cone,
  oneway: TrafficCone,
  busy: Ban,
  otherEmergency: Flame,
  rain: CloudRain
};

export function ObstacleMarker({ type, point }: { type: ObstacleType; point: Point }) {
  const Icon = icons[type];
  return (
    <foreignObject x={point.x - 40} y={point.y - 32} width="80" height="58" className="obstacle-fo">
      <div className="map-badge">
        <Icon size={16} aria-hidden="true" />
        <span>{OBSTACLE_LABELS[type]}</span>
      </div>
    </foreignObject>
  );
}
