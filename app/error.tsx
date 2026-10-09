"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand-mark">F</div>
        <p className="eyebrow">ALGO NO SALIÓ COMO ESPERÁBAMOS</p>
        <h1>No pudimos cargar esta pantalla</h1>
        <p className="muted">Tus datos no se han mostrado. Puedes volver a intentarlo.</p>
        <button className="button primary full-width" onClick={() => reset()}>Intentar de nuevo</button>
      </section>
    </main>
  );
}