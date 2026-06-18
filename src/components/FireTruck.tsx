import type { Point } from "../game/types";

export function FireTruck({
  position,
  label,
  active,
  dragging
}: {
  position: Point;
  label: string;
  active?: boolean;
  dragging?: boolean;
}) {
  return (
    <g className={`truck-svg ${active ? "is-active" : ""} ${dragging ? "is-dragging" : ""}`} transform={`translate(${position.x} ${position.y})`}>
      <rect x="-28" y="-15" width="56" height="30" rx="7" />
      <rect x="-16" y="-26" width="30" height="16" rx="5" />
      <circle cx="-17" cy="17" r="7" />
      <circle cx="18" cy="17" r="7" />
      <text y="4" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
