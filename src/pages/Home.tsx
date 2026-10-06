import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Heart, ImagePlus, Menu, Plus, Search, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import "../css/Feed.css";
import { useAuth } from "../hooks/useAuth";
import { apiFetch, getImageUrl } from "../services/api";

type Post = {
  id_post: number;
  vincularImagem?: string | null;
  titulo: string;
  descricao?: string | null;
  id_categoria: number;
  id_organizacao: number;
  id_pessoa_organizacao?: number;
  nome_organizacao?: string;
  foto_organizacao?: string | null;
};

type Pessoa = {
  id_pessoa?: number;
  id_organizacao?: number;
  nome?: string;
  tipo?: string;
  foto?: string | null;
  foto_perfil?: string | null;
  imagem_perfil?: string | null;
  imagem?: string | null;
  avatar?: string | null;
};

type Categoria = {
  id_categoria: number;
  descricao: string;
};

type LikeState = {
  curtiu: boolean;
  total: number;
};

type FavoritoState = {
  favoritado: boolean;
  id_favorito?: number;
};

function fotoPessoa(pessoa?: Pessoa | null) {
  return (
    pessoa?.foto ??
    pessoa?.foto_perfil ??
    pessoa?.imagem_perfil ??
    pessoa?.imagem ??
    pessoa?.avatar ??
    null
  );
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalPostAberto, setModalPostAberto] = useState(false);
  const [usuarioCompleto, setUsuarioCompleto] = useState<Pessoa | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    number | null
  >(null);
  const [imagem, setImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [erroPublicacao, setErroPublicacao] = useState("");
  const [likes, setLikes] = useState<Record<number, LikeState>>({});
  const [favoritos, setFavoritos] = useState<Record<number, FavoritoState>>({});

  const buscaRef = useRef<HTMLInputElement>(null);
  const imagemRef = useRef<HTMLInputElement>(null);

  // ID da pessoa/logins da pessoa autenticada
  const idPessoaLogada =
    Number((user as any)?.id_pessoa) ||
    Number((user as any)?.id_pessoa_login) ||
    Number((user as any)?.id) ||
    0;

  // ID correto da organização
  const idOrganizacaoLogada = Number(usuarioCompleto?.id_organizacao ?? 0);

  const tipoUsuario = useMemo(() => {
    return String((user as any)?.tipo ?? usuarioCompleto?.tipo ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }, [user, usuarioCompleto]);

  const podeCriarPost = tipoUsuario === "ORGANIZACAO";

  const carregarPosts = useCallback(async () => {
    setLoadingPosts(true);
    setErro("");

    try {
      const resposta = await apiFetch<any>("/posts");
      console.log("POSTS:", resposta);

      const lista: Post[] = Array.isArray(resposta?.posts)
        ? resposta.posts
        : Array.isArray(resposta)
          ? resposta
          : [];

      setPosts(lista);

      try {
        const respostaPessoas = await apiFetch<any>(
          "/pessoas?tipo=ORGANIZACAO",
        );

        console.log("ORGANIZAÇÕES:", respostaPessoas);

        const organizacoes: Pessoa[] =
          respostaPessoas?.funcionarios ??
          respostaPessoas?.pessoas ??
          respostaPessoas?.data ??
          [];

        if (Array.isArray(organizacoes)) {
          const mapa = new Map<number, Pessoa>();

          organizacoes.forEach((org) => {
            if (org.id_organizacao) {
              mapa.set(Number(org.id_organizacao), org);
            }
          });

          setPosts(
            lista.map((post) => {
              const org = mapa.get(Number(post.id_organizacao));

              return {
                ...post,
                id_pessoa_organizacao: org?.id_pessoa,
                nome_organizacao:
                  org?.nome ??
                  post.nome_organizacao ??
                  `Organização ${post.id_organizacao}`,
                foto_organizacao:
                  fotoPessoa(org) ?? post.foto_organizacao ?? null,
              };
            }),
          );
        }
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);

      setPosts([]);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as publicações.",
      );
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const carregarCategorias = useCallback(async () => {
    setLoadingCategorias(true);

    try {
      const resposta = await apiFetch<any>("/categorias");

      const lista: Categoria[] = Array.isArray(resposta?.categorias)
        ? resposta.categorias
        : [];

      setCategorias(lista);

      if (lista.length > 0) {
        setCategoriaSelecionada(
          (atual) => atual ?? Number(lista[0].id_categoria),
        );
      }
    } catch (error) {
      console.error(error);

      setErroPublicacao(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as categorias.",
      );
    } finally {
      setLoadingCategorias(false);
    }
  }, []);

  useEffect(() => {
    carregarPosts();
  }, [carregarPosts]);

  useEffect(() => {
    if (!idPessoaLogada) return;

    apiFetch<any>(`/pessoas?id=${idPessoaLogada}`)
      .then((resposta) => {
        console.log("PESSOA LOGADA:", resposta);

        const pessoa =
          resposta?.pessoaId?.[0] ??
          resposta?.pessoa ??
          resposta?.data?.[0] ??
          null;

        console.log("USUARIO COMPLETO:", pessoa);

        setUsuarioCompleto(pessoa);
      })
      .catch((error) => console.error(error));
  }, [idPessoaLogada]);

  useEffect(() => {
    if (!modalPostAberto) return;

    carregarCategorias();
  }, [modalPostAberto, carregarCategorias]);

  useEffect(() => {
    if (!imagem) {
      setPreviewImagem("");
      return;
    }

    const url = URL.createObjectURL(imagem);
    setPreviewImagem(url);

    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  useEffect(() => {
    if (posts.length === 0) return;

    Promise.all(
      posts.map(async (post) => {
        try {
          const [verificacao, contagem] = await Promise.all([
            apiFetch<any>(`/likes/verificar?id_post=${post.id_post}`),
            apiFetch<any>(`/likes/contar?id_post=${post.id_post}`),
          ]);

          return [
            post.id_post,
            {
              curtiu: Boolean(verificacao?.curtiu),
              total: Number(contagem?.total ?? contagem?.totalLikes ?? 0),
            },
          ] as const;
        } catch {
          return [
            post.id_post,
            {
              curtiu: false,
              total: 0,
            },
          ] as const;
        }
      }),
    ).then((resultado) => {
      setLikes(Object.fromEntries(resultado));
    });
  }, [posts]);

  const abrirModalPost = () => {
    setTitulo("");
    setDescricao("");
    setCategoriaSelecionada(null);
    setImagem(null);
    setErroPublicacao("");
    setModalPostAberto(true);
  };

  const fecharModalPost = () => {
    if (publicando) return;

    setModalPostAberto(false);
    setTitulo("");
    setDescricao("");
    setCategoriaSelecionada(null);
    setImagem(null);
    setErroPublicacao("");
  };

  const publicar = async (event: React.FormEvent) => {
    event.preventDefault();
    setErroPublicacao("");

    if (!titulo.trim()) {
      setErroPublicacao("Digite o título da publicação.");
      return;
    }

    if (!categoriaSelecionada) {
      setErroPublicacao("Selecione uma categoria.");
      return;
    }

    // Agora verificamos o ID da ORGANIZAÇÃO
    if (!idOrganizacaoLogada) {
      setErroPublicacao(
        "Não foi possível identificar a organização autenticada.",
      );
      return;
    }

    if (!imagem) {
      setErroPublicacao("Escolha uma imagem para a publicação.");
      return;
    }

    if (!["image/png", "image/jpeg"].includes(imagem.type)) {
      setErroPublicacao("A imagem precisa ser PNG ou JPEG.");
      return;
    }

    if (imagem.size > 10 * 1024 * 1024) {
      setErroPublicacao("A imagem deve ter no máximo 10 MB.");
      return;
    }

    const formData = new FormData();

    formData.append("titulo", titulo.trim());
    formData.append("descricao", descricao.trim());
    formData.append("id_categoria", String(categoriaSelecionada));

    console.log("ID PESSOA:", idPessoaLogada);
    console.log("ID ORGANIZAÇÃO:", idOrganizacaoLogada);
    console.log("USUÁRIO COMPLETO:", usuarioCompleto);
    formData.append("id_organizacao", String(idOrganizacaoLogada));

    formData.append("image", imagem);

    console.log("PUBLICANDO POST:", {
      idPessoaLogada,
      idOrganizacaoLogada,
      idCategoria: categoriaSelecionada,
      titulo: titulo.trim(),
    });

    setPublicando(true);

    try {
      await apiFetch("/posts", {
        method: "POST",
        body: formData,
      });

      setModalPostAberto(false);
      setTitulo("");
      setDescricao("");
      setCategoriaSelecionada(null);
      setImagem(null);

      await carregarPosts();
    } catch (error) {
      console.error(error);

      setErroPublicacao(
        error instanceof Error ? error.message : "Não foi possível publicar.",
      );
    } finally {
      setPublicando(false);
    }
  };

  const alternarLike = useCallback(async (idPost: number) => {
    try {
      const resposta = await apiFetch<any>("/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ id_post: idPost }),
      });

      setLikes((atual) => ({
        ...atual,
        [idPost]: {
          curtiu: Boolean(resposta?.curtiu),
          total: Number(
            resposta?.totalLikes ??
              resposta?.total ??
              atual[idPost]?.total ??
              0,
          ),
        },
      }));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const alternarFavorito = useCallback(
    async (idOrganizacao: number) => {
      const atual = favoritos[idOrganizacao];

      try {
        if (atual?.favoritado && atual.id_favorito) {
          await apiFetch(`/Favoritos/${atual.id_favorito}`, {
            method: "DELETE",
          });

          setFavoritos((estado) => ({
            ...estado,
            [idOrganizacao]: {
              favoritado: false,
            },
          }));

          return;
        }

        if (!idPessoaLogada) return;

        const resposta = await apiFetch<any>("/Favoritos", {
          method: "POST",
          body: JSON.stringify({
            id_cliente: idPessoaLogada,
            id_organizacao: idOrganizacao,
          }),
        });

        const idFavorito = Number(
          resposta?.novoRegistro?.insertId ??
            resposta?.id_favorito ??
            resposta?.id ??
            0,
        );

        setFavoritos((estado) => ({
          ...estado,
          [idOrganizacao]: {
            favoritado: true,
            id_favorito: idFavorito || undefined,
          },
        }));
      } catch (error) {
        console.error(error);
      }
    },
    [favoritos, idPessoaLogada],
  );

  const postsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return posts;

    return posts.filter((post) =>
      [post.titulo, post.descricao, post.nome_organizacao]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [posts, busca]);

  const abrirMeuPerfil = useCallback(() => {
    if (!idPessoaLogada) return;

    if (tipoUsuario === "ORGANIZACAO") {
      navigate(`/perfil/${idPessoaLogada}`);
    } else if (tipoUsuario === "CLIENTE") {
      navigate("/perfil-pessoal");
    }
  }, [idPessoaLogada, tipoUsuario, navigate]);

  const sair = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const nomeOrganizacao =
    usuarioCompleto?.nome ??
    (user as any)?.nome ??
    (user as any)?.username ??
    "Organização";

  if (authLoading) {
    return (
      <main className="feed-page">
        <div className="feed-state">
          <strong>Carregando...</strong>
        </div>
      </main>
    );
  }

  return (
    <main className="feed-page">
      <header className="feed-header">
        <img className="feed-logo" src={logo} alt="TaDaKi" />

        <div className="feed-header__actions">
          {podeCriarPost && (
            <button
              type="button"
              className="icon-button icon-button--green"
              title="Criar publicação"
              aria-label="Criar publicação"
              onClick={abrirModalPost}
            >
              <Plus size={22} />
            </button>
          )}

          <button
            type="button"
            className="icon-button"
            title="Menu"
            aria-label="Abrir menu"
            onClick={() => setMenuAberto(true)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <section className="feed-shell">
        <div className="feed-hero">
          <div>
            <p className="feed-eyebrow">TaDaKi</p>
            <h1>Publicações</h1>
            <p>Veja as publicações das organizações.</p>
          </div>
        </div>

        <div className="feed-toolbar">
          <label className="search-field">
            <Search size={19} />

            <input
              ref={buscaRef}
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar publicação..."
            />

            {busca && (
              <button
                type="button"
                className="clear-search"
                onClick={() => {
                  setBusca("");
                  buscaRef.current?.focus();
                }}
                aria-label="Limpar busca"
              >
                <X size={18} />
              </button>
            )}
          </label>

          <span className="result-count">
            {postsFiltrados.length} publicação
            {postsFiltrados.length === 1 ? "" : "ões"}
          </span>
        </div>

        {loadingPosts ? (
          <div className="feed-state">
            <strong>Carregando publicações...</strong>
          </div>
        ) : erro ? (
          <div className="feed-state">
            <strong>Não foi possível carregar as publicações</strong>

            <span>{erro}</span>

            <button
              type="button"
              className="primary-button"
              onClick={carregarPosts}
            >
              Tentar novamente
            </button>
          </div>
        ) : postsFiltrados.length === 0 ? (
          <div className="feed-state">
            <strong>Nenhuma publicação encontrada</strong>

            <span>
              {busca
                ? "Tente outro termo de busca."
                : "Ainda não existem publicações disponíveis."}
            </span>
          </div>
        ) : (
          <div className="post-list">
            {postsFiltrados.map((post) => (
              <article className="post-card" key={post.id_post}>
                <button
                  type="button"
                  className="post-card__header post-card__profile-link"
                  onClick={() => {
                    if (post.id_pessoa_organizacao) {
                      navigate(`/perfil/${post.id_pessoa_organizacao}`);
                    }
                  }}
                >
                  <span className="org-avatar">
                    {post.foto_organizacao ? (
                      <img
                        src={getImageUrl(post.foto_organizacao)}
                        alt={post.nome_organizacao ?? "Organização"}
                      />
                    ) : (
                      (post.nome_organizacao ?? "O").charAt(0).toUpperCase()
                    )}
                  </span>

                  <span className="post-card__identity">
                    <strong>
                      {post.nome_organizacao ??
                        `Organização ${post.id_organizacao}`}
                    </strong>

                    <span>Categoria {post.id_categoria}</span>
                  </span>
                </button>

                <div className="post-card__copy">
                  <h2>{post.titulo}</h2>

                  {post.descricao && <p>{post.descricao}</p>}
                </div>

                {post.vincularImagem ? (
                  <div className="post-card__media">
                    <img
                      src={getImageUrl(post.vincularImagem)}
                      alt={post.titulo}
                    />
                  </div>
                ) : (
                  <div className="post-card__image-fallback">
                    <span>Publicação sem imagem</span>
                  </div>
                )}

                <div className="post-card__footer">
                  <div className="post-actions">
                    <button
                      type="button"
                      className={`like-button ${
                        likes[post.id_post]?.curtiu ? "is-liked" : ""
                      }`}
                      onClick={() => alternarLike(post.id_post)}
                    >
                      <Heart
                        size={19}
                        fill={
                          likes[post.id_post]?.curtiu ? "currentColor" : "none"
                        }
                      />

                      <span>
                        {likes[post.id_post]?.curtiu ? "Curtido" : "Curtir"}
                      </span>

                      <b>{likes[post.id_post]?.total ?? 0}</b>
                    </button>

                    <button
                      type="button"
                      className={`favorite-button ${
                        favoritos[post.id_organizacao]?.favoritado
                          ? "is-favorite"
                          : ""
                      }`}
                      onClick={() => alternarFavorito(post.id_organizacao)}
                    >
                      <Star
                        size={19}
                        fill={
                          favoritos[post.id_organizacao]?.favoritado
                            ? "currentColor"
                            : "none"
                        }
                      />

                      <span>
                        {favoritos[post.id_organizacao]?.favoritado
                          ? "Favoritada"
                          : "Favoritar organização"}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {menuAberto && (
        <div
          className="menu-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMenuAberto(false);
            }
          }}
        >
          <aside className="menu-panel">
            <div className="menu-panel__top">
              <strong>Menu</strong>

              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav>
              <button type="button" onClick={() => navigate("/")}>
                Início
              </button>

              <button type="button" onClick={abrirMeuPerfil}>
                Meu perfil
              </button>

              <button type="button" onClick={() => navigate("/likes")}>
                Curtidos
              </button>

              <button type="button" onClick={() => navigate("/favoritos")}>
                Favoritos
              </button>

              <button type="button" onClick={sair}>
                Sair da conta
              </button>
            </nav>
          </aside>
        </div>
      )}

      {modalPostAberto && (
        <div
          className="create-post-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharModalPost();
            }
          }}
        >
          <form className="create-post-modal" onSubmit={publicar}>
            <div className="create-post-header">
              <div>
                <h2>Nova publicação</h2>
                <p>Compartilhe algo com a comunidade.</p>
              </div>

              <button
                type="button"
                className="create-post-close"
                onClick={fecharModalPost}
                disabled={publicando}
                aria-label="Fechar"
              >
                <X size={25} />
              </button>
            </div>

            <label className="create-post-field">
              <span>Título *</span>

              <input
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="Digite o título da publicação"
                maxLength={150}
              />
            </label>

            <label className="create-post-field">
              <span>Descrição</span>

              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Digite uma descrição"
                rows={5}
              />
            </label>

            <div className="create-post-field">
              <span>Categoria *</span>

              {loadingCategorias ? (
                <div className="create-post-loading">
                  Carregando categorias...
                </div>
              ) : categorias.length === 0 ? (
                <div className="create-post-loading">
                  Nenhuma categoria encontrada.
                </div>
              ) : (
                <div className="create-post-categories">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.id_categoria}
                      type="button"
                      className={
                        categoriaSelecionada === Number(categoria.id_categoria)
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        setCategoriaSelecionada(Number(categoria.id_categoria))
                      }
                    >
                      {categoria.descricao}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="create-post-field">
              <span>Organização</span>

              <div className="create-post-organization">
                <strong>{nomeOrganizacao}</strong>

                <small>
                  O post será publicado automaticamente pela organização
                  autenticada.
                </small>
              </div>
            </div>

            <div className="create-post-field">
              <span>Imagem *</span>

              <input
                ref={imagemRef}
                className="create-post-file-input"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(event) => setImagem(event.target.files?.[0] ?? null)}
              />

              <button
                type="button"
                className="create-post-image-picker"
                onClick={() => imagemRef.current?.click()}
              >
                {previewImagem ? (
                  <img src={previewImagem} alt="Prévia" />
                ) : (
                  <span className="create-post-image-icon">
                    <ImagePlus size={25} />
                  </span>
                )}

                <span className="create-post-image-copy">
                  <strong>{imagem ? imagem.name : "Escolher imagem"}</strong>

                  <small>PNG ou JPEG, até 10 MB</small>
                </span>

                <span className="create-post-image-arrow">›</span>
              </button>
            </div>

            {erroPublicacao && (
              <div className="create-post-error">{erroPublicacao}</div>
            )}

            <button
              type="submit"
              className="create-post-submit"
              disabled={
                publicando || loadingCategorias || categorias.length === 0
              }
            >
              {publicando ? "Publicando..." : "Publicar"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
};
