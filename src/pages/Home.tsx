import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Heart, Menu, Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import { EmptyState } from "../components/feed/EmptyState";
import { PostCard } from "../components/feed/PostCard";
import type {
  PostRegistro,
  UsuarioLogado,
} from "../components/feed/types";
import { useAuth } from "../hooks/useAuth";
import { apiFetch, getProfilePhoto } from "../services/api";
import "../css/Feed.css";

export function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [posts, setPosts] = useState<PostRegistro[]>([]);
  const [search, setSearch] = useState("");
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [likeTotals, setLikeTotals] = useState<Record<number, number>>({});
  const [user, setUser] = useState<UsuarioLogado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // useRef: foco direto no campo sem causar nova renderização.
  const searchInputRef = useRef<HTMLInputElement>(null);
  // useRef: evita atualizar estado se a tela já tiver sido desmontada.
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // useCallback: a função é reutilizada pelo efeito e pelo botão "Tentar novamente".
  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [meResponse, postsResponse, likesResponse, orgResponse] = await Promise.all([
        apiFetch<{ user: UsuarioLogado }>("/auth/me"),
        apiFetch<{ posts: PostRegistro[] }>("/posts"),
        apiFetch<{ likes: Array<{ id_post: number }> }>("/likes/meus"),
        apiFetch<any>("/pessoas?tipo=ORGANIZACAO"),
      ]);

      const organizations =
        orgResponse?.funcionarios ?? orgResponse?.pessoas ?? orgResponse?.data ?? [];
      const organizationMap = new Map(
        organizations.map((org: any) => [Number(org.id_pessoa), org]),
      );

      const receivedPosts = (postsResponse?.posts ?? []).map((post) => {
        const org: any = organizationMap.get(Number(post.id_organizacao));
        return {
          ...post,
          id_pessoa_organizacao: Number(org?.id_pessoa ?? post.id_organizacao),
          nome_organizacao: org?.nome ?? post.nome_organizacao,
          foto_organizacao:
            org?.foto ?? org?.foto_perfil ?? org?.imagem_perfil ??
            org?.imagem ?? org?.avatar ?? post.foto_organizacao,
        };
      });

      let completeUser: UsuarioLogado = meResponse?.user ?? ({} as UsuarioLogado);
      if (completeUser?.id_pessoa_login) {
        try {
          const personResponse = await apiFetch<any>(
            `/pessoas?id=${completeUser.id_pessoa_login}`,
          );
          const person = personResponse?.pessoaId?.[0];
          if (person) {
            completeUser = {
              ...completeUser,
              nome: person.nome ?? completeUser.username,
              foto:
                person.foto ?? person.foto_perfil ?? person.imagem_perfil ??
                person.imagem ?? person.avatar ?? null,
            };
          }
        } catch {}
      }

      const totals = await Promise.all(
        receivedPosts.map(async (post) => {
          try {
            const response = await apiFetch<{ total: number }>(
              `/likes/contar?id_post=${post.id_post}`,
            );
            return [post.id_post, Number(response.total) || 0] as const;
          } catch {
            return [post.id_post, 0] as const;
          }
        }),
      );

      if (!mountedRef.current) return;

      setUser(completeUser ?? null);
      setPosts(receivedPosts);
      setLikedIds(
        (likesResponse?.likes ?? []).map((like) => Number(like.id_post)),
      );
      setLikeTotals(Object.fromEntries(totals));
    } catch (requestError) {
      if (!mountedRef.current) return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar as publicações.",
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  // useCallback: mantém o handler estável ao ser enviado para cada PostCard.
  const handleLike = useCallback(async (idPost: number) => {
    try {
      const response = await apiFetch<{
        curtiu: boolean;
        totalLikes: number;
      }>("/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ id_post: idPost }),
      });

      setLikedIds((current) =>
        response.curtiu
          ? current.includes(idPost)
            ? current
            : [...current, idPost]
          : current.filter((id) => id !== idPost),
      );

      setLikeTotals((current) => ({
        ...current,
        [idPost]: Number(response.totalLikes) || 0,
      }));
    } catch (requestError) {
      window.alert(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível registrar a curtida.",
      );
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearch("");
    searchInputRef.current?.focus();
  }, []);

  // useMemo: busca e contagem só são recalculadas quando posts/search mudam.
  const filteredPosts = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return posts;

    return posts.filter((post) =>
      `${post.titulo} ${post.descricao ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [posts, search]);

  const normalizedUserType = useMemo(
    () =>
      String(user?.tipo ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim(),
    [user?.tipo],
  );

  const canCreatePost = normalizedUserType === "ORGANIZACAO";

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  return (
    <main className="feed-page">
      <header className="feed-header">
        <img className="feed-logo" src={logo} alt="TaDaKi" />

        <div className="feed-header__actions">
          <button
            type="button"
            className="user-profile-button"
            title="Meu perfil"
            aria-label="Abrir meu perfil"
            onClick={() => user?.id_pessoa_login && navigate(`/perfil/${user.id_pessoa_login}`)}
          >
            <div className="org-avatar">
              {getProfilePhoto(user) ? (
                <img src={getProfilePhoto(user)} alt="" />
              ) : (
                <span>{(user?.nome || user?.username || "U").charAt(0).toUpperCase()}</span>
              )}
            </div>
          </button>
          {canCreatePost && (
            <button
              type="button"
              className="icon-button icon-button--green"
              title="Criar publicação"
              aria-label="Criar publicação"
              onClick={() =>
                window.alert(
                  "Perfil de organização identificado. A criação de post está habilitada.",
                )
              }
            >
              <Plus size={22} />
            </button>
          )}

          <button
            type="button"
            className="icon-button"
            title="Abrir menu"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <section className="feed-shell">
        <div className="feed-hero">
          <div>
            <p className="feed-eyebrow">Comunidade TaDaKi</p>
            <h1>Olá, {user?.nome || user?.username || "usuário"}!</h1>
            <p>Descubra as publicações mais recentes das organizações.</p>
          </div>
        </div>

        <div className="feed-toolbar">
          <label className="search-field">
            <Search size={20} color="#6d7782" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título ou descrição..."
              aria-label="Buscar publicações"
            />
            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={clearSearch}
                aria-label="Limpar busca"
              >
                <X size={18} />
              </button>
            )}
          </label>

          <span className="result-count">
            {filteredPosts.length}{" "}
            {filteredPosts.length === 1 ? "publicação" : "publicações"}
          </span>
        </div>

        {loading ? (
          <EmptyState
            title="Carregando publicações"
            description="Buscando os dados mais recentes da API."
          />
        ) : error ? (
          <EmptyState
            title="Não foi possível carregar o feed"
            description={error}
            actionLabel="Tentar novamente"
            onAction={() => void loadFeed()}
          />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={<Search size={42} />}
            title={search ? "Nenhum resultado encontrado" : "Nenhuma publicação disponível"}
            description={
              search
                ? "Tente pesquisar usando outras palavras."
                : "Quando houver novas publicações, elas aparecerão aqui."
            }
            actionLabel={search ? "Limpar busca" : undefined}
            onAction={search ? clearSearch : undefined}
          />
        ) : (
          <div className="post-list">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id_post}
                post={post}
                liked={likedIds.includes(post.id_post)}
                likeCount={likeTotals[post.id_post] ?? 0}
                onLike={handleLike}
                onOpenOrganization={(id) => navigate(`/perfil/${id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {menuOpen && (
        <div
          className="menu-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setMenuOpen(false);
          }}
        >
          <aside className="menu-panel" aria-label="Menu principal">
            <div className="menu-panel__top">
              <strong>Menu</strong>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <X size={22} />
              </button>
            </div>
            <nav>
              <button type="button" onClick={() => navigate("/")}>
                Início
              </button>
              <button
                type="button"
                onClick={() => user?.id_pessoa_login && navigate(`/perfil/${user.id_pessoa_login}`)}
              >
                Meu perfil
              </button>
              <button type="button" onClick={() => navigate("/likes")}>
                Curtidos
              </button>
              <button type="button" onClick={() => navigate("/favoritos")}>
                Favoritos
              </button>
              <button type="button" onClick={() => void handleLogout()}>
                Sair
              </button>
            </nav>
          </aside>
        </div>
      )}
    </main>
  );
}
