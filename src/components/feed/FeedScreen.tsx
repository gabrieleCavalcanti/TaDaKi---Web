import {
  Heart,
  Menu,
  Plus,
  Search,
  Star,
  X,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Home,
  UserRound,
  LogOut,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/Logo.png";
import { useAuth } from "../../hooks/useAuth";
import { getImageUrl } from "../../services/api";
import { filterPosts, userType } from "./model";
import type { Post } from "./model";
import { useFeed } from "./useFeed";
import { useDiscovery } from "./useDiscovery";
import { RegionPicker } from "./RegionPicker";
import { proximity, proximityLabels } from "./recommendations";
import { useDialog } from "./useDialog";
import { CreatePostModal } from "./CreatePostModal";
import { PostCard } from "./PostCard";
import "../../css/Feed.css";

export function FeedScreen({ onlyLikes = false }: { onlyLikes?: boolean }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, logout } = useAuth();
  const feed = useFeed(user, onlyLikes);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(
    params.get("favoritos") === "1",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [imagePost, setImagePost] = useState<Post | null>(null);
  const [limit, setLimit] = useState(12);
  const [imageFailed, setImageFailed] = useState(false);
  const [explore, setExplore] = useState(false);
  const discovery = useDiscovery(
    Number(feed.person?.id_pessoa ?? feed.person?.id_pessoa_login ?? 0),
    feed.allPosts,
    feed.likedIds,
    feed.favorites,
    !explore && !onlyLikes && !favoritesOnly && !search.trim() && !category,
  );

  const menuRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeImage = useCallback(() => setImagePost(null), []);
  const closeComposer = useCallback(() => setComposerOpen(false), []);
  useDialog(menuOpen, menuRef, closeMenu);
  useDialog(Boolean(imagePost), imageRef, closeImage);
  const type = userType(feed.person ?? user);
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
  const title = onlyLikes
    ? "Suas descobertas favoritas"
    : favoritesOnly
      ? "Empresas que você favoritou"
      : "Descubra quem faz acontecer";
  const timelineError = favoritesOnly && feed.favoritesError ? "Não foi possível carregar sua timeline. Atualize os favoritos para tentar novamente." : "";
  const goProfile = () => {
    closeMenu();
    const id = Number(user?.id_pessoa ?? user?.id_pessoa_login);
    navigate(canCreate ? `/perfil/${id}` : "/perfil-pessoal");
  };
  return (
    <main className="feed-page">
      <header
        className="feed-header"
        inert={menuOpen || composerOpen || Boolean(imagePost)}
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
        <span className="header-tagline">
          Pertinho de você. Feito por gente.
        </span>
        <div className="feed-header__actions">
          {canCreate && !onlyLikes && (
            <button
              className="feed-action create-button"
              aria-label="Criar publicação"
              title="Criar publicação"
              onClick={() => setComposerOpen(true)}
            >
              <Plus size={22} />
            </button>
          )}
          <button
            className="feed-action"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>
      <section
        className="feed-shell"
        inert={menuOpen || composerOpen || Boolean(imagePost)}
      >
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
                : "Produtos, serviços e histórias dos pequenos negócios."}
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
                className={!explore && !favoritesOnly ? "selected" : ""}
                aria-pressed={!explore && !favoritesOnly}
                onClick={() => {
                  setExplore(false);
                  setFavoritesOnly(false);
                  setLimit(12);
                }}
              >
                Para você
              </button>
              <button
                className={explore && !favoritesOnly ? "selected" : ""}
                aria-pressed={explore && !favoritesOnly}
                onClick={() => {
                  setExplore(true);
                  setFavoritesOnly(false);
                  setLimit(12);
                }}
              >
                Explorar
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
                {!explore && !favoritesOnly && !discovery.hasInterests && (
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
        <div className="feed-layout">
          <section
            className="feed-main"
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
                    : favoritesOnly ? "Favorite uma empresa na aba Explorar para acompanhar as publicações dela aqui." : "Explore outros termos ou volte para todas as publicações."}
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    if (onlyLikes) navigate("/");
                    else {
                      setSearch("");
                      setCategory(0);
                      setFavoritesOnly(false);
                      setExplore(true);
                    }
                  }}
                >
                  {onlyLikes ? "Explorar publicações" : "Ver todas"}
                </button>
              </div>
            ) : (
              <div className="post-list">
                {filtered.slice(0, limit).map((post) => (
                  <div key={post.id_post}>
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
                  </div>
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
            <div className="discovery-note">
              <span className="note-symbol">TaDaKi</span>
              <h2>O próximo achado pode estar ao lado.</h2>
              <p>
                Conheça os pequenos negócios e valorize quem faz parte da sua
                comunidade.
              </p>
              <div className="note-line" />
            </div>
            {canCreate && !onlyLikes && (
              <div className="business-note">
                <h3>Mostre o que seu negócio faz de melhor</h3>
                <p>
                  Uma boa foto e uma descrição clara ajudam seus produtos a
                  serem descobertos.
                </p>
                <button
                  className="primary-button"
                  onClick={() => setComposerOpen(true)}
                >
                  <Plus size={18} />
                  Criar publicação
                </button>
              </div>
            )}
            <small className="feed-footnote">
              Feito para aproximar pessoas e microempresas.
            </small>
          </aside>
        </div>
      </section>
      {menuOpen && (
        <div
          className="menu-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
        >
          <aside
            className="menu-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-title"
            ref={menuRef}
          >
            <div className="menu-panel__top">
              <h2 id="menu-title">Seu TaDaKi</h2>
              <button
                className="feed-action"
                aria-label="Fechar menu"
                onClick={closeMenu}
              >
                <X />
              </button>
            </div>
            <div className="menu-account">
              <span className="org-avatar">{(feed.person?.nome || user?.username || "T").charAt(0).toUpperCase()}</span>
              <div><strong>{feed.person?.nome || user?.username || "Sua conta"}</strong><span>{canCreate ? "Organização" : "Cliente"}</span></div>
            </div>
            <p className="menu-section-label">NAVEGAÇÃO</p>
            <nav aria-label="Menu principal">
              <button
                aria-current={!onlyLikes && !favoritesOnly ? "page" : undefined}
                onClick={() => {
                  closeMenu();
                  navigate("/");
                  setFavoritesOnly(false);
                  setExplore(false);
                }}
              >
                <Home size={19} />
                Início
              </button>
              <button onClick={goProfile}><UserRound size={19} />Meu perfil</button>
              <button
                aria-current={onlyLikes ? "page" : undefined}
                onClick={() => {
                  closeMenu();
                  navigate("/likes");
                }}
              >
                <Heart size={19} />
                Curtidos
              </button>
              {canCreate && (
                <button
                  onClick={() => {
                    closeMenu();
                    navigate("/dashboard");
                  }}
                >
                  <BarChart3 size={19} />
                  Dashboard
                </button>
              )}
              {canFavorite && (
                <button
                  aria-current={favoritesOnly && !onlyLikes ? "page" : undefined}
                  onClick={() => {
                    closeMenu();
                    if (onlyLikes) navigate("/?favoritos=1");
                    else setFavoritesOnly(true);
                  }}
                >
                  <Star size={19} />
                  Favoritos
                </button>
              )}
              <p className="menu-section-label">CONTA</p>
              <button
                className="logout-button"
                onClick={() => {
                  void logout().then(() => navigate("/login"));
                }}
              >
                <LogOut size={19} />
                Sair da conta
              </button>
            </nav>
          </aside>
        </div>
      )}
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
            setExplore(true);
            await feed.load();
          }}
        />
      )}
    </main>
  );
}
