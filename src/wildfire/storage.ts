import { createDefaultScenario } from "./config";
import type { LockedScenario, ScenarioConfig, TeamStrategy } from "./types";

const SCENARIO_KEY = "wildfire-prevention-scenario-v1";
const STRATEGY_KEY = "wildfire-prevention-team-strategy-v1";

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadScenario(): ScenarioConfig | LockedScenario {
  return readJson<ScenarioConfig | LockedScenario>(SCENARIO_KEY) ?? createDefaultScenario();
}

export function saveScenario(scenario: ScenarioConfig | LockedScenario) {
  window.localStorage.setItem(SCENARIO_KEY, JSON.stringify(scenario));
}

export function resetScenarioStorage() {
  window.localStorage.removeItem(SCENARIO_KEY);
  window.localStorage.removeItem(STRATEGY_KEY);
}

export function loadStrategy(): TeamStrategy {
  return readJson<TeamStrategy>(STRATEGY_KEY) ?? { firebreaks: [], justification: "", locked: false };
}

export function saveStrategy(strategy: TeamStrategy) {
  window.localStorage.setItem(STRATEGY_KEY, JSON.stringify(strategy));
}
