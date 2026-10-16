import { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    ImageOff,
    Heart,
    Store,
    Archive,
    MoreVertical,
} from "lucide-react";
import {
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";

import { BASE_URL } from "../services/api";
import "../css/VisualizarPost.css";

interface IPost {
    id_post?: number;
    vincularImagem?: string;
    titulo?: string;
    descricao?: string;
    id_categoria?: number;
    status?: string;
    id_organizacao?: number;
    nome_organizacao?: string;
    nome?: string;
}

interface IOrganizacao {
    id_pessoa?: number;
    id_organizacao?: number;
    nome?: string;
}

interface ILikeState {
    curtiu: boolean;
    totalLikes: number;
}

function usuarioEhOrganizacao(): boolean {
    const chaves = [
        "usuario",
        "user",
        "usuarioLogado",
        "dadosUsuario",
    ];

    for (const armazenamento of [localStorage, sessionStorage]) {
        for (const chave of chaves) {
            const valor = armazenamento.getItem(chave);

            if (!valor) continue;

            try {
                const usuario = JSON.parse(valor);

                const tipo = String(
                    usuario?.tipo_usuario ??
                    usuario?.tipoUsuario ??
                    usuario?.tipo ??
                    usuario?.perfil ??
                    ""
                )
                    .trim()
                    .toUpperCase();

                if (
                    [
                        "ORGANIZACAO",
                        "ORGANIZAÇÃO",
                        "ORGANIZATION",
                    ].includes(tipo)
                ) {
                    return true;
                }
            } catch {
                // Ignora valores inválidos.
            }
        }
    }

    return false;
}

function obterIdOrganizacaoLogada(): number | null {
    const chaves = [
        "usuario",
        "user",
        "usuarioLogado",
        "dadosUsuario",
    ];

    for (const armazenamento of [localStorage, sessionStorage]) {
        for (const chave of chaves) {
            const valor = armazenamento.getItem(chave);

            if (!valor) continue;

            try {
                const usuario = JSON.parse(valor);

                const id = Number(
                    usuario?.id_organizacao ??
                    usuario?.idOrganizacao ??
                    usuario?.organizacao?.id_organizacao ??
                    usuario?.organizacao?.id
                );

                if (Number.isInteger(id) && id > 0) {
                    return id;
                }
            } catch {
                // Ignora valores inválidos.
            }
        }
    }

    return null;
}

export default function VisualizarPost() {
    const { id_post } = useParams<{ id_post: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const idOrganizacao = searchParams.get("id_organizacao");

    const [posts, setPosts] = useState<IPost[]>([]);
    const [nomeEmpresa, setNomeEmpresa] = useState("");
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    const [imagensIndisponiveis, setImagensIndisponiveis] =
        useState<number[]>([]);

    const [likes, setLikes] = useState<
        Record<number, ILikeState>
    >({});

    const [likesCarregando, setLikesCarregando] = useState<
        Record<number, boolean>
    >({});

    const [erroLike, setErroLike] = useState("");
    const [mensagemSucesso, setMensagemSucesso] = useState("");
    const [menuAberto, setMenuAberto] = useState<number | null>(null);
    const [arquivando, setArquivando] = useState<number | null>(null);
    const [erroArquivar, setErroArquivar] = useState("");

    const usuarioPodeCurtir = true;
    const ehOrganizacao = usuarioEhOrganizacao();

    const postSelecionadoRef = useRef<HTMLElement>(null);

    useEffect(() => {
        let cancelado = false;

        async function carregarPosts() {
            try {
                setLoading(true);
                setErro("");

                if (!id_post || !idOrganizacao) {
                    throw new Error(
                        "Não foi possível identificar o post ou a empresa."
                    );
                }

                const resposta = await fetch(
                    `${BASE_URL}/posts/organizacao?id_organizacao=${encodeURIComponent(idOrganizacao)}`,
                    { credentials: "include" }
                );

                if (!resposta.ok) {
                    throw new Error(
                        "Não foi possível carregar os posts."
                    );
                }

                const data = await resposta.json();

                const lista =
                    data?.posts ??
                    data?.data ??
                    data?.dados ??
                    data;

                if (!Array.isArray(lista)) {
                    throw new Error("A lista de posts é inválida.");
                }

                const postsOrganizacao = lista.filter(
                    (post: IPost) =>
                        Number(post.id_organizacao) ===
                        Number(idOrganizacao)
                );

                const selecionadoExiste = postsOrganizacao.some(
                    (post: IPost) =>
                        Number(post.id_post) === Number(id_post)
                );

                if (!selecionadoExiste) {
                    throw new Error(
                        "O post selecionado não foi encontrado."
                    );
                }

                if (!cancelado) {
                    setPosts(postsOrganizacao);
                    setImagensIndisponiveis([]);
                    setLikes({});

                    const postComNome = postsOrganizacao.find(
                        (post: IPost) =>
                            post.nome_organizacao || post.nome
                    );

                    if (postComNome) {
                        setNomeEmpresa(
                            postComNome.nome_organizacao ||
                            postComNome.nome ||
                            ""
                        );
                    }
                }

                try {
                    const respostaEmpresa = await fetch(
                        `${BASE_URL}/pessoas?tipo=ORGANIZACAO`,
                        { credentials: "include" }
                    );

                    if (respostaEmpresa.ok) {
                        const dadosEmpresa =
                            await respostaEmpresa.json();

                        const listaPessoas =
                            dadosEmpresa?.funcionarios ??
                            dadosEmpresa?.pessoas ??
                            dadosEmpresa?.dados ??
                            dadosEmpresa?.data ??
                            [];

                        if (Array.isArray(listaPessoas)) {
                            const empresa = listaPessoas.find(
                                (pessoa: IOrganizacao) =>
                                    Number(pessoa.id_organizacao) ===
                                    Number(idOrganizacao)
                            );

                            if (!cancelado && empresa?.nome) {
                                setNomeEmpresa(empresa.nome);
                            }
                        }
                    }
                } catch (error) {
                    console.error(
                        "Não foi possível carregar o nome da empresa:",
                        error
                    );
                }
            } catch (error) {
                if (!cancelado) {
                    setErro(
                        error instanceof Error
                            ? error.message
                            : "Erro ao carregar os posts."
                    );
                }
            } finally {
                if (!cancelado) {
                    setLoading(false);
                }
            }
        }

        void carregarPosts();

        return () => {
            cancelado = true;
        };
    }, [id_post, idOrganizacao]);

    useEffect(() => {
        if (loading || posts.length === 0) return;

        let cancelado = false;

        async function carregarLikes() {
            const resultados = await Promise.all(
                posts.map(async (post) => {
                    const id = Number(post.id_post);

                    if (!id || id <= 0) return null;

                    try {
                        const respostaContagem = await fetch(
                            `${BASE_URL}/likes/contar?id_post=${id}`,
                            { credentials: "include" }
                        );

                        if (!respostaContagem.ok) {
                            throw new Error(
                                "Não foi possível carregar as curtidas."
                            );
                        }

                        const dadosContagem =
                            await respostaContagem.json();

                        const totalLikes = Number(
                            dadosContagem?.total ?? 0
                        );

                        let curtiu = false;

                        if (usuarioPodeCurtir) {
                            const respostaVerificacao = await fetch(
                                `${BASE_URL}/likes/verificar?id_post=${id}`,
                                { credentials: "include" }
                            );

                            if (!respostaVerificacao.ok) {
                                throw new Error(
                                    "Não foi possível verificar sua curtida."
                                );
                            }

                            const dadosVerificacao =
                                await respostaVerificacao.json();

                            curtiu = Boolean(
                                dadosVerificacao?.curtiu
                            );
                        }

                        return {
                            id,
                            curtiu,
                            totalLikes,
                        };
                    } catch (error) {
                        console.error(
                            `Erro ao carregar curtidas do post ${id}:`,
                            error
                        );

                        return {
                            id,
                            curtiu: false,
                            totalLikes: 0,
                        };
                    }
                })
            );

            if (cancelado) return;

            const novoEstado: Record<number, ILikeState> = {};

            resultados.forEach((resultado) => {
                if (!resultado) return;

                novoEstado[resultado.id] = {
                    curtiu: resultado.curtiu,
                    totalLikes: resultado.totalLikes,
                };
            });

            setLikes(novoEstado);
        }

        void carregarLikes();

        return () => {
            cancelado = true;
        };
    }, [loading, posts, usuarioPodeCurtir]);

    useEffect(() => {
        if (loading || posts.length === 0) return;

        requestAnimationFrame(() => {
            postSelecionadoRef.current?.scrollIntoView({
                behavior: "auto",
                block: "center",
            });
        });
    }, [loading, posts, id_post]);

    function obterUrlImagem(nome?: string): string {
        if (!nome) return "";

        if (/^https?:\/\//i.test(nome)) {
            return nome;
        }

        const nomeArquivo = nome
            .replace(/\\/g, "/")
            .split("/")
            .pop();

        return nomeArquivo
            ? `${BASE_URL}/images/${nomeArquivo}`
            : "";
    }

    function marcarImagemIndisponivel(id: number) {
        setImagensIndisponiveis((anteriores) =>
            anteriores.includes(id)
                ? anteriores
                : [...anteriores, id]
        );
    }


    async function arquivarPost(id: number) {
        if (arquivando !== null) return;

        const organizacaoLogada = obterIdOrganizacaoLogada();

        // Confere a organização dona da publicação.
        const post = posts.find(
            (item) => Number(item.id_post) === id
        );

        if (!organizacaoLogada || !post) {
            setErroArquivar(
                "Não foi possível confirmar a propriedade desta publicação."
            );
            setMenuAberto(null);
            return;
        }

        if (
            Number(post.id_organizacao) !== organizacaoLogada
        ) {
            setErroArquivar(
                "Você só pode arquivar publicações da sua organização."
            );
            setMenuAberto(null);
            return;
        }

        const confirmar = window.confirm(
            "Deseja arquivar esta publicação? Ela deixará de aparecer no perfil público."
        );

        if (!confirmar) return;

        setArquivando(id);
        setErroArquivar("");
        setMensagemSucesso("");

        try {
            const resposta = await fetch(
                `${BASE_URL}/posts?id_post=${id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(
                    dados?.message ||
                    dados?.error ||
                    "Não foi possível arquivar a publicação."
                );
            }

            setPosts((anteriores) =>
                anteriores.filter(
                    (item) => Number(item.id_post) !== id
                )
            );

            setMenuAberto(null);
            setMensagemSucesso(
                "Publicação arquivada com sucesso!"
            );
        } catch (error) {
            setErroArquivar(
                error instanceof Error
                    ? error.message
                    : "Ocorreu um erro ao arquivar a publicação."
            );
        } finally {
            setArquivando(null);
        }
    }


    async function alternarLike(id: number) {
        if (!usuarioPodeCurtir) {
            setErroLike(
                "Somente clientes podem curtir publicações."
            );
            return;
        }

        if (likesCarregando[id]) return;

        setErroLike("");

        setLikesCarregando((anterior) => ({
            ...anterior,
            [id]: true,
        }));

        try {
            const resposta = await fetch(
                `${BASE_URL}/likes/toggle`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id_post: id,
                    }),
                }
            );

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                if (resposta.status === 401) {
                    throw new Error(
                        "Sua sessão expirou. Entre novamente para curtir."
                    );
                }

                throw new Error(
                    dados?.message ||
                    "Não foi possível registrar sua curtida."
                );
            }

            setLikes((anterior) => ({
                ...anterior,
                [id]: {
                    curtiu: Boolean(dados?.curtiu),
                    totalLikes: Number(dados?.totalLikes ?? 0),
                },
            }));
        } catch (error) {
            setErroLike(
                error instanceof Error
                    ? error.message
                    : "Erro ao curtir a publicação."
            );
        } finally {
            setLikesCarregando((anterior) => ({
                ...anterior,
                [id]: false,
            }));
        }
    }

    if (loading) {
        return (
            <main className="visualizarPostPagina">
                <div className="visualizarPostEstado">
                    <div className="visualizarPostSpinner" />
                    <p>Carregando publicações...</p>
                </div>
            </main>
        );
    }

    if (erro) {
        return (
            <main className="visualizarPostPagina">
                <button
                    type="button"
                    className="visualizarPostVoltar"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={19} />
                    Voltar
                </button>

                <div className="visualizarPostEstado">
                    <ImageOff size={42} />
                    <h2>Não foi possível abrir as publicações</h2>
                    <p>{erro}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="visualizarPostPagina">
            <header className="visualizarPostTopo">
                <button
                    type="button"
                    className="visualizarPostVoltar"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={19} />
                    Voltar
                </button>

                <div className="visualizarPostCabecalho">
                    <div className="visualizarPostLogo">
                        <Store size={25} />
                    </div>

                    <div>
                        <span className="visualizarPostEyebrow">
                            PUBLICAÇÕES DE
                        </span>

                        <h1>{nomeEmpresa || "Empresa"}</h1>

                        <p>
                            Confira os produtos e serviços publicados.
                        </p>
                    </div>
                </div>
            </header>
            {mensagemSucesso && (
                <div className="visualizarPostSucesso" role="status">
                    <span className="visualizarPostSucessoIcone">
                        ✓
                    </span>

                    <div>
                        <strong>Pronto!</strong>
                        <p>{mensagemSucesso}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMensagemSucesso("")}
                        aria-label="Fechar mensagem"
                    >
                        ×
                    </button>
                </div>
            )}
            <section className="visualizarPostFeed">
                {posts.map((post, index) => {
                    const id = Number(post.id_post ?? index);

                    const selecionado =
                        Number(post.id_post) === Number(id_post);

                    const imagem = obterUrlImagem(
                        post.vincularImagem
                    );

                    const imagemIndisponivel =
                        !imagem ||
                        imagensIndisponiveis.includes(id);

                    const like = likes[id] ?? {
                        curtiu: false,
                        totalLikes: 0,
                    };

                    const enviando = Boolean(likesCarregando[id]);

                    return (
                        <article
                            key={post.id_post ?? index}
                            ref={
                                selecionado
                                    ? postSelecionadoRef
                                    : null
                            }
                            className={`visualizarPostConteudo ${selecionado
                                ? "visualizarPostSelecionado"
                                : ""
                                }`}
                        >
                            <div className="visualizarPostCardTopo">
                                <div className="visualizarPostMiniLogo">
                                    <Store size={19} />
                                </div>

                                <div className="visualizarPostDadosEmpresa">
                                    <strong>
                                        {nomeEmpresa || "Empresa"}
                                    </strong>

                                    <span>
                                        {selecionado
                                            ? "Publicação selecionada"
                                            : "Publicação"}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        position: "relative",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        zIndex: 9999,
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="visualizarPostPonto"
                                        aria-label="Opções da publicação"
                                        aria-expanded={menuAberto === id}
                                        onClick={() => {
                                            setMenuAberto((atual) =>
                                                atual === id ? null : id
                                            );
                                        }}
                                    >
                                        <MoreVertical size={22} />
                                    </button>

                                    {menuAberto === id && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "100%",
                                                right: 0,
                                                zIndex: 99999,
                                                display: "block",
                                                visibility: "visible",
                                                opacity: 1,
                                                minWidth: 220,
                                                padding: 8,
                                                backgroundColor: "#fff",
                                                border: "1px solid #ddd",
                                                borderRadius: 10,
                                                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                disabled={arquivando === id}
                                                onClick={() => void arquivarPost(id)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    width: "100%",
                                                    padding: 12,
                                                    border: 0,
                                                    background: "#fff",
                                                    color: "#333",
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                }}
                                            >
                                                <Archive size={18} />

                                                <span>
                                                    {arquivando === id
                                                        ? "Arquivando..."
                                                        : "Arquivar publicação"}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className="visualizarPostAreaImagem">
                                {imagemIndisponivel ? (
                                    <div className="visualizarPostSemImagem">
                                        <div className="visualizarPostIconeImagem">
                                            <ImageOff size={36} />
                                        </div>

                                        <strong>
                                            Imagem indisponível
                                        </strong>

                                        <span>
                                            Esta publicação não possui
                                            uma imagem disponível.
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={imagem}
                                        alt={
                                            post.titulo ||
                                            "Imagem da publicação"
                                        }
                                        className="visualizarPostImagem"
                                        onError={() =>
                                            marcarImagemIndisponivel(id)
                                        }
                                    />
                                )}
                            </div>

                            <div className="visualizarPostTexto">
                                <h2>
                                    {post.titulo || "Sem título"}
                                </h2>

                                <p>
                                    {post.descricao ||
                                        "Nenhuma descrição disponível."}
                                </p>

                                <div className="visualizarPostAcoes">
                                    {usuarioPodeCurtir ? (
                                        <button
                                            type="button"
                                            className="visualizarPostCurtir"
                                            onClick={() =>
                                                void alternarLike(id)
                                            }
                                            disabled={enviando}
                                            aria-pressed={like.curtiu}
                                            aria-label={
                                                like.curtiu
                                                    ? "Descurtir publicação"
                                                    : "Curtir publicação"
                                            }
                                            title={
                                                like.curtiu
                                                    ? "Descurtir"
                                                    : "Curtir"
                                            }
                                        >
                                            <Heart
                                                size={21}
                                                fill={
                                                    like.curtiu
                                                        ? "#B01013"
                                                        : "none"
                                                }
                                                color={
                                                    like.curtiu
                                                        ? "#B01013"
                                                        : "currentColor"
                                                }
                                                strokeWidth={2}
                                            />

                                            <span>
                                                {enviando
                                                    ? "Curtido"
                                                    : like.curtiu
                                                        ? "Curtido"
                                                        : "Curtir"}
                                            </span>

                                            <span>
                                                {like.totalLikes}
                                            </span>
                                        </button>
                                    ) : (
                                        <span>
                                            {like.totalLikes} curtidas
                                        </span>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </section>

            {erroArquivar && (
                <div
                    role="alert"
                    className="visualizarPostErro"
                >
                    {erroArquivar}

                    <button
                        type="button"
                        onClick={() => setErroArquivar("")}
                    >
                        Fechar
                    </button>
                </div>
            )}

            {erroLike && (
                <div
                    role="alert"
                    style={{
                        position: "fixed",
                        bottom: 20,
                        left: 16,
                        right: 16,
                        zIndex: 1000,
                        maxWidth: 500,
                        margin: "0 auto",
                        padding: "14px 18px",
                        background: "#FFFFFF",
                        border: "1px solid #B01013",
                        borderRadius: 12,
                        color: "#7f2a2a",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    }}
                >
                    {erroLike}

                    <button
                        type="button"
                        onClick={() => setErroLike("")}
                        style={{
                            display: "block",
                            marginTop: 8,
                            border: 0,
                            background: "transparent",
                            color: "#B01013",
                            cursor: "pointer",
                            fontWeight: 700,
                        }}
                    >
                        Fechar
                    </button>
                </div>
            )}
        </main>
    );
}
