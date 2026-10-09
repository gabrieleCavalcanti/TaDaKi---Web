import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../services/api";
import { enrichPosts, rows, userType } from "./model";
import type { Category, FavoriteMap, Person, Post } from "./model";

export function useFeed(user: Person | null, onlyLikes: boolean) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [person, setPerson] = useState<Person | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [favorites, setFavorites] = useState<FavoriteMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [favoritesError, setFavoritesError] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const pendingRef = useRef(new Set<string>());
  const touchedCounts = useRef(new Set<number>());
  const generation = useRef(0);
  const id = Number(user?.id_pessoa ?? user?.id_pessoa_login ?? 0);
  const cacheKey = `tadaki:favorites:${id}`;
  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    setNotice("");
    touchedCounts.current.clear();
    try {
      const [postResponse, likesResponse] = await Promise.all([
        apiFetch("/posts"),
        apiFetch("/likes/meus"),
      ]);
      const optional = await Promise.allSettled([
        apiFetch("/categorias"),
        apiFetch("/pessoas?tipo=ORGANIZACAO"),
        apiFetch(`/pessoas?id=${id}`),
        userType(user) === "CLIENTE"
          ? apiFetch("/Favoritos")
          : Promise.resolve({ resultadoSelecionaTodos: [] }),
        apiFetch("/pessoas?tipo=CLIENTE"),
      ]);
      if (current !== generation.current) return;
      const cats =
        optional[0].status === "fulfilled"
          ? rows<Category>(optional[0].value, ["categorias", "data"])
          : [];
      const orgs =
        optional[1].status === "fulfilled"
          ? rows<Person>(optional[1].value, ["funcionarios", "pessoas", "data"])
          : [];
      const me =
        optional[2].status === "fulfilled"
          ? (rows<Person>(optional[2].value, [
              "pessoaId",
              "pessoas",
              "data",
            ])[0] ?? (optional[2].value as { pessoa?: Person }).pessoa)
          : null;
      const client =
        optional[4].status === "fulfilled"
          ? rows<Person>(optional[4].value, [
              "clientes",
              "pessoas",
              "data",
            ]).find((item) => Number(item.id_pessoa) === id)
          : null;
      const currentPerson = {
        ...user,
        ...me,
        id_cliente: client?.id_cliente ?? me?.id_cliente,
      };
      const hydrated = enrichPosts(
        rows<Post>(postResponse, ["posts", "data"]),
        orgs,
        cats,
      );
      setPosts(hydrated);
      setCategories(cats);
      setPerson(currentPerson);
      setLikedIds(
        new Set(
          rows<{ id_post: number }>(likesResponse, ["likes"]).map((like) =>
            Number(like.id_post),
          ),
        ),
      );
      let stored: FavoriteMap = {};
      if (optional[3].status === "fulfilled") {
        stored = {};
        for (const item of rows<{
          id_cliente?: number;
          id_organizacao?: number;
          id_favorito: number;
        }>(optional[3].value, ["resultadoSelecionaTodos", "favoritos"])) {
          if (
            item.id_organizacao && item.id_favorito
          )
            stored[item.id_organizacao] = {
              favoritado: true,
              id_favorito: item.id_favorito,
            };
        }
      }
      setFavorites(stored);
      setFavoritesError(optional[3].status === "rejected");
      if (optional[3].status === "rejected") setNotice("Não foi possível carregar suas empresas favoritas. Atualize o feed para tentar novamente.");
      else if (optional.some((result) => result.status === "rejected"))
        setNotice(
          "Algumas informações complementares não carregaram. Você pode tentar atualizar o feed.",
        );
      // Limit concurrent count requests. The posts can be displayed before these finish.
      let cursor = 0;
      const totals: Record<number, number> = {};
      setLoading(false);
      await Promise.all(
        Array.from({ length: Math.min(4, hydrated.length) }, async () => {
          while (cursor < hydrated.length) {
            const post = hydrated[cursor++];
            try {
              const count = await apiFetch<{ total: number }>(
                `/likes/contar?id_post=${post.id_post}`,
              );
              totals[post.id_post] = Number(count.total ?? 0);
            } catch {
              /* omit unavailable counts */
            }
          }
        }),
      );
      if (current === generation.current)
        setCounts((previous) => ({
          ...totals,
          ...Object.fromEntries(
            Object.entries(previous).filter(([key]) =>
              touchedCounts.current.has(Number(key)),
            ),
          ),
        }));
    } catch (cause) {
      if (current === generation.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar as publicações.",
        );
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [id, user]);
  useEffect(() => {
    const currentGeneration = generation;
    void load();
    return () => {
      currentGeneration.current++;
    };
  }, [load]);
  const lock = (key: string) => {
    if (pendingRef.current.has(key)) return false;
    pendingRef.current.add(key);
    setPending(new Set(pendingRef.current));
    return true;
  };
  const unlock = (key: string) => {
    pendingRef.current.delete(key);
    setPending(new Set(pendingRef.current));
  };
  const toggleLike = async (postId: number) => {
    const key = `like:${postId}`;
    if (!lock(key)) return;
    touchedCounts.current.add(postId);
    const wasLiked = likedIds.has(postId);
    const oldCount = counts[postId];
    setLikedIds((previous) => {
      const next = new Set(previous);
      if (wasLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    if (oldCount !== undefined)
      setCounts((previous) => ({
        ...previous,
        [postId]: Math.max(0, oldCount + (wasLiked ? -1 : 1)),
      }));
    try {
      const result = await apiFetch<{ curtiu: boolean; totalLikes: number }>(
        "/likes/toggle",
        { method: "POST", body: JSON.stringify({ id_post: postId }) },
      );
      setLikedIds((previous) => {
        const next = new Set(previous);
        if (result.curtiu) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setCounts((previous) => ({
        ...previous,
        [postId]: Number(result.totalLikes),
      }));
    } catch (cause) {
      setLikedIds((previous) => {
        const next = new Set(previous);
        if (wasLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      if (oldCount !== undefined)
        setCounts((previous) => ({ ...previous, [postId]: oldCount }));
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar a curtida.",
      );
    } finally {
      unlock(key);
    }
  };
  const toggleFavorite = async (orgId: number) => {
    const key = `favorite:${orgId}`;
    if (!lock(key)) return;
    try {
      const existing = favorites[orgId];
      let updated: FavoriteMap;
      if (existing?.favoritado && existing.id_favorito) {
        await apiFetch(`/Favoritos/${existing.id_favorito}`, {
          method: "DELETE",
        });
        updated = { ...favorites, [orgId]: { favoritado: false } };
      } else {
        const result = await apiFetch<{
          novoRegistro?: { insertId?: number };
          id_favorito?: number;
        }>("/Favoritos", {
          method: "POST",
          body: JSON.stringify({
            id_organizacao: orgId,
          }),
        });
        const favoriteId = Number(
          result.novoRegistro?.insertId ?? result.id_favorito,
        );
        if (!favoriteId)
          throw new Error(
            "A API não retornou o identificador do favorito. Atualize antes de tentar novamente.",
          );
        updated = {
          ...favorites,
          [orgId]: { favoritado: true, id_favorito: favoriteId },
        };
      }
      // Merge concurrent changes for different organizations.
      setFavorites((previous) => {
        const next = { ...previous, [orgId]: updated[orgId] };
        localStorage.setItem(cacheKey, JSON.stringify(next));
        return next;
      });
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar o favorito.",
      );
    } finally {
      unlock(key);
    }
  };
  return {
    allPosts: posts,
    posts: onlyLikes
      ? posts.filter((post) => likedIds.has(Number(post.id_post)))
      : posts,
    categories,
    person,
    likedIds,
    counts,
    favorites,
    favoritesError,
    loading,
    error,
    notice,
    setNotice,
    pending,
    load,
    toggleLike,
    toggleFavorite,
  };
}
