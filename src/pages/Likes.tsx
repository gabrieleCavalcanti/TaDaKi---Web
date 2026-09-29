import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, Heart, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/feed/EmptyState";
import { PostCard } from "../components/feed/PostCard";
import type { PostRegistro } from "../components/feed/types";
import { apiFetch } from "../services/api";
import "../css/Feed.css";

export function Likes() {
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState<PostRegistro[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadLikes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [likesResponse, postsResponse, orgResponse] = await Promise.all([
        apiFetch<{ likes: Array<{ id_post: number }> }>("/likes/meus"),
        apiFetch<{ posts: PostRegistro[] }>("/posts"),
        apiFetch<any>("/pessoas?tipo=ORGANIZACAO"),
      ]);

      const likedIds = new Set(
        (likesResponse?.likes ?? []).map((like) => Number(like.id_post)),
      );

      const organizations =
        orgResponse?.funcionarios ?? orgResponse?.pessoas ?? orgResponse?.data ?? [];
      const organizationMap = new Map(
        organizations.map((org: any) => [Number(org.id_pessoa), org]),
      );

      setLikedPosts(
        (postsResponse?.posts ?? [])
          .filter((post) => likedIds.has(Number(post.id_post)))
          .map((post) => {
            const org: any = organizationMap.get(Number(post.id_organizacao));
            return {
              ...post,
              id_pessoa_organizacao: Number(org?.id_pessoa ?? post.id_organizacao),
              nome_organizacao: org?.nome ?? post.nome_organizacao,
              foto_organizacao:
                org?.foto ?? org?.foto_perfil ?? org?.imagem_perfil ??
                org?.imagem ?? org?.avatar ?? post.foto_organizacao,
            };
          }),
      );
    } catch (requestError) {
      setLikedPosts([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar os curtidos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLikes();
  }, [loadLikes]);

  const removeLike = useCallback(async (idPost: number) => {
    try {
      const response = await apiFetch<{ curtiu: boolean }>("/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ id_post: idPost }),
      });

      if (!response.curtiu) {
        setLikedPosts((current) =>
          current.filter((post) => post.id_post !== idPost),
        );
      }
    } catch (requestError) {
      window.alert(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível remover a curtida.",
      );
    }
  }, []);

  const filteredLikes = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return likedPosts;

    return likedPosts.filter((post) =>
      `${post.titulo} ${post.descricao ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [likedPosts, search]);

  const clearSearch = useCallback(() => {
    setSearch("");
    searchInputRef.current?.focus();
  }, []);

  return (
    <main className="feed-page">
      <section className="feed-shell">
        <div className="back-row">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={20} /> Voltar para o feed
          </button>
        </div>

        <div className="feed-hero">
          <div>
            <p className="feed-eyebrow">Sua seleção</p>
            <h1>Publicações curtidas</h1>
            <p>Encontre rapidamente os conteúdos que você marcou.</p>
          </div>
        </div>

        <div className="feed-toolbar">
          <label className="search-field">
            <Search size={20} color="#6d7782" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar nos curtidos..."
              aria-label="Buscar publicações curtidas"
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
            {filteredLikes.length}{" "}
            {filteredLikes.length === 1 ? "curtido" : "curtidos"}
          </span>
        </div>

        {loading ? (
          <EmptyState
            title="Carregando curtidos"
            description="Consultando suas curtidas na API."
          />
        ) : error ? (
          <EmptyState
            title="Não foi possível carregar os curtidos"
            description={error}
            actionLabel="Tentar novamente"
            onAction={() => void loadLikes()}
          />
        ) : filteredLikes.length === 0 ? (
          <EmptyState
            icon={<Heart size={48} />}
            title={search ? "Nenhum curtido encontrado" : "Você ainda não curtiu nenhuma publicação"}
            description={
              search
                ? "Tente outra palavra ou limpe a busca."
                : "As publicações que você curtir no feed aparecerão aqui."
            }
            actionLabel={search ? "Limpar busca" : "Explorar publicações"}
            onAction={search ? clearSearch : () => navigate("/")}
          />
        ) : (
          <div className="post-list">
            {filteredLikes.map((post) => (
              <PostCard
                key={post.id_post}
                post={post}
                liked
                onLike={removeLike}
                compact
                onOpenOrganization={(id) => navigate(`/perfil/${id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
