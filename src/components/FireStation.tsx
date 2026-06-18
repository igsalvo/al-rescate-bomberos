import { Home } from "lucide-react";
import type { FireStation as FireStationType } from "../game/types";

export function StationButton({
  station,
  selected,
  disabled,
  onSelect
}: {
  station: FireStationType;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={`choice ${selected ? "selected" : ""}`} disabled={disabled} type="button" onClick={onSelect}>
      <Home aria-hidden="true" />
      <span>{station.name}</span>
    </button>
  );
}
