import {
  Heart,
  Plus,
  Search,
  Star,
  X,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Home,
  UserRound,
  MapPin,
  Compass,
  Info,
  HelpCircle,
  Accessibility,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/Logo.png";
import { useAuth } from "../../hooks/useAuth";
import { getImageUrl } from "../../services/api";
import { filterPosts, userType, photo } from "./model";
import type { Post } from "./model";
import { useFeed } from "./useFeed";
import { useDiscovery } from "./useDiscovery";
import { RegionPicker } from "./RegionPicker";
import { proximity, proximityLabels } from "./recommendations";
import { useDialog } from "./useDialog";
import { CreatePostModal } from "./CreatePostModal";
import { PostCard } from "./PostCard";
import { ScrollReveal } from "./ScrollReveal";
import "../../css/Feed.css";

export function FeedScreen({ onlyLikes = false }: { onlyLikes?: boolean }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, logout } = useAuth();
  const feed = useFeed(user, onlyLikes);
  const [search, setSearch] = useState("");
  const [accessOpen, setAccessOpen] = useState(false);
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem("tadaki-font-scale") || "100"));
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("tadaki-high-contrast") === "true");
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem("tadaki-reduce-motion") === "true");
  useEffect(() => {
    document.documentElement.style.setProperty("--tadaki-access-font-scale", String(fontScale / 100));
    document.documentElement.classList.toggle("tadaki-high-contrast", highContrast);
    document.documentElement.classList.toggle("tadaki-reduce-motion", reduceMotion);
    localStorage.setItem("tadaki-font-scale", String(fontScale));
    localStorage.setItem("tadaki-high-contrast", String(highContrast));
    localStorage.setItem("tadaki-reduce-motion", String(reduceMotion));
    return () => {
      document.documentElement.classList.remove("tadaki-high-contrast", "tadaki-reduce-motion");
      document.documentElement.style.removeProperty("--tadaki-access-font-scale");
    };
  }, [fontScale, highContrast, reduceMotion]);
  const [signingOut, setSigningOut] = useState(false);
  const signOut = async () => {
    if (!window.confirm("Deseja realmente sair da sua conta?")) return;
    setSigningOut(true);
    try { await logout(); navigate("/login", {replace:true}); } finally { setSigningOut(false); }
  };
  const [category, setCategory] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(
    params.get("favoritos") === "1",
  );
  const [composerOpen, setComposerOpen] = useState(false);
  const [imagePost, setImagePost] = useState<Post | null>(null);
  const [limit, setLimit] = useState(12);
  const [businessLimit, setBusinessLimit] = useState(6);
  const [imageFailed, setImageFailed] = useState(false);
  const discovery = useDiscovery(
    Number(feed.person?.id_pessoa ?? feed.person?.id_pessoa_login ?? 0),
    feed.allPosts,
    feed.likedIds,
    feed.favorites,
    !onlyLikes && !favoritesOnly && !search.trim() && !category,
  );

  const imageRef = useRef<HTMLDivElement>(null);
  const closeImage = useCallback(() => setImagePost(null), []);
  const closeComposer = useCallback(() => setComposerOpen(false), []);
  useDialog(Boolean(imagePost), imageRef, closeImage);
  const type = userType(feed.person) || userType(user);
  const canCreate = type === "ORGANIZACAO";
  const canFavorite = type === "CLIENTE";
  const filtered = useMemo(
    () =>
      filterPosts(
        onlyLikes || favoritesOnly ? feed.posts : discovery.posts,
        search,
        category,
        favoritesOnly,
        feed.favorites,
      ),
    [
      feed.posts,
      discovery.posts,
      onlyLikes,
      search,
      category,
      favoritesOnly,
      feed.favorites,
    ],
  );
  const featured = useMemo(() => {
    const seen = new Set<number>();
    return filtered.filter(post => {
      if (seen.has(post.id_organizacao)) return false;
      seen.add(post.id_organizacao);
      return true;
    });
  }, [filtered]);
  // Organizações são entidades independentes: uma empresa recém-cadastrada
  // deve aparecer na descoberta mesmo sem ter criado nenhuma publicação.
  const discoveredOrganizations = useMemo(() => {
    if (onlyLikes || favoritesOnly) return [];
    const term = search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const active = feed.organizations.filter(org => {
      const name = String(org.nome ?? org.username ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return Number(org.id_pessoa) > 0 && name.includes(term);
    });
    return active.sort((a,b) => {
      const aPosts = feed.allPosts.filter(p => Number(p.id_organizacao) === Number(a.id_organizacao));
      const bPosts = feed.allPosts.filter(p => Number(p.id_organizacao) === Number(b.id_organizacao));
      return bPosts.length - aPosts.length;
    });
  }, [feed.organizations, feed.allPosts, search, onlyLikes, favoritesOnly]);
  const regionName = discovery.selectedAddress
    ? `${discovery.selectedAddress.municipio}, ${discovery.selectedAddress.uf}`
    : discovery.locations.user.length ? "Sua região cadastrada" : "Defina sua região";
  const title = onlyLikes
    ? "Minhas curtidas"
    : favoritesOnly
      ? "Suas empresas favoritas"
      : "Seu próximo achado está por perto";
  const timelineError = favoritesOnly && feed.favoritesError ? "Não foi possível carregar sua timeline. Atualize os favoritos para tentar novamente." : "";
  const goProfile = () => {
    if (type === "CLIENTE") {
      navigate("/perfil-pessoal");
      return;
    }
    if (type === "ORGANIZACAO") {
      const id = Number(
        user?.id_pessoa ?? user?.id_pessoa_login ??
        feed.person?.id_pessoa ?? feed.person?.id_pessoa_login,
      );
      if (Number.isSafeInteger(id) && id > 0) {
        navigate(`/perfil/${id}`);
      } else {
        feed.setNotice("Não foi possível identificar seu perfil. Atualize a página e tente novamente.");
      }
      return;
    }
    feed.setNotice("Não foi possível identificar o tipo da sua conta. Atualize a página e tente novamente.");
  };
  return (
    <main className="feed-page">
      <a className="tadaki-skip-link" href="#tadaki-publicacoes">Pular para as publicações</a>
      <header
        className="feed-header"
        inert={composerOpen || Boolean(imagePost)}
      >
        <button
          className="logo-button"
          onClick={() => {
            navigate("/");
            setFavoritesOnly(false);
          }}
          aria-label="Página inicial"
        >
          <img className="feed-logo" src={logo} alt="TaDaKi" />
        </button>
        <label className="tadaki-header-search"><Search size={19} /><input aria-label="Buscar negócios e serviços" placeholder="Buscar negócios e serviços" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <div className="feed-header__actions">
          <div className="tadaki-access-wrap">
            <button type="button" className="feed-action tadaki-access-trigger" onClick={() => setAccessOpen(v => !v)} aria-label="Abrir opções de acessibilidade" aria-expanded={accessOpen} aria-controls="tadaki-access-panel" title="Acessibilidade"><Accessibility size={22}/><span>Acessibilidade</span></button>
            {accessOpen && <section id="tadaki-access-panel" className="tadaki-access-panel" aria-label="Opções de acessibilidade">
              <div className="tadaki-access-heading"><strong>Acessibilidade</strong><button type="button" onClick={() => setAccessOpen(false)} aria-label="Fechar painel de acessibilidade">×</button></div>
              <p>Ajuste a leitura do TaDaKi.</p>
              <div className="tadaki-access-row"><span id="tadaki-font-label">Tamanho do texto: {fontScale}%</span><div className="tadaki-access-font-actions"><button type="button" aria-label="Diminuir tamanho do texto" disabled={fontScale <= 100} onClick={() => setFontScale(v => Math.max(100, v - 10))}>A−</button><button type="button" aria-label="Aumentar tamanho do texto" disabled={fontScale >= 150} onClick={() => setFontScale(v => Math.min(150, v + 10))}>A+</button></div></div>
              <label className="tadaki-access-row"><span>Alto contraste</span><input type="checkbox" checked={highContrast} onChange={e => setHighContrast(e.target.checked)}/></label>
              <label className="tadaki-access-row"><span>Reduzir animações</span><input type="checkbox" checked={reduceMotion} onChange={e => setReduceMotion(e.target.checked)}/></label>
              <button type="button" className="tadaki-access-reset" onClick={() => {setFontScale(100);setHighContrast(false);setReduceMotion(false);}}>Restaurar padrão</button>
            </section>}
          </div>
          {canCreate && !onlyLikes && (
            <button
              className="feed-action create-button"
              aria-label="Criar publicação"
              title="Criar publicação"
              onClick={() => setComposerOpen(true)}
            >
              <Plus size={21} /> <span>Criar publicação</span>
            </button>
          )}
        </div>
      </header>
      <section
        className="feed-shell"
        inert={composerOpen || Boolean(imagePost)}
      >
        <nav className="tadaki-side-nav" aria-label="Menu principal">
          <button className={!onlyLikes ? "active" : ""} onClick={() => navigate("/")}><Home size={20}/> Início</button>
          <button className={onlyLikes ? "active" : ""} onClick={() => navigate("/likes")}><Heart size={20}/> Minhas curtidas</button>
          <button onClick={goProfile}><UserRound size={20}/> Meu perfil</button>
          {canCreate && <button onClick={() => navigate("/dashboard")}><BarChart3 size={20}/> Dashboard</button>}
          <hr/>
          <button onClick={() => navigate("/sobre")}><Info size={20}/> Sobre o TaDaKi</button>
          <button onClick={() => navigate("/ajuda")}><HelpCircle size={20}/> Ajuda</button>
          <hr/><button className="tadaki-exit" disabled={signingOut} onClick={()=>void signOut()}><LogOut size={20}/> {signingOut ? "Saindo..." : "Sair da conta"}</button>
        </nav>
        {onlyLikes && (
          <button className="back-button" onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
            Voltar para o feed
          </button>
        )}
        <div className="feed-heading">
          <div>
            <p className="feed-eyebrow">
              {onlyLikes ? "CURTIDOS" : "VITRINE LOCAL"}
            </p>
            <h1>{title}</h1>
            <p>
              {onlyLikes
                ? "Reencontre os produtos e serviços que chamaram sua atenção."
                : "Descubra e apoie negócios locais que fazem a sua região mais especial."}
            </p>
          </div>
          <button
            className="feed-action"
            disabled={feed.loading}
            title="Atualizar publicações"
            aria-label="Atualizar publicações"
            onClick={() => void feed.load()}
          >
            <RefreshCw size={18} className={feed.loading ? "spin" : ""} />
          </button>
        </div>
        {!onlyLikes && (
          <div className="discovery-controls">
            <div className="category-filters" aria-label="Modo da vitrine">
              <button
                className={!favoritesOnly ? "selected" : ""}
                aria-pressed={!favoritesOnly}
                onClick={() => {
                  setFavoritesOnly(false);
                  setLimit(12);
                }}
              >
                Para você
              </button>

              {canFavorite && (
                <button
                  className={favoritesOnly ? "selected" : ""}
                  aria-pressed={favoritesOnly}
                  onClick={() => {
                    setFavoritesOnly(true);
                    setLimit(12);
                  }}
                >
                  Favoritas
                </button>
              )}
            </div>
            {favoritesOnly ? (
              <p>
                Timeline somente das empresas que você favoritou, das
                publicações mais recentes para as mais antigas.
              </p>
            ) : (
              <>
                <p>
                  {discovery.locating
                    ? "Ordenando por proximidade…"
                    : !discovery.locations.user.length
                      ? "Defina sua região para descobrir negócios por proximidade."
                      : discovery.selectedAddress
                        ? `Região escolhida: ${discovery.selectedAddress.municipio} / ${discovery.selectedAddress.uf}.`
                        : "Perto do seu endereço cadastrado: rua, bairro, cidade e estado."}
                </p>
                <RegionPicker
                  initial={discovery.locations.user[0]}
                  save={discovery.saveReference}
                />
                {!favoritesOnly && !discovery.hasInterests && (
                  <p>
                    Curta produtos, amplie fotos ou visite empresas para
                    personalizar sua vitrine.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div className="feed-toolbar">
          <label className="search-field">
            <Search size={20} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setLimit(12);
              }}
              placeholder={
                onlyLikes
                  ? "Buscar nos seus curtidos"
                  : "Buscar produto, empresa ou categoria"
              }
              aria-label="Buscar publicações"
            />
            {search && (
              <button aria-label="Limpar busca" onClick={() => setSearch("")}>
                <X size={17} />
              </button>
            )}
          </label>
          <span className="result-count">
            {feed.loading
              ? "Carregando…"
              : `${filtered.length} ${filtered.length === 1 ? "publicação" : "publicações"}`}
          </span>
        </div>
        <div className="category-filters" aria-label="Filtrar por categoria">
          <button
            aria-pressed={!category}
            className={!category ? "selected" : ""}
            onClick={() => {
              setCategory(0);
              setLimit(12);
            }}
          >
            Todas
          </button>
          {feed.categories.map((item) => (
            <button
              key={item.id_categoria}
              aria-pressed={category === Number(item.id_categoria)}
              className={
                category === Number(item.id_categoria) ? "selected" : ""
              }
              onClick={() => {
                setCategory(Number(item.id_categoria));
                setLimit(12);
              }}
            >
              {item.descricao}
            </button>
          ))}
        </div>
        {feed.notice && (
          <div className="feed-notice" role="status">
            <span>{feed.notice}</span>
            <button
              className="feed-action"
              aria-label="Fechar aviso"
              onClick={() => feed.setNotice("")}
            >
              <X size={17} />
            </button>
          </div>
        )}
        {!onlyLikes && !favoritesOnly && (
          <section className="tadaki-nearby" aria-label="Organizações da comunidade">
            <div className="tadaki-section-title"><h2>Negócios para descobrir</h2><span>{regionName}</span></div>
            {discoveredOrganizations.length ? <div className="tadaki-nearby-grid">{discoveredOrganizations.slice(0, businessLimit).map(org => {
              const orgPost = feed.allPosts.find(post => Number(post.id_organizacao) === Number(org.id_organizacao));
              const cover = orgPost?.vincularImagem || photo(org);
              return <div key={org.id_pessoa} className="tadaki-nearby-card">
                <button className="tadaki-nearby-item" aria-label={`Conhecer ${org.nome || org.username || "organização"}`} onClick={() => navigate(`/perfil/${org.id_pessoa}`)}>
                  {cover ? <img src={getImageUrl(cover)} alt="" loading="lazy"/> : <span className="tadaki-nearby-placeholder"><Compass/></span>}
                  <span><strong>{org.nome || org.username || "Organização"}</strong><small>{orgPost?.descricao_categoria || "Negócio local"}</small><small><MapPin size={12}/> {orgPost ? "Ver perfil e publicações" : "Conheça esta organização"}</small></span>
                </button>
                {canFavorite && <button type="button" className="tadaki-nearby-favorite" aria-pressed={Boolean(feed.favorites[Number(org.id_organizacao)]?.favoritado)} aria-label={`${feed.favorites[Number(org.id_organizacao)]?.favoritado ? "Remover dos favoritos" : "Favoritar"}: ${org.nome || org.username}`} disabled={feed.pending.has(`favorite:${Number(org.id_organizacao)}`) || !Number(org.id_organizacao)} onClick={() => void feed.toggleFavorite(Number(org.id_organizacao))}><Star size={19} fill={feed.favorites[Number(org.id_organizacao)]?.favoritado ? "currentColor" : "none"}/></button>}
                {feed.favoriteErrors[Number(org.id_organizacao)] && <small role="alert" className="post-favorite-error">{feed.favoriteErrors[Number(org.id_organizacao)]}</small>}
              </div>;
            })}</div> : <p>Nenhuma organização encontrada para sua busca.</p>}
            {discoveredOrganizations.length > businessLimit && <button type="button" className="tadaki-business-more" onClick={() => setBusinessLimit(n => n + 6)}>Ver mais negócios <ChevronRight size={18}/></button>}
          </section>
        )}
        <div className="feed-layout">
          <section
            className="feed-main"
            id="tadaki-publicacoes" tabIndex={-1}
            aria-label={onlyLikes ? "Publicações curtidas" : "Publicações"}
            aria-busy={feed.loading}
          >
            {feed.loading ? (
              <div
                className="skeleton-list"
                aria-label="Carregando publicações"
                role="status"
              >
                {[0, 1].map((index) => (
                  <div className="post-skeleton" key={index}>
                    <div className="skeleton skeleton-header" />
                    <div className="skeleton skeleton-media" />
                    <div className="skeleton skeleton-copy" />
                  </div>
                ))}
              </div>
            ) : feed.error || timelineError ? (
              <div className="feed-state">
                <h2>Não foi possível carregar</h2>
                <p>{feed.error || timelineError}</p>
                <button
                  className="primary-button"
                  onClick={() => void feed.load()}
                >
                  Tentar novamente
                </button>
              </div>
            ) : !filtered.length ? (
              <div className="feed-state">
                <Heart size={42} />
                <h2>
                  {search || category
                    ? "Nenhuma publicação encontrada"
                    : onlyLikes
                      ? "Suas próximas descobertas ficam aqui"
                      : favoritesOnly
                        ? "Sua timeline começa com uma empresa favorita"
                        : "A vitrine está esperando novidades"}
                </h2>
                <p>
                  {onlyLikes
                    ? "Curta uma publicação no feed e reencontre o produto aqui."
                    : favoritesOnly ? "Favorite uma organização no Para você para acompanhar as publicações dela aqui." : "Explore outros termos ou volte para todas as publicações."}
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    if (onlyLikes) navigate("/");
                    else {
                      setSearch("");
                      setCategory(0);
                      setFavoritesOnly(false);
                    }
                  }}
                >
                  {onlyLikes ? "Explorar publicações" : "Ver todas"}
                </button>
              </div>
            ) : (
              <div className="post-list">
                {filtered.slice(0, limit).map((post) => (
                  <ScrollReveal key={post.id_post}>
                    {!onlyLikes &&
                      !favoritesOnly &&
                      !discovery.locating &&
                      discovery.locations.user.length > 0 && (
                        <p className="proximity-label">
                          {
                            proximityLabels[
                              proximity(
                                discovery.locations.user,
                                discovery.locations.organizations[
                                  post.id_organizacao
                                ] ?? [],
                              )
                            ]
                          }
                        </p>
                      )}
                    <PostCard
                      post={post}
                      liked={feed.likedIds.has(post.id_post)}
                      likeCount={feed.counts[post.id_post]}
                      favorite={Boolean(
                        feed.favorites[post.id_organizacao]?.favoritado,
                      )}
                      busyLike={feed.pending.has(`like:${post.id_post}`)}
                      busyFavorite={feed.pending.has(
                        `favorite:${post.id_organizacao}`,
                      )}
                      canFavorite={canFavorite}
                      favoriteError={feed.favoriteErrors[post.id_organizacao]}
                      onLike={(id) => void feed.toggleLike(id)}
                      onFavorite={(id) => void feed.toggleFavorite(id)}
                      onOpenOrganization={(id) => {
                        discovery.record(post, "profile");
                        navigate(`/perfil/${id}`);
                      }}
                      onOpenImage={(post) => {
                        discovery.record(post, "image");
                        setImageFailed(false);
                        setImagePost(post);
                      }}
                    />
                  </ScrollReveal>
                ))}
                {filtered.length > limit && (
                  <button
                    className="load-more"
                    onClick={() => setLimit((previous) => previous + 12)}
                  >
                    Mostrar mais publicações
                  </button>
                )}
              </div>
            )}
          </section>
          <aside className="feed-sidebar">
            <section className="tadaki-region-panel">
              <h2>Sua região</h2>
              <p className="tadaki-region-title"><MapPin size={19}/>{regionName}</p>
              <p>Descubra negócios da sua rua, bairro, cidade e estado, conforme os endereços cadastrados.</p>
              <div className="tadaki-region-map" aria-label="Ilustração de localização; não é um mapa de navegação"><MapPin size={35}/><span>Negócios perto de você</span></div>
              <RegionPicker initial={discovery.locations.user[0]} save={discovery.saveReference}/>
            </section>
            <section className="tadaki-highlights">
              <h2>Negócios em destaque na sua região</h2>
              {featured.slice(0, 4).map(post => <button key={post.id_organizacao} className="tadaki-highlight" disabled={!post.id_pessoa_organizacao} onClick={() => navigate(`/perfil/${post.id_pessoa_organizacao}`)}>
                {post.vincularImagem ? <img src={getImageUrl(post.vincularImagem)} alt=""/> : <span className="tadaki-highlight-fallback"><Compass/></span>}
                <span><strong>{post.nome_organizacao}</strong><small>{post.descricao_categoria || "Negócio local"}</small></span><ChevronRight size={18}/>
              </button>)}
              {!featured.length && <p>Explore organizações da sua região, mesmo que ainda não tenham publicações.</p>}
            </section>
            {canCreate && !onlyLikes && <div className="business-note"><h3>Mostre seu trabalho à região</h3><p>Uma boa foto ajuda seus produtos a serem descobertos.</p><button className="primary-button" onClick={() => setComposerOpen(true)}><Plus size={18}/> Criar publicação</button></div>}
          </aside>
        </div>
      </section>
      {imagePost && (
        <div
          className="image-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeImage();
          }}
        >
          <div
            className="image-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={imagePost.titulo}
            ref={imageRef}
          >
            <button
              className="image-close"
              onClick={closeImage}
              aria-label="Fechar imagem"
            >
              <X />
            </button>
            {imageFailed ? (
              <p>Não foi possível abrir esta imagem.</p>
            ) : (
              <img
                src={getImageUrl(imagePost.vincularImagem)}
                alt={imagePost.titulo}
                onError={() => setImageFailed(true)}
              />
            )}
            <p>{imagePost.titulo}</p>
          </div>
        </div>
      )}
      {canCreate && !onlyLikes && (
        <CreatePostModal
          open={composerOpen}
          onClose={closeComposer}
          person={feed.person}
          categories={feed.categories}
          onPublished={async () => {
            setFavoritesOnly(false);
            await feed.load();
          }}
        />
      )}
    </main>
  );
}
