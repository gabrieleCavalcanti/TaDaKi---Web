import { Heart, ImageOff, Star, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { getImageUrl } from "../../services/api";
import type { Post } from "./model";
export function PostCard({
  post,
  liked,
  likeCount,
  favorite,
  busyLike,
  busyFavorite,
  canFavorite,
  favoriteError,
  onLike,
  onFavorite,
  onOpenOrganization,
  onOpenImage,
}: {
  post: Post;
  liked: boolean;
  likeCount?: number;
  favorite: boolean;
  busyLike: boolean;
  busyFavorite: boolean;
  canFavorite: boolean;
  favoriteError?: string;
  onLike: (id: number) => void;
  onFavorite: (id: number) => void;
  onOpenOrganization: (id: number) => void;
  onOpenImage: (post: Post) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const openOrg = () =>
    post.id_pessoa_organizacao &&
    onOpenOrganization(post.id_pessoa_organizacao);
  return (
    <article className="post-card">
      <div className="post-card__header">
        <button
          className="org-link"
          onClick={openOrg}
          disabled={!post.id_pessoa_organizacao}
          aria-label={`Abrir perfil de ${post.nome_organizacao}`}
        >
          <span className="org-avatar">
            {post.foto_organizacao && !avatarFailed ? (
              <img
                src={getImageUrl(post.foto_organizacao)}
                alt=""
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              post.nome_organizacao?.charAt(0).toUpperCase() || "T"
            )}
          </span>
          <span className="post-card__identity">
            <strong>{post.nome_organizacao}</strong>
            <span>Pequenos negócios, grandes descobertas</span>
          </span>
        </button>
            <button
              className={`social-button favorite-button ${favorite ? "is-favorite" : ""}`}
              aria-label={
                !canFavorite
                  ? "Favoritar organização — disponível para contas de cliente"
                  : favorite
                  ? `Remover ${post.nome_organizacao} dos favoritos`
                  : `Favoritar ${post.nome_organizacao}`
              }
              aria-pressed={favorite}
              disabled={busyFavorite || !canFavorite}
              title={!canFavorite ? "Use uma conta de cliente para favoritar organizações" : undefined}
              onClick={() => onFavorite(post.id_organizacao)}
            >
              <Star size={16} fill={favorite ? "currentColor" : "none"} />
              <span>{busyFavorite ? "Salvando…" : favorite ? "Favoritada" : "Favoritar"}</span>
            </button>
        <span className="category-badge">{post.descricao_categoria}</span>
        {favoriteError && <p className="post-favorite-error" role="alert">{favoriteError}</p>}
      </div>
      <button
        className="post-card__media"
        disabled={!post.vincularImagem || imageFailed}
        onClick={() => onOpenImage(post)}
        aria-label={`Ampliar imagem de ${post.titulo}`}
      >
        {post.vincularImagem && !imageFailed ? (
          <img
            src={getImageUrl(post.vincularImagem)}
            alt={post.titulo}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="image-fallback">
            <ImageOff size={30} />
            Imagem indisponível
          </span>
        )}
        {!imageFailed && post.vincularImagem && (
          <span className="image-hint">Ampliar foto</span>
        )}
      </button>
      <div className="post-card__footer">
        <div className="post-actions">
          <button
            className={`social-button ${liked ? "is-liked" : ""}`}
            aria-label={
              liked
                ? `Remover curtida de ${post.titulo}`
                : `Curtir ${post.titulo}`
            }
            aria-pressed={liked}
            disabled={busyLike}
            onClick={() => onLike(post.id_post)}
          >
            <Heart size={24} fill={liked ? "currentColor" : "none"} />
            <span>
              {likeCount === undefined
                ? liked
                  ? "Curtido"
                  : "Curtir"
                : `${likeCount} ${likeCount === 1 ? "curtida" : "curtidas"}`}
            </span>
          </button>

        </div>
        <div className="post-card__copy">
          <h2>{post.titulo}</h2>
          {post.descricao && (
            <>
              <p
                className={
                  expanded || post.descricao.length <= 160 ? "" : "clamped-copy"
                }
              >
                {post.descricao}
              </p>
              {post.descricao.length > 160 && (
                <button
                  className="text-button"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Mostrar menos" : "Ver descrição completa"}
                </button>
              )}
            </>
          )}
        </div>
        <button
          className="business-link"
          disabled={!post.id_pessoa_organizacao}
          onClick={openOrg}
        >
          Conhecer a empresa <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}
