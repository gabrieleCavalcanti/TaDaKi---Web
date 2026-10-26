import { ArrowLeft, CalendarDays, Heart, ImageOff, Info, RefreshCw, Star, Trophy, Users } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getImageUrl } from "../services/api";
import { userType } from "../components/feed/model";
import { useDashboard } from "../components/dashboard/useDashboard";
import { currentMonth, monthLabel } from "../components/dashboard/model";
import { AppShell } from "../components/AppShell";
import "../css/Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const allowed = userType(user) === "ORGANIZACAO";
  const dashboard = useDashboard(allowed, Number(user?.id_pessoa ?? user?.id_pessoa_login ?? 0));
  if (!allowed) return <Navigate to="/" replace />;
  const data = dashboard.data;
  const number = (value: number) => value.toLocaleString("pt-BR");
  const metrics = data ? [
    { label: "Pessoas que curtiram", value: data.pessoas_curtiram, copy: "Pessoas únicas que curtiram seus posts neste mês.", Icon: Users, accent: "blue" },
    { label: "Curtidas no mês", value: data.curtidas_mes, copy: "Curtidas do período que continuam ativas.", Icon: Heart, accent: "red" },
    { label: "Sua organização nos favoritos", value: data.pessoas_favoritaram_total, copy: "Total atual de clientes que favoritaram sua organização.", Icon: Star, accent: "blue" },
    { label: "Novos favoritos no mês", value: data.novos_favoritos_mes, copy: "Favoritos ativos com data registrada neste mês.", Icon: CalendarDays, accent: "red" },
  ] : [];
  return (
    <AppShell ativo="dashboard">
    <main className="organization-dashboard">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          {/* <button className="dashboard-back" onClick={() => navigate("/")}><ArrowLeft size={17} /> Voltar para o feed</button> */}
          <span className="dashboard-brand">TaDaKi <span>/ Sua organização</span></span>
        </header>
        <section className="dashboard-heading">
          <div>
            <p className="dashboard-eyebrow">RESULTADOS DO SEU NEGÓCIO</p>
            <h1>Seu negócio, em números.</h1>
            <p>Acompanhe quem interage com seus posts e mantém sua organização por perto.</p>
          </div>
          <label className="dashboard-month">
            <span><CalendarDays size={16} /> Mês de referência</span>
            <input type="month" aria-label="Mês de referência" min="2000-01" max={currentMonth()} value={dashboard.month} onChange={(event) => { if (event.target.value) dashboard.setMonth(event.target.value); }} />
          </label>
        </section>
        <div className="dashboard-period">
          <div><span className="dashboard-period-dot" /> <h2>{monthLabel(dashboard.month)}</h2></div>
          <button onClick={dashboard.refresh} disabled={dashboard.loading}><RefreshCw size={16} className={dashboard.loading ? "dashboard-spin" : ""} /> Atualizar métricas</button>
        </div>
        {dashboard.loading ? (
          <div role="status" className="dashboard-loading">
            <RefreshCw size={24} className="dashboard-spin" /> <p>Carregando resultados…</p>
          </div>
        ) : dashboard.error ? (
          <div role="alert" className="dashboard-error"><Info size={24} /><p>{dashboard.error}</p><button onClick={dashboard.refresh}>Tentar novamente</button></div>
        ) : data && (
          <>
            <section className="dashboard-metrics" aria-label="Métricas da organização">
              {metrics.map(({ label, value, copy, Icon, accent }) => (
                <article key={label} className={`dashboard-metric dashboard-metric--${accent}`}>
                  <div className="dashboard-metric-top"><span className="dashboard-metric-icon"><Icon size={22} /></span><span>{accent === "red" ? "Neste mês" : label === "Pessoas que curtiram" ? "Neste mês" : "Total atual"}</span></div>
                  <p>{label}</p><strong>{number(value)}</strong><small>{copy}</small>
                </article>
              ))}
            </section>
            <section className="dashboard-best">
              <div className="dashboard-best-heading"><span className="dashboard-trophy"><Trophy size={22} /></span><div><p className="dashboard-eyebrow">DESTAQUE DO PERÍODO</p><h2>Seu post mais curtido</h2></div></div>
              {data.post_mais_curtido ? (
                <div className="dashboard-best-body">
                  <div className="dashboard-best-media">
                    {data.post_mais_curtido.vincularImagem ? <img src={getImageUrl(data.post_mais_curtido.vincularImagem)} alt={data.post_mais_curtido.titulo} /> : <ImageOff size={38} />}
                  </div>
                  <div className="dashboard-best-copy">
                    <span className="dashboard-post-label">PUBLICAÇÃO EM DESTAQUE</span>
                    <h3>{data.post_mais_curtido.titulo}</h3>
                    <p>O post que recebeu mais curtidas no mês selecionado.</p>
                    <span className="dashboard-like-badge"><Heart size={18} /> {number(data.post_mais_curtido.curtidas)} {data.post_mais_curtido.curtidas === 1 ? "curtida" : "curtidas"} no período</span>
                    {data.post_mais_curtido.status === "ARQUIVADO" && <p className="dashboard-archived">Publicação arquivada</p>}
                  </div>
                </div>
              ) : (
                <div className="dashboard-empty"><Heart size={30} /><h3>Seu próximo destaque começa com um post.</h3><p>Nenhum post recebeu curtidas neste mês. Acompanhe os resultados após as primeiras interações.</p><button onClick={() => navigate("/")}>Ir para o feed</button></div>
              )}
            </section>
            <aside className="dashboard-note"><Info size={19} /><div><strong>Como esses números são contados</strong><p>Consideramos curtidas e favoritos que continuam ativos. Cada pessoa é contada uma vez no card de pessoas. Em caso de empate no destaque, aparece o post mais recente.</p><p>As datas seguem o calendário configurado no banco de dados.</p>{data.favoritos_sem_data > 0 && <p>{number(data.favoritos_sem_data)} favoritos antigos sem data entram no total atual, mas não nos novos favoritos do mês.</p>}</div></aside>
          </>
        )}
      </div>
    </main>
    </AppShell>
  );
}
