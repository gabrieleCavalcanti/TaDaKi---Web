import { Heart, ImageOff } from "lucide-react";
import { useState } from "react";
import { getImageUrl } from "../../services/api";
import type { PostRegistro } from "./types";

interface PostCardProps {
  post: PostRegistro;
  liked: boolean;
  likeCount?: number;
  onLike: (idPost: number) => void;
  compact?: boolean;
  onOpenOrganization?: (idPessoa: number) => void;
}

export function PostCard({
  post,
  liked,
  likeCount = 0,
  onLike,
  compact = false,
  onOpenOrganization,
}: PostCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const postImage = getImageUrl(post.vincularImagem);
  const avatarImage = getImageUrl(post.foto_organizacao);

  return (
    <article className={`post-card ${compact ? "post-card--compact" : ""}`}>
      <button
        type="button"
        className="post-card__header post-card__profile-link"
        onClick={() => onOpenOrganization?.(Number(post.id_pessoa_organizacao || post.id_organizacao))}
        aria-label={`Abrir perfil de ${post.nome_organizacao || "organização"}`}
      >
        <div className="org-avatar" aria-hidden="true">
          {avatarImage && !avatarFailed ? (
            <img
              src={avatarImage}
              alt=""
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <span>{(post.nome_organizacao || "O").charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="post-card__identity">
          <strong>
            {post.nome_organizacao || `Organização ${post.id_organizacao}`}
          </strong>
          <span>
            {post.descricao_categoria || `Categoria ${post.id_categoria}`}
          </span>
        </div>
      </button>

      <div className="post-card__copy">
        <h2>{post.titulo}</h2>
        {post.descricao && <p>{post.descricao}</p>}
      </div>

      {postImage && !imageFailed ? (
        <div className="post-card__media">
          <img
            src={postImage}
            alt={`Imagem da publicação ${post.titulo}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div className="post-card__image-fallback">
          <ImageOff size={30} />
          <span>Imagem indisponível</span>
        </div>
      )}

      <div className="post-card__footer">
        <button
          type="button"
          className={`like-button ${liked ? "is-liked" : ""}`}
          aria-pressed={liked}
          onClick={() => onLike(post.id_post)}
        >
          <Heart size={19} fill={liked ? "currentColor" : "none"} />
          <span>{liked ? "Curtido" : "Curtir"}</span>
          <b>{likeCount}</b>
        </button>
      </div>
    </article>
  );
}
