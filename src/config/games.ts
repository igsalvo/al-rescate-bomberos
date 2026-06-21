export type GameMode = "individual" | "group" | "both";
export type GameDifficulty = "easy" | "medium" | "progressive";

export type GameDefinition = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  duration: string;
  mode: GameMode;
  difficulty: GameDifficulty;
  categories: string[];
  enabled: boolean;
  learning: string;
  researchUrl?: string;
  researchTitle?: string;
};

export const games: GameDefinition[] = [
  { id: "bomberos", slug: "bomberos", title: "¡Al rescate!", shortDescription: "Escoge un carro y una ruta para llegar rápidamente a una emergencia.", fullDescription: "Evita tráfico y calles cerradas para encontrar la ruta más eficiente.", icon: "🚒", duration: "2–3 min", mode: "both", difficulty: "progressive", categories: ["Optimización", "Rutas", "Decisiones reales"], enabled: true, learning: "La ruta más corta no siempre es la más rápida." },
  { id: "incendio", slug: "incendio", title: "Detén el incendio", shortDescription: "Ubica cortafuegos y protege viviendas y naturaleza.", fullDescription: "Decide dónde usar recursos limitados antes de simular la propagación.", icon: "🌲", duration: "2–3 min", mode: "both", difficulty: "medium", categories: ["Simulación", "Optimización"], enabled: true, learning: "La ubicación de las medidas preventivas puede ser tan importante como la cantidad de recursos disponibles.", researchUrl: "https://www.dii.uchile.cl/2024/01/23/andres-weintraub-ya-no-basta-con-combatir-los-incendios-hay-que-tomar-medidas-previas-para-que-estos-no-causen-tanto-dano/", researchTitle: "Conoce la investigación sobre prevención y simulación de incendios" },
  { id: "formula-1", slug: "formula-1", title: "¡A boxes!", shortDescription: "Decide cuándo cambiar neumáticos durante una carrera.", fullDescription: "Anticipa desgaste y eventos para elegir el mejor momento de parada.", icon: "🏎️", duration: "2–3 min", mode: "both", difficulty: "medium", categories: ["Simulación", "Datos y decisiones"], enabled: true, learning: "Una buena decisión depende de anticipar lo que puede ocurrir y evaluar sus consecuencias.", researchUrl: "https://isci.cl/cual-es-la-mejor-estrategia-de-carrera-en-la-formula-1/", researchTitle: "Descubre la investigación sobre estrategia de carrera en Fórmula 1" },
  { id: "detective-datos", slug: "detective-datos", title: "Detective de datos", shortDescription: "Encuentra el elemento que no sigue el patrón.", fullDescription: "Supera tres niveles de detección de anomalías.", icon: "🔎", duration: "1–2 min", mode: "individual", difficulty: "progressive", categories: ["Datos y decisiones"], enabled: true, learning: "La analítica de datos permite encontrar patrones y detectar elementos distintos." },
  { id: "campeon", slug: "campeon", title: "¿Quién será campeón?", shortDescription: "Predice qué equipo tiene más probabilidades de ganar.", fullDescription: "Compara indicadores y contrasta tu decisión con 100 simulaciones.", icon: "🏆", duration: "1–2 min", mode: "both", difficulty: "easy", categories: ["Simulación", "Datos y decisiones"], enabled: true, learning: "Una predicción no asegura el resultado, pero estima qué alternativas son más probables." },
  { id: "energia", slug: "energia", title: "Misión energía", shortDescription: "Mantén la ciudad activa sin superar la energía disponible.", fullDescription: "Prioriza servicios esenciales y reduce consumos no críticos.", icon: "⚡", duration: "2–3 min", mode: "both", difficulty: "medium", categories: ["Optimización", "Datos y decisiones"], enabled: true, learning: "Administrar recursos significa decidir qué priorizar y cuándo utilizarlo." },
  { id: "esperar", slug: "esperar", title: "¿Aceptas o sigues esperando?", shortDescription: "Decide cuándo aceptar sin conocer las opciones futuras.", fullDescription: "Observa opciones de una en una: las rechazadas no regresan.", icon: "🎁", duration: "1–2 min", mode: "individual", difficulty: "easy", categories: ["Datos y decisiones"], enabled: true, learning: "Tomar decisiones también implica saber cuándo dejar de buscar." },
  { id: "vivienda", slug: "vivienda", title: "¿Cuánto cuesta esta casa?", shortDescription: "Estima el valor usando las características de una vivienda.", fullDescription: "Compara tu estimación con un modelo predictivo explicable.", icon: "🏠", duration: "1–2 min", mode: "both", difficulty: "easy", categories: ["Datos y decisiones"], enabled: true, learning: "Los modelos predictivos combinan muchas características para estimar valores." },
  { id: "mision-espacial", slug: "mision-espacial", title: "Misión Espacial", shortDescription: "Carga la nave sin superar su capacidad.", fullDescription: "Compara decisiones individuales y construye una selección por consenso.", icon: "🚀", duration: "3–5 min", mode: "group", difficulty: "progressive", categories: ["Optimización", "Grupal"], enabled: true, learning: "La optimización encuentra buenas combinaciones y el consenso permite comparar criterios." },
  { id: "hospitales", slug: "hospitales", title: "¿Dónde hace más falta?", shortDescription: "Asigna un recurso al hospital donde logre mayor impacto.", fullDescription: "Combina demanda, capacidad y personal para decidir.", icon: "🏥", duration: "1–2 min", mode: "both", difficulty: "progressive", categories: ["Datos y decisiones", "Optimización"], enabled: true, learning: "La mayor fila no siempre indica dónde un recurso tendrá mayor impacto." }
];

export const gameBySlug = (slug: string) => games.find((game) => game.slug === slug);
