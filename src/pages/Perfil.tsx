import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { User } from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    buscarAvaliacoesPorOrganizacao,
    calcularMediaAvaliacoes,
} from "./Avaliacao";

import type {
    IAvaliacao,
} from "./Avaliacao";

import { BASE_URL } from "../services/api";

import "../css/Perfil.css";

const NA = "N/A";

interface IPessoa {
    id_pessoa?: number;
    nome?: string;
    tipo?: string;
}

interface IOrganizacao extends IPessoa {
    cpf?: string;
    cnpj?: string;
    data_criacao?: string;
    id_area_atuacao?: number;
}

interface IPost {
    id_post?: number;
    vincularImagem?: string;
    titulo?: string;
    descricao?: string;
    id_categoria?: number;
    status?: string;
    id_organizacao?: number;
}

type Aba =
    | "inicio"
    | "perfil"
    | "posts"
    | "avaliacoes";

export default function PerfilScreen() {
    const navigate = useNavigate();

    const { id_pessoa } = useParams<{
        id_pessoa: string;
    }>();

    const idPessoa = Number(id_pessoa);

    const [organizacao, setOrganizacao] =
        useState<IOrganizacao | null>(null);

    const [categoria, setCategoria] =
        useState(NA);

    const [posts, setPosts] =
        useState<IPost[]>([]);

    const [avaliacoes, setAvaliacoes] =
        useState<IAvaliacao[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [loadingPosts, setLoadingPosts] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const [abaSelecionada, setAbaSelecionada] =
        useState<Aba>("inicio");

    const inicioRef =
        useRef<HTMLDivElement | null>(null);

    const perfilRef =
        useRef<HTMLDivElement | null>(null);

    const postsRef =
        useRef<HTMLDivElement | null>(null);

    const avaliacoesRef =
        useRef<HTMLDivElement | null>(null);

    const media = useMemo(
        () =>
            calcularMediaAvaliacoes(
                avaliacoes
            ),
        [avaliacoes]
    );

    const postsDestaques = useMemo(
        () =>
            posts.slice(0, 5),
        [posts]
    );

    useEffect(() => {
        if (!id_pessoa || isNaN(idPessoa)) {
            setErro(
                "ID da organização inválido."
            );

            setLoading(false);

            return;
        }

        carregarDados();
    }, [id_pessoa]);

    useEffect(() => {
        const refs = {
            inicio: inicioRef,
            perfil: perfilRef,
            posts: postsRef,
            avaliacoes: avaliacoesRef,
        };

        const refSelecionada =
            refs[abaSelecionada];

        if (refSelecionada.current) {
            refSelecionada.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [abaSelecionada]);

    async function carregarDados() {
        try {
            setLoading(true);
            setErro("");

            const pessoa =
                await buscarPessoaPorId();

            if (!pessoa) {
                limparDados();

                setErro(
                    "Organização não encontrada."
                );

                return;
            }

            if (
                pessoa.tipo
                    ?.trim()
                    .toUpperCase() !==
                "ORGANIZACAO"
            ) {
                limparDados();

                setErro(
                    "Esta pessoa não é uma organização."
                );

                return;
            }

            await carregarOrganizacao(
                pessoa
            );

            await Promise.all([
                carregarAvaliacoes(),
                carregarPosts(),
            ]);
        } catch (error) {
            console.error(
                "Erro ao carregar perfil:",
                error
            );

            limparDados();

            setErro(
                "Não foi possível carregar o perfil da organização."
            );
        } finally {
            setLoading(false);
        }
    }

    function limparDados() {
        setOrganizacao(null);
        setCategoria(NA);
        setPosts([]);
        setAvaliacoes([]);
    }

    async function buscarPessoaPorId(): Promise<IPessoa | null> {
        try {
            const resposta =
                await fetch(
                    `${BASE_URL}/pessoas/${idPessoa}`,
                    {
                        credentials: "include",
                    }
                );

            if (resposta.ok) {
                const data =
                    await resposta.json();

                const pessoa =
                    data?.pessoa ||
                    data?.organizacao ||
                    data?.data ||
                    data;

                if (
                    pessoa &&
                    Number(
                        pessoa.id_pessoa
                    ) === idPessoa
                ) {
                    return pessoa;
                }

                const lista =
                    data?.pessoas ||
                    data?.funcionarios ||
                    data?.dados ||
                    [];

                if (
                    Array.isArray(lista)
                ) {
                    return (
                        lista.find(
                            (
                                item: IPessoa
                            ) =>
                                Number(
                                    item.id_pessoa
                                ) === idPessoa
                        ) || null
                    );
                }
            }
        } catch (error) {
            console.warn(
                "Erro ao buscar pessoa:",
                error
            );
        }

        try {
            const resposta =
                await fetch(
                    `${BASE_URL}/pessoas`,
                    {
                        credentials: "include",
                    }
                );

            if (!resposta.ok) {
                throw new Error(
                    `Erro HTTP ${resposta.status}`
                );
            }

            const data =
                await resposta.json();

            const lista =
                data?.pessoas ||
                data?.funcionarios ||
                data?.dados ||
                data?.data ||
                [];

            if (!Array.isArray(lista)) {
                return null;
            }

            return (
                lista.find(
                    (item: IPessoa) =>
                        Number(
                            item.id_pessoa
                        ) === idPessoa
                ) || null
            );
        } catch (error) {
            console.error(
                "Erro ao buscar pessoa:",
                error
            );

            return null;
        }
    }

    async function carregarOrganizacao(
        pessoa: IPessoa
    ) {
        const organizacaoBasica: IOrganizacao = {
            id_pessoa:
                pessoa.id_pessoa,

            nome:
                pessoa.nome,

            tipo:
                pessoa.tipo,
        };

        const pessoaCompleta =
            pessoa as IOrganizacao;

        if (
            pessoaCompleta.cnpj ||
            pessoaCompleta.cpf ||
            pessoaCompleta.data_criacao ||
            pessoaCompleta.id_area_atuacao
        ) {
            setOrganizacao(
                pessoaCompleta
            );

            if (
                pessoaCompleta.id_area_atuacao
            ) {
                await carregarCategoria(
                    pessoaCompleta.id_area_atuacao
                );
            } else {
                setCategoria(NA);
            }

            return;
        }

        try {
            const resposta =
                await fetch(
                    `${BASE_URL}/pessoas?tipo=ORGANIZACAO`,
                    {
                        credentials: "include",
                    }
                );

            if (!resposta.ok) {
                throw new Error(
                    `Erro HTTP ${resposta.status}`
                );
            }

            const data =
                await resposta.json();

            const lista =
                data?.funcionarios ||
                data?.pessoas ||
                data?.dados ||
                data?.data ||
                [];

            if (!Array.isArray(lista)) {
                setOrganizacao(
                    organizacaoBasica
                );

                setCategoria(NA);

                return;
            }

            const encontrada =
                lista.find(
                    (
                        item: IOrganizacao
                    ) =>
                        Number(
                            item.id_pessoa
                        ) === idPessoa
                );

            if (!encontrada) {
                setOrganizacao(
                    organizacaoBasica
                );

                setCategoria(NA);

                return;
            }

            setOrganizacao(
                encontrada
            );

            if (
                encontrada.id_area_atuacao
            ) {
                await carregarCategoria(
                    encontrada.id_area_atuacao
                );
            } else {
                setCategoria(NA);
            }
        } catch (error) {
            console.error(
                "Erro ao buscar organização:",
                error
            );

            setOrganizacao(
                organizacaoBasica
            );

            setCategoria(NA);
        }
    }

    async function carregarCategoria(
        idArea: number
    ) {
        try {
            const resposta =
                await fetch(
                    `${BASE_URL}/AreaAtuacao?id_area_atuacao=${idArea}`,
                    {
                        credentials: "include",
                    }
                );

            if (!resposta.ok) {
                throw new Error(
                    "Erro ao buscar área de atuação"
                );
            }

            const data =
                await resposta.json();

            const lista =
                data?.resultadoSelecionaId ||
                data?.dados ||
                data?.data ||
                [];

            setCategoria(
                lista[0]?.descricao ||
                NA
            );
        } catch (error) {
            console.error(
                "Erro ao buscar área de atuação:",
                error
            );

            setCategoria(NA);
        }
    }

    async function carregarAvaliacoes() {
        try {
            const resultado =
                await buscarAvaliacoesPorOrganizacao(
                    idPessoa
                );

            setAvaliacoes(
                resultado
            );
        } catch (error) {
            console.error(
                "Erro ao buscar avaliações:",
                error
            );

            setAvaliacoes([]);
        }
    }

    async function carregarPosts() {
        try {
            setLoadingPosts(true);

            const url =
                `${BASE_URL}/posts/organizacao?id_organizacao=${idPessoa}`;

            const resposta =
                await fetch(
                    url,
                    {
                        credentials:
                            "include",
                    }
                );

            if (!resposta.ok) {
                throw new Error(
                    `Erro HTTP ${resposta.status}`
                );
            }

            const data =
                await resposta.json();

            const listaPosts =
                data?.posts || [];

            setPosts(
                Array.isArray(
                    listaPosts
                )
                    ? listaPosts
                    : []
            );
        } catch (error) {
            console.error(
                "Erro ao buscar posts:",
                error
            );

            setPosts([]);
        } finally {
            setLoadingPosts(false);
        }
    }

    function obterUrlImagem(
        nome?: string
    ) {
        if (!nome) {
            return "";
        }

        if (
            nome.startsWith(
                "http://"
            ) ||
            nome.startsWith(
                "https://"
            )
        ) {
            return nome;
        }

        const nomeArquivo =
            nome
                .replace(
                    /\\/g,
                    "/"
                )
                .split("/")
                .pop();

        if (!nomeArquivo) {
            return "";
        }

        return `${BASE_URL}/images/${nomeArquivo}`;
    }

    function criarAvaliacao() {
        navigate(
            `/criar-avaliacao/${idPessoa}`
        );
    }

    function mudarAba(
        aba: Aba
    ) {
        setAbaSelecionada(aba);
    }

    function Loading({
        texto,
    }: {
        texto: string;
    }) {
        return (
            <div className="carregando">
                <div className="spinner" />

                <span className="carregandoTexto">
                    {texto}
                </span>
            </div>
        );
    }

    function SemPosts({
        grande = false,
    }: {
        grande?: boolean;
    }) {
        return (
            <div
                className={
                    grande
                        ? "semPostsGrande"
                        : "semPosts"
                }
            >
                <span className="semPostsTexto">
                    Nenhum post publicado.
                </span>
            </div>
        );
    }

    function PostCard({
        post,
    }: {
        post: IPost;
    }) {
        const imagem =
            obterUrlImagem(
                post.vincularImagem
            );

        return (
            <button
                type="button"
                className="cardPost"
            >
                {imagem ? (
                    <img
                        src={imagem}
                        className="imagemPost"
                        alt={
                            post.titulo ||
                            "Imagem do post"
                        }
                    />
                ) : (
                    <div className="imagemPostSemImagem" />
                )}

                <div className="conteudoPost">
                    <div className="tituloPost">
                        {post.titulo ||
                            NA}
                    </div>

                    {post.descricao && (
                        <div className="descricaoPost">
                            {post.descricao}
                        </div>
                    )}
                </div>
            </button>
        );
    }

    function BotaoAba({
        aba,
        icon,
    }: {
        aba: Aba;
        icon: string;
    }) {
        const selecionada =
            abaSelecionada === aba;

        return (
            <button
                type="button"
                className={`iconeMenu ${
                    selecionada
                        ? "iconeMenuSelecionado"
                        : ""
                }`}
                onClick={() =>
                    mudarAba(aba)
                }
            >
                <span>
                    {icon}
                </span>
            </button>
        );
    }

    function BotaoCriarAvaliacao() {
        return (
            <button
                type="button"
                className="botaoCriarAvaliacao"
                onClick={
                    criarAvaliacao
                }
            >
                <span className="iconeBotaoAvaliacao">
                    ＋
                </span>

                <span>
                    Criar avaliação
                </span>
            </button>
        );
    }

    function Estatistica({
        icon,
        numero,
        texto,
    }: {
        icon: string;
        numero: string;
        texto: string;
    }) {
        return (
            <div className="estatistica">
                <span className="iconeEstatistica">
                    {icon}
                </span>

                <span className="numero">
                    {numero}
                </span>

                <span className="label">
                    {texto}
                </span>
            </div>
        );
    }

    function InfoLinha({
        icon,
        texto,
    }: {
        icon: string;
        texto: string;
    }) {
        return (
            <div className="infoLinha">
                <span>
                    {icon}
                </span>

                <span className="infoTexto">
                    {texto}
                </span>
            </div>
        );
    }

    function AbaInicio() {
        return (
            <div>
                <div className="estatisticas">
                    <Estatistica
                        icon=""
                        numero="0"
                        texto="Favoritado"
                    />

                    <div className="divisor" />

                    <Estatistica
                        icon=""
                        numero={String(
                            posts.length
                        )}
                        texto="Posts"
                    />

                    <div className="divisor" />

                    <Estatistica
                        icon=""
                        numero={String(
                            media
                        )}
                        texto="Avaliação média"
                    />
                </div>

                <div className="tituloLinha">
                    <h2 className="titulo">
                        Destaques
                    </h2>
                </div>

                {loadingPosts && (
                    <Loading
                        texto="Carregando posts..."
                    />
                )}

                {!loadingPosts &&
                    postsDestaques.length ===
                        0 && (
                        <SemPosts />
                    )}

                {!loadingPosts &&
                    postsDestaques.length >
                        0 && (
                        <div className="destaques">
                            {postsDestaques.map(
                                (
                                    post
                                ) => (
                                    <PostCard
                                        key={
                                            post.id_post
                                        }
                                        post={
                                            post
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}

                <div className="tituloAvaliacaoLinha">
                    <h2 className="titulo">
                        Avaliações dos clientes
                    </h2>

                    <BotaoCriarAvaliacao />
                </div>

                {avaliacoes.length ===
                    0 && (
                    <div className="semAvaliacoesContainer">
                        <span className="semAvaliacoes">
                            Nenhuma avaliação
                            encontrada.
                        </span>
                    </div>
                )}

                {avaliacoes
                    .slice(0, 5)
                    .map(
                        (
                            avaliacao
                        ) => (
                            <div
                                key={
                                    avaliacao.id_avaliacao
                                }
                                className="cardAvaliacao"
                            >
                                <div className="dadosAvaliacao">
                                    <div className="nomeCliente">
                                        {Number(
                                            avaliacao.anonimo
                                        ) ===
                                            1
                                            ? "Usuário anônimo"
                                            : avaliacao.nome_cliente ||
                                              "Usuário"}
                                    </div>

                                    <div className="tituloAvaliacao">
                                        {avaliacao.titulo ||
                                            NA}
                                    </div>
                                </div>

                                <div className="nota">
                                    {avaliacao.csat}
                                </div>
                            </div>
                        )
                    )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container">
                <div className="scrollContent">
                    <Loading
                        texto="Carregando perfil..."
                    />
                </div>
            </div>
        );
    }

    if (
        erro ||
        !organizacao
    ) {
        return (
            <div className="container">
                <div
                    className="scrollContent"
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        minHeight:
                            "100vh",
                    }}
                >
                    <div
                        style={{
                            textAlign:
                                "center",
                        }}
                    >
                        <h2>
                            {erro ||
                                "Organização não encontrada"}
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/"
                                )
                            }
                            style={{
                                marginTop:
                                    "20px",
                                padding:
                                    "12px 25px",
                                border:
                                    "none",
                                borderRadius:
                                    "8px",
                                backgroundColor:
                                    "#ACCCB1",
                                cursor:
                                    "pointer",
                                fontWeight:
                                    "700",
                            }}
                        >
                            Voltar para Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="scrollContent">

                <header className="topo">
                    <button
                        type="button"
                        className="botaoVoltar"
                        onClick={() =>
                            navigate(-1)
                        }
                        aria-label="Voltar"
                    >
                        ←
                    </button>

                    <div className="perfil">
                        <div className="avatar" />

                        <div className="informacoes">
                            <h1 className="nomeLoja">
                                {organizacao.nome ||
                                    "Organização"}
                            </h1>

                            <span className="categoria">
                                {categoria}
                            </span>

                            <InfoLinha
                                icon=""
                                texto={NA}
                            />

                            <InfoLinha
                                icon=""
                                texto={NA}
                            />
                        </div>
                    </div>
                </header>

                <main className="areaMenu">

                    <nav className="menuNavegacao">
                        <BotaoAba
                            aba="inicio"
                            icon="⌂"
                        />

                        <BotaoAba
                            aba="perfil"
                            icon="♙"
                        />

                        <BotaoAba
                            aba="posts"
                            icon="▣"
                        />

                        <BotaoAba
                            aba="avaliacoes"
                            icon="☆"
                        />
                    </nav>

                    <div className="linha" />

                    {abaSelecionada ===
                        "inicio" && (
                        <div
                            ref={inicioRef}
                            className="abaRef"
                        >
                            <AbaInicio />
                        </div>
                    )}

                    {abaSelecionada ===
                        "perfil" && (
                        <div
                            ref={perfilRef}
                            className="abaConteudo abaRef"
                        >
                            <h2 className="tituloAba">
                                Informações do perfil
                            </h2>

                            <div className="cardInformacoes">

                                <InfoLinha
                                    icon=""
                                    texto={
                                        organizacao.nome ||
                                        NA
                                    }
                                />

                                <InfoLinha
                                    icon=""
                                    texto={
                                        categoria
                                    }
                                />

                                <InfoLinha
                                    icon=""
                                    texto={
                                        organizacao.cnpj ||
                                        organizacao.cpf ||
                                        NA
                                    }
                                />

                                <InfoLinha
                                    icon=""
                                    texto={
                                        organizacao.data_criacao ||
                                        NA
                                    }
                                />

                                <InfoLinha
                                    icon=""
                                    texto={NA}
                                />

                                <InfoLinha
                                    icon=""
                                    texto={NA}
                                />

                            </div>
                        </div>
                    )}

                    {abaSelecionada ===
                        "posts" && (
                        <div
                            ref={postsRef}
                            className="abaPosts abaRef"
                        >
                            {loadingPosts ? (
                                <Loading
                                    texto="Carregando posts..."
                                />
                            ) : posts.length ===
                              0 ? (
                                <SemPosts
                                    grande
                                />
                            ) : (
                                posts.map(
                                    (
                                        post
                                    ) => (
                                        <PostCard
                                            key={
                                                post.id_post
                                            }
                                            post={
                                                post
                                            }
                                        />
                                    )
                                )
                            )}
                        </div>
                    )}

                    {abaSelecionada ===
                        "avaliacoes" && (
                        <div
                            ref={avaliacoesRef}
                            className="abaAvaliacoes abaRef"
                        >
                            <div className="cabecalhoAvaliacoes">

                                <div>
                                    <h2 className="tituloAba">
                                        Avaliações
                                    </h2>

                                    <p className="subtituloAba">
                                        O que os clientes estão dizendo
                                    </p>
                                </div>

                                <div className="mediaAvaliacao">
                                    <strong>
                                        {
                                            media
                                        }
                                    </strong>
                                </div>

                            </div>

                            {avaliacoes.length ===
                            0 ? (
                                <div className="semAvaliacoesContainer">
                                    <span className="semAvaliacoes">
                                        Nenhuma avaliação encontrada.
                                    </span>
                                </div>
                            ) : (
                                avaliacoes.map(
                                    (
                                        avaliacao
                                    ) => (
                                        <div
                                            key={
                                                avaliacao.id_avaliacao
                                            }
                                            className="cardAvaliacao"
                                        >
                                            <div className="dadosAvaliacao">

                                                <div className="nomeCliente">
                                                    {Number(
                                                        avaliacao.anonimo
                                                    ) ===
                                                        1
                                                        ? "Usuário anônimo"
                                                        : avaliacao.nome_cliente ||
                                                          "Usuário"}
                                                </div>

                                                <div className="tituloAvaliacao">
                                                    {avaliacao.titulo ||
                                                        NA}
                                                </div>

                                                {avaliacao.comentario && (
                                                    <div className="comentarioAvaliacao">

                                                        <div className="bolinhaComentario">
                                                            <User
                                                                size={
                                                                    20
                                                                }
                                                                color="#7f2a2a"
                                                            />
                                                        </div>

                                                        <span className="textoComentario">
                                                            "
                                                            {
                                                                avaliacao.comentario
                                                            }
                                                            "
                                                        </span>

                                                    </div>
                                                )}

                                            </div>

                                            <div className="nota">
                                                {
                                                    avaliacao.csat
                                                }
                                            </div>

                                        </div>
                                    )
                                )
                            )}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
