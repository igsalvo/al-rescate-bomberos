import type { LockedScenario, ScenarioConfig, TeamStrategy } from "./types";

const SCENARIO_KEY = "wildfire-prevention-scenario-v1";
const STRATEGY_KEY = "wildfire-prevention-team-strategy-v1";

function keyFor(baseKey: string, partId: string) {
  return partId === "part-2" ? baseKey : `${baseKey}:${partId}`;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadScenario(partId: string, defaultScenario: ScenarioConfig): ScenarioConfig | LockedScenario {
  return readJson<ScenarioConfig | LockedScenario>(keyFor(SCENARIO_KEY, partId)) ?? defaultScenario;
}

export function saveScenario(partId: string, scenario: ScenarioConfig | LockedScenario) {
  window.localStorage.setItem(keyFor(SCENARIO_KEY, partId), JSON.stringify(scenario));
}

export function resetScenarioStorage(partId: string) {
  window.localStorage.removeItem(keyFor(SCENARIO_KEY, partId));
  window.localStorage.removeItem(keyFor(STRATEGY_KEY, partId));
}

export function loadStrategy(partId: string): TeamStrategy {
  return readJson<TeamStrategy>(keyFor(STRATEGY_KEY, partId)) ?? { firebreaks: [], justification: "", locked: false };
}

export function saveStrategy(partId: string, strategy: TeamStrategy) {
  window.localStorage.setItem(keyFor(STRATEGY_KEY, partId), JSON.stringify(strategy));
}
