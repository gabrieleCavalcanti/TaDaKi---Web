import logo from "../assets/Logo.png";
import "../css/LoadingScreen.css";

export function LoadingScreen() {
  return (
    <main className="tadaki-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="tadaki-loading-orbit" aria-hidden="true" />
      <section className="tadaki-loading-card">
        <img src={logo} alt="TaDaKi" className="tadaki-loading-logo" />
        <div className="tadaki-loading-bars" aria-hidden="true"><span /><span /><span /><span /></div>
        <h1>Suas próximas descobertas estão chegando.</h1>
        <p>Verificando sua sessão para abrir o TaDaKi.</p>
        <div className="tadaki-loading-track" aria-hidden="true"><span /></div>
        <small>Pertinho de você. Feito por gente.</small>
      </section>
    </main>
  );
}
