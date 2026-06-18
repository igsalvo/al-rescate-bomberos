export function StartScreen({
  onStart
}: {
  onStart: () => void;
}) {
  return (
    <main className="start-screen">
      <section className="hero-map" aria-hidden="true">
        <svg viewBox="0 0 900 620">
          <rect width="900" height="620" fill="#0b3a66" />
          <path d="M0 130 C180 190 275 95 435 145 S720 220 900 110" stroke="#73d2de" strokeWidth="28" fill="none" opacity=".9" />
          <path d="M90 475 C230 360 380 445 520 330 S730 305 850 210" stroke="#f8c537" strokeWidth="18" fill="none" />
          <path d="M55 250 H790 M160 95 V560 M360 90 V560 M610 70 V545" stroke="#eef7f8" strokeWidth="18" opacity=".55" />
          <circle cx="160" cy="250" r="35" fill="#e5383b" />
          <rect x="575" y="282" width="78" height="46" rx="9" fill="#e5383b" />
          <circle cx="596" cy="332" r="12" fill="#111827" />
          <circle cx="635" cy="332" r="12" fill="#111827" />
          <path d="M720 184 l24 44 h-48z" fill="#ffbe0b" />
        </svg>
      </section>
      <section className="start-content">
        <div className="brand-row">
          <img
            className="brand-logo"
            src="https://res.cloudinary.com/drtluusdh/image/upload/v1781277030/Sin_ti%CC%81tulo_1080_x_400_px_igyvfv.png"
            alt="Ingeniería Industrial, Universidad de Chile"
          />
        </div>
        <h1>Bomberos al rescate</h1>
        <p className="subtitle">¿Podrás elegir el carro y la ruta más rápida?</p>
        <p>Selecciona un carro, elige una ruta y llega a la emergencia lo antes posible. Observa el tráfico, los cortes de calle y otros obstáculos.</p>

        <div className="action-row">
          <button className="primary" type="button" onClick={onStart}>
            Jugar
          </button>
        </div>
      </section>
    </main>
  );
}
