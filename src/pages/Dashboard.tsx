import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getImageUrl } from "../services/api";
import { userType } from "../components/feed/model";
import { useDashboard } from "../components/dashboard/useDashboard";
import { currentMonth, monthLabel } from "../components/dashboard/model";
import "../css/Dashboard.css";
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const allowed = userType(user) === "ORGANIZACAO";
  const dashboard = useDashboard(
    allowed,
    Number(user?.id_pessoa ?? user?.id_pessoa_login ?? 0),
  );
  if (!allowed) return <Navigate to="/" replace />;
  const data = dashboard.data;
  return (
    <main className="organization-dashboard">
      <header>
        <button className="back-button" onClick={() => navigate("/")}>
          ← Voltar para a Home
        </button>
        <span>TaDaKi · Sua empresa</span>
      </header>
      <section className="dashboard-heading">
        <div>
          <p className="feed-eyebrow">RESULTADOS DO SEU NEGÓCIO</p>
          <h1>Dashboard</h1>
          <p>Acompanhe a relação da comunidade com seus produtos.</p>
        </div>
        <label>
          Mês de referência
          <input
            type="month"
            aria-label="Mês de referência"
            min="2000-01"
            max={currentMonth()}
            value={dashboard.month}
            onChange={(e) => {
              if (e.target.value) dashboard.setMonth(e.target.value);
            }}
          />
        </label>
      </section>
      <div className="dashboard-period">
        <h2>{monthLabel(dashboard.month)}</h2>
        <button disabled={dashboard.loading} onClick={dashboard.refresh}>
          Atualizar métricas
        </button>
      </div>
      {dashboard.loading ? (
        <p role="status">Carregando resultados…</p>
      ) : dashboard.error ? (
        <div role="alert">
          <p>{dashboard.error}</p>
          <button onClick={dashboard.refresh}>Tentar novamente</button>
        </div>
      ) : (
        data && (
          <>
            <section
              className="dashboard-metrics"
              aria-label="Métricas da organização"
            >
              {[
                [
                  "Pessoas que curtiram no mês",
                  data.pessoas_curtiram,
                  "Cada pessoa é contada uma vez, mesmo curtindo vários posts.",
                ],
                [
                  "Curtidas no mês",
                  data.curtidas_mes,
                  "Curtidas que continuam ativas no período.",
                ],
                [
                  "Pessoas que favoritaram",
                  data.pessoas_favoritaram_total,
                  "Total atual de clientes que favoritaram sua empresa.",
                ],
                [
                  "Novos favoritos no mês",
                  data.novos_favoritos_mes,
                  "Favoritos com data conhecida que continuam ativos.",
                ],
              ].map(([label, value, copy]) => (
                <article key={String(label)}>
                  <p>{label}</p>
                  <strong>{value}</strong>
                  <small>{copy}</small>
                </article>
              ))}
            </section>
            <section className="dashboard-best">
              <h2>Post mais curtido no mês</h2>
              {data.post_mais_curtido ? (
                <div>
                  {data.post_mais_curtido.vincularImagem && (
                    <img
                      src={getImageUrl(data.post_mais_curtido.vincularImagem)}
                      alt={data.post_mais_curtido.titulo}
                    />
                  )}
                  <div>
                    <h3>{data.post_mais_curtido.titulo}</h3>
                    <p>{data.post_mais_curtido.curtidas} curtidas no período</p>
                    {data.post_mais_curtido.status === "ARQUIVADO" && (
                      <p>Publicação arquivada</p>
                    )}
                  </div>
                </div>
              ) : (
                <p>Nenhum post recebeu curtidas neste mês.</p>
              )}
            </section>
            {data.favoritos_sem_data > 0 && (
              <p className="dashboard-note">
                {data.favoritos_sem_data} pessoas têm favoritos antigos sem data
                registrada. Elas entram no total atual, mas não nos novos
                favoritos do mês.
              </p>
            )}
            <p className="dashboard-note">
              Os resultados consideram curtidas e favoritos que continuam
              ativos. Datas seguem o calendário configurado no banco de dados.
              Em caso de empate, aparece o post mais recente.
            </p>
          </>
        )
      )}
    </main>
  );
}
