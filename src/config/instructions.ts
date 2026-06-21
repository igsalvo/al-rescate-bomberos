export type GameInstructions = {
  objective: string;
  steps: string[];
  tip: string;
};

export const gameInstructions: Record<string, GameInstructions> = {
  bomberos: { objective: "Llegar a la emergencia en el menor tiempo posible.", steps: ["Elige una compañía y un carro disponible.", "Compara rutas, tráfico y calles cerradas.", "Arrastra el carro o confirma la mejor ruta."], tip: "La distancia más corta no siempre entrega el menor tiempo." },
  incendio: { objective: "Proteger viviendas y naturaleza con recursos limitados.", steps: ["Ubica entre tres y cuatro cortafuegos.", "Observa la dirección del viento.", "Inicia la simulación y mira cómo avanza cada frente."], tip: "Cortar conexiones estratégicas suele ser mejor que rodear solo el punto inicial." },
  "formula-1": { objective: "Elegir la vuelta más conveniente para entrar a boxes.", steps: ["Observa desgaste, posición y clima.", "Decide entre continuar o cambiar neumáticos.", "Adapta tu estrategia a lluvia, rivales y Safety Car."], tip: "Una parada durante Safety Car cuesta menos tiempo relativo." },
  "detective-datos": { objective: "Encontrar la anomalía en tres niveles.", steps: ["Observa forma, relleno y posición.", "Selecciona el elemento diferente.", "Lee la explicación antes del siguiente patrón."], tip: "En niveles avanzados debes combinar más de una característica." },
  campeon: { objective: "Predecir el campeón usando evidencia.", steps: ["Compara ataque, defensa y forma.", "Elige un equipo.", "Ejecuta 100 torneos y contrasta tu predicción."], tip: "Una probabilidad alta no garantiza un resultado individual." },
  energia: { objective: "Mantener la ciudad activa durante todo el día.", steps: ["Activa o reduce servicios según el horario.", "No superes la capacidad disponible.", "Protege hospital, viviendas y transporte."], tip: "La demanda y la capacidad cambian; revisa la barra antes de avanzar." },
  esperar: { objective: "Decidir cuándo aceptar sin conocer el futuro.", steps: ["Evalúa cada proyecto al aparecer.", "Acepta o continúa buscando.", "Recuerda que una opción rechazada desaparece."], tip: "Esperar puede mejorar la oportunidad, pero también aumenta el riesgo." },
  vivienda: { objective: "Estimar el valor de una vivienda ficticia.", steps: ["Revisa sus características.", "Ajusta tu estimación.", "Compara con el modelo y sus variables influyentes."], tip: "Ninguna característica explica por sí sola el valor completo." },
  "mision-espacial": { objective: "Maximizar utilidad sin exceder 25 kg.", steps: ["Cada participante crea una propuesta privada.", "Comparen los puntajes individuales.", "Construyan y lancen una carga grupal."], tip: "La mejor relación utilidad/peso ayuda, pero la combinación final es lo importante." },
  hospitales: { objective: "Enviar un recurso donde produzca mayor impacto.", steps: ["Compara personas esperando, camas y personal.", "Selecciona un hospital.", "Despacha la unidad y observa el impacto."], tip: "La fila más larga no siempre representa la mejor asignación." }
};
