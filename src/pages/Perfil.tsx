import React, { useEffect, useMemo, useRef, useState } from "react";
import { Heart, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import {
    buscarAvaliacoesPorOrganizacao,
    calcularMediaAvaliacoes,
    criarAvaliacao as criarAvaliacaoApi,
} from "../pages/Avaliacao";
import type { IAvaliacao } from "../pages/Avaliacao";

import { BASE_URL } from "../services/api";
import "../css/Perfil.css";

const NA = "N/A";

interface IPessoa {
    id_pessoa?: number;
    id_organizacao?: number;
    id_cliente?: number;
    nome?: string;
    tipo?: string;
}

interface IOrganizacao extends IPessoa {
    cpf?: string;
    cnpj?: string;
    data_criacao?: string;
    id_area_atuacao?: number;
}

interface ICliente {
    id_cliente?: number;
    id_pessoa?: number;
    data_nascimento?: string;
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

type Aba = "inicio" | "perfil" | "posts" | "avaliacoes";

interface ILoadingProps {
    texto: string;
}

interface ISemPostsProps {
    grande?: boolean;
}

interface IPostCardProps {
    post: IPost;
}

interface IInfoLinhaProps {
    icon?: string;
    texto: string;
}

interface IEstatisticaProps {
    numero: string;
    texto: string;
}

function Loading({ texto }: ILoadingProps) {
    return (
        <div className="carregando">
            <div className="spinner" />
            <span className="carregandoTexto">{texto}</span>
        </div>
    );
}

function SemPosts({ grande = false }: ISemPostsProps) {
    return (
        <div className={grande ? "semPostsGrande" : "semPosts"}>
            <span className="semPostsTexto">
                Nenhum post publicado.
            </span>
        </div>
    );
}

function InfoLinha({ icon = "", texto }: IInfoLinhaProps) {
    return (
        <div className="infoLinha">
            <span>{icon}</span>
            <span className="infoTexto">{texto}</span>
        </div>
    );
}

function Estatistica({ numero, texto }: IEstatisticaProps) {
    return (
        <div className="estatistica">
            <span className="numero">{numero}</span>
            <span className="label">{texto}</span>
        </div>
    );
}

function obterUrlImagem(nome?: string): string {
    if (!nome) return "";

    if (/^https?:\/\//i.test(nome)) {
        return nome;
    }

    const nomeArquivo = nome.replace(/\\/g, "/").split("/").pop();

    return nomeArquivo
        ? `${BASE_URL}/images/${nomeArquivo}`
        : "";
}

function PostCard({ post }: IPostCardProps) {
    const imagem = obterUrlImagem(post.vincularImagem);

    return (
        <button type="button" className="cardPost">
            {imagem ? (
                <img
                    src={imagem}
                    className="imagemPost"
                    alt={post.titulo || "Imagem do post"}
                />
            ) : (
                <div className="imagemPostSemImagem" />
            )}

            <div className="conteudoPost">
                <div className="tituloPost">
                    {post.titulo || NA}
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

export default function PerfilScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id_pessoa } = useParams<{ id_pessoa: string }>();

    const idPessoa = Number(id_pessoa);
    const usuarioEhCliente =
        user?.tipo?.trim().toUpperCase() === "CLIENTE";

    const [organizacao, setOrganizacao] =
        useState<IOrganizacao | null>(null);
    const [categoria, setCategoria] = useState(NA);
    const [posts, setPosts] = useState<IPost[]>([]);
    const [avaliacoes, setAvaliacoes] = useState<IAvaliacao[]>([]);
    const [clienteLogado, setClienteLogado] =
        useState<ICliente | null>(null);

    const [favoritado, setFavoritado] = useState(false);
    const [carregandoFavorito, setCarregandoFavorito] =
        useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [erro, setErro] = useState("");

    const [abaSelecionada, setAbaSelecionada] =
        useState<Aba>("inicio");

    const [modalAvaliacaoAberto, setModalAvaliacaoAberto] =
        useState(false);
    const [notaSelecionada, setNotaSelecionada] = useState(0);
    const [tituloAvaliacao, setTituloAvaliacao] = useState("");
    const [comentarioAvaliacao, setComentarioAvaliacao] =
        useState("");
    const [avaliacaoAnonima, setAvaliacaoAnonima] =
        useState(false);
    const [enviandoAvaliacao, setEnviandoAvaliacao] =
        useState(false);
    const [erroAvaliacao, setErroAvaliacao] = useState("");
    const [sucessoAvaliacao, setSucessoAvaliacao] =
        useState("");

    const inicioRef = useRef<HTMLDivElement>(null);
    const perfilRef = useRef<HTMLDivElement>(null);
    const postsRef = useRef<HTMLDivElement>(null);
    const avaliacoesRef = useRef<HTMLDivElement>(null);

    const media = useMemo(
        () => calcularMediaAvaliacoes(avaliacoes),
        [avaliacoes]
    );

    const postsDestaques = useMemo(
        () => posts.slice(0, 5),
        [posts]
    );

    function limparDados() {
        setOrganizacao(null);
        setCategoria(NA);
        setPosts([]);
        setAvaliacoes([]);
        setFavoritado(false);
    }

    async function buscarPessoaPorId(): Promise<IPessoa | null> {
        if (!Number.isSafeInteger(idPessoa) || idPessoa <= 0) {
            return null;
        }

        // 1. Tenta buscar diretamente pelo ID.
        try {
            const resposta = await fetch(
                `${BASE_URL}/pessoas/${idPessoa}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (resposta.ok) {
                const data = await resposta.json();

                const possiveisPessoas = [
                    data?.pessoa,
                    data?.organizacao,
                    data?.data,
                    data?.dados,
                    data,
                ];

                for (const item of possiveisPessoas) {
                    if (
                        item &&
                        !Array.isArray(item) &&
                        Number(item.id_pessoa) === idPessoa
                    ) {
                        return item as IPessoa;
                    }
                }

                const possiveisListas = [
                    data?.pessoas,
                    data?.funcionarios,
                    data?.dados,
                    data?.data,
                    data?.pessoaId,
                ];

                for (const lista of possiveisListas) {
                    if (!Array.isArray(lista)) continue;

                    const pessoa = lista.find(
                        (item: IPessoa) =>
                            Number(item.id_pessoa) === idPessoa
                    );

                    if (pessoa) return pessoa;
                }
            } else if (resposta.status !== 404) {
                console.warn(
                    "Falha ao buscar pessoa por ID:",
                    resposta.status
                );
            }
        } catch (error) {
            console.warn(
                "Erro na busca direta da pessoa:",
                error
            );
        }

        // 2. Alternativa: busca a lista de pessoas.
        try {
            const resposta = await fetch(
                `${BASE_URL}/pessoas`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (!resposta.ok) {
                throw new Error(
                    `Erro HTTP ${resposta.status}`
                );
            }

            const data = await resposta.json();

            const possiveisListas = [
                data?.pessoas,
                data?.funcionarios,
                data?.dados,
                data?.data,
                data?.pessoaId,
            ];

            for (const lista of possiveisListas) {
                if (!Array.isArray(lista)) continue;

                const pessoa = lista.find(
                    (item: IPessoa) =>
                        Number(item.id_pessoa) === idPessoa
                );

                if (pessoa) return pessoa;
            }

            if (
                data?.pessoa &&
                Number(data.pessoa.id_pessoa) === idPessoa
            ) {
                return data.pessoa as IPessoa;
            }

            return null;
        } catch (error) {
            console.error(
                "Erro ao buscar pessoa na lista:",
                error
            );

            return null;
        }
    }
    async function carregarClienteLogado(): Promise<ICliente | null> {
        if (!usuarioEhCliente) {
            setClienteLogado(null);
            return null;
        }

        const idPessoaUsuario = Number(user?.id_pessoa_login);

        if (
            !Number.isSafeInteger(idPessoaUsuario) ||
            idPessoaUsuario <= 0
        ) {
            setClienteLogado(null);
            return null;
        }

        try {
            const resposta = await fetch(
                `${BASE_URL}/pessoas?id=${idPessoaUsuario}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (!resposta.ok) {
                throw new Error(
                    `Falha ao consultar pessoa: HTTP ${resposta.status}`
                );
            }

            const data = await resposta.json();

            const possiveisListas = [
                data?.pessoaId,
                data?.pessoas,
                data?.dados,
                data?.data,
                data?.data?.pessoaId,
                data?.data?.pessoas,
            ];

            let pessoa: IPessoa | null = null;

            for (const lista of possiveisListas) {
                if (!Array.isArray(lista)) continue;

                pessoa =
                    lista.find(
                        (item: IPessoa) =>
                            Number(item.id_pessoa) === idPessoaUsuario
                    ) ?? null;

                if (pessoa) break;
            }

            if (
                !pessoa &&
                Number(data?.pessoa?.id_pessoa) === idPessoaUsuario
            ) {
                pessoa = data.pessoa;
            }

            if (!pessoa) {
                throw new Error(
                    "Pessoa autenticada não encontrada na resposta da API."
                );
            }

            if (
                String(pessoa.tipo ?? "").trim().toUpperCase() !==
                "CLIENTE"
            ) {
                throw new Error(
                    "O usuário autenticado não é um cliente."
                );
            }

            const idCliente = Number(pessoa.id_cliente);

            if (!Number.isSafeInteger(idCliente) || idCliente <= 0) {
                throw new Error(
                    "A API não retornou um id_cliente válido."
                );
            }

            const cliente: ICliente = {
                id_cliente: idCliente,
                id_pessoa: idPessoaUsuario,
                data_nascimento: (pessoa as ICliente).data_nascimento,
            };

            setClienteLogado(cliente);

            return cliente;
        } catch (error) {
            console.error(
                "Erro ao carregar cliente autenticado:",
                error
            );

            setClienteLogado(null);
            return null;
        }
    }
    async function carregarCategoria(idArea: number) {
        try {
            const resposta = await fetch(
                `${BASE_URL}/AreaAtuacao?id_area_atuacao=${idArea}`,
                { credentials: "include" }
            );

            if (!resposta.ok) {
                throw new Error("Erro ao buscar área de atuação.");
            }

            const data = await resposta.json();
            const lista =
                data?.resultadoSelecionaId ??
                data?.dados ??
                data?.data ??
                [];

            setCategoria(lista[0]?.descricao || NA);
        } catch (error) {
            console.error("Erro ao carregar categoria:", error);
            setCategoria(NA);
        }
    }

    async function carregarAvaliacoes(idOrganizacao: number) {
        try {
            if (!Number.isFinite(idOrganizacao) || idOrganizacao <= 0) {
                setAvaliacoes([]);
                return;
            }

            const resultado =
                await buscarAvaliacoesPorOrganizacao(idOrganizacao);

            setAvaliacoes(resultado);
        } catch (error) {
            console.error("Erro ao carregar avaliações:", error);
            setAvaliacoes([]);
        }
    }

    async function carregarPosts(idOrganizacao: number) {
        setLoadingPosts(true);

        try {
            if (!Number.isFinite(idOrganizacao) || idOrganizacao <= 0) {
                setPosts([]);
                return;
            }

            const resposta = await fetch(
                `${BASE_URL}/posts/organizacao?id_organizacao=${idOrganizacao}`,
                { credentials: "include" }
            );

            if (!resposta.ok) {
                throw new Error("Não foi possível carregar os posts.");
            }

            const data = await resposta.json();
            const lista =
                data?.posts ??
                data?.data ??
                data?.dados ??
                data;

            if (!Array.isArray(lista)) {
                setPosts([]);
                return;
            }

            const postsDaOrganizacao = lista.filter(
                (post: IPost) =>
                    Number(post.id_organizacao) === idOrganizacao
            );

            setPosts(postsDaOrganizacao);
        } catch (error) {
            console.error("Erro ao carregar posts:", error);
            setPosts([]);
        } finally {
            setLoadingPosts(false);
        }
    }

    async function carregarOrganizacao(pessoa: IPessoa) {
        let encontrada = pessoa as IOrganizacao;

        if (!encontrada.id_organizacao) {
            try {
                const resposta = await fetch(
                    `${BASE_URL}/pessoas?tipo=ORGANIZACAO`,
                    { credentials: "include" }
                );

                if (!resposta.ok) {
                    throw new Error("Erro ao buscar organizações.");
                }

                const data = await resposta.json();
                const lista =
                    data?.funcionarios ??
                    data?.pessoas ??
                    data?.dados ??
                    data?.data ??
                    [];

                if (!Array.isArray(lista)) {
                    throw new Error("Lista de organizações inválida.");
                }

                const resultado = lista.find(
                    (item: IOrganizacao) =>
                        Number(item.id_pessoa) ===
                        Number(pessoa.id_pessoa)
                );

                if (!resultado) {
                    throw new Error(
                        "Não foi possível encontrar a organização na lista."
                    );
                }

                if (
                    !Number.isSafeInteger(Number(resultado.id_organizacao)) ||
                    Number(resultado.id_organizacao) <= 0
                ) {
                    throw new Error(
                        "A organização encontrada não possui id_organizacao válido."
                    );
                }

                encontrada = resultado;
            } catch (error) {
                console.error("Erro ao identificar organização:", error);
                setErro(
                    "Não foi possível identificar a organização."
                );
                return;
            }
        }

        const idOrganizacao = Number(encontrada.id_organizacao);

        if (!Number.isFinite(idOrganizacao) || idOrganizacao <= 0) {
            setErro("A organização não possui um ID válido.");
            return;
        }

        setOrganizacao(encontrada);

        if (encontrada.id_area_atuacao) {
            await carregarCategoria(encontrada.id_area_atuacao);
        } else {
            setCategoria(NA);
        }

        await Promise.all([
            carregarAvaliacoes(idOrganizacao),
            carregarPosts(idOrganizacao),
        ]);
    }

    async function carregarDados() {
        setLoading(true);
        setErro("");

        try {
            const pessoa = await buscarPessoaPorId();

            if (!pessoa) {
                limparDados();
                setErro("Organização não encontrada.");
                return;
            }

            if (
                pessoa.tipo?.trim().toUpperCase() !== "ORGANIZACAO"
            ) {
                limparDados();
                setErro("Esta pessoa não é uma organização.");
                return;
            }

            await carregarOrganizacao(pessoa);
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            limparDados();
            setErro(
                "Não foi possível carregar o perfil da organização."
            );
        } finally {
            setLoading(false);
        }
    }

    async function carregarStatusFavorito() {
        const idOrganizacao = Number(organizacao?.id_organizacao);
        const idCliente = Number(clienteLogado?.id_cliente);

        if (
            !usuarioEhCliente ||
            !Number.isFinite(idOrganizacao) ||
            idOrganizacao <= 0 ||
            !Number.isFinite(idCliente) ||
            idCliente <= 0
        ) {
            setFavoritado(false);
            return;
        }

        try {
            const resposta = await fetch(
                `${BASE_URL}/favoritos?id_cliente=${idCliente}&id_organizacao=${idOrganizacao}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (!resposta.ok) return;

            const data = await resposta.json();
            const status =
                data?.favoritado ??
                data?.favorito ??
                data?.data?.favoritado ??
                data?.data?.favorito;

            if (typeof status === "boolean") {
                setFavoritado(status);
            } else if (Number(status) === 1) {
                setFavoritado(true);
            } else if (Number(status) === 0) {
                setFavoritado(false);
            }
        } catch (error) {
            console.error("Erro ao verificar favorito:", error);
        }
    }

    async function alternarFavorito() {
        const idOrganizacao = Number(organizacao?.id_organizacao);
        const idCliente = Number(clienteLogado?.id_cliente);

        if (
            !usuarioEhCliente ||
            !Number.isSafeInteger(idOrganizacao) ||
            idOrganizacao <= 0 ||
            !Number.isSafeInteger(idCliente) ||
            idCliente <= 0 ||
            carregandoFavorito
        ) {
            return;
        }

        const novoStatus = !favoritado;

        setCarregandoFavorito(true);

        try {
            const resposta = await fetch(`${BASE_URL}/favoritos`, {
                method: novoStatus ? "POST" : "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id_cliente: idCliente,
                    id_organizacao: idOrganizacao,
                }),
            });

            if (!resposta.ok) {
                const mensagem = await resposta.text();

                throw new Error(
                    mensagem ||
                    `Erro ao atualizar favorito: HTTP ${resposta.status}`
                );
            }

            setFavoritado(novoStatus);
        } catch (error) {
            console.error("Erro ao atualizar favorito:", error);
        } finally {
            setCarregandoFavorito(false);
        }
    }

    function abrirModalAvaliacao() {
        if (!usuarioEhCliente) return;

        setNotaSelecionada(0);
        setTituloAvaliacao("");
        setComentarioAvaliacao("");
        setAvaliacaoAnonima(false);
        setErroAvaliacao("");
        setSucessoAvaliacao("");
        setModalAvaliacaoAberto(true);
    }

    function fecharModalAvaliacao() {
        if (enviandoAvaliacao) return;

        setModalAvaliacaoAberto(false);
        setErroAvaliacao("");
        setSucessoAvaliacao("");
    }

    async function enviarAvaliacao(
        evento: React.FormEvent<HTMLFormElement>
    ) {
        evento.preventDefault();

        if (enviandoAvaliacao) return;

        setErroAvaliacao("");
        setSucessoAvaliacao("");

        if (!usuarioEhCliente) {
            setErroAvaliacao(
                "Somente clientes podem criar avaliações."
            );
            return;
        }

        if (notaSelecionada < 1 || notaSelecionada > 5) {
            setErroAvaliacao("Selecione uma nota de 1 a 5.");
            return;
        }

        const titulo = tituloAvaliacao.trim();
        const comentario = comentarioAvaliacao.trim();

        if (titulo.length < 5 || titulo.length > 25) {
            setErroAvaliacao(
                "O título deve ter entre 5 e 25 caracteres."
            );
            return;
        }

        if (comentario.length < 10 || comentario.length > 45) {
            setErroAvaliacao(
                "O comentário deve ter entre 10 e 45 caracteres."
            );
            return;
        }

        const idOrganizacao = Number(organizacao?.id_organizacao);

        if (
            !Number.isSafeInteger(idOrganizacao) ||
            idOrganizacao <= 0
        ) {
            setErroAvaliacao(
                "Não foi possível identificar a organização."
            );
            return;
        }

        setEnviandoAvaliacao(true);

        try {
            // Garante que o cliente esteja carregado antes de publicar.
            const cliente =
                clienteLogado ?? await carregarClienteLogado();

            const idCliente = Number(cliente?.id_cliente);

            if (
                !Number.isSafeInteger(idCliente) ||
                idCliente <= 0
            ) {
                throw new Error(
                    "Não foi possível identificar o cliente logado. Entre novamente na sua conta."
                );
            }

            await criarAvaliacaoApi({
                comentario,
                titulo,
                anonimo: avaliacaoAnonima ? 1 : 0,
                csat: notaSelecionada,
                id_cliente: idCliente,
                id_organizacao: idOrganizacao,
            });

            setSucessoAvaliacao(
                "Avaliação criada com sucesso!"
            );

            // Atualiza a lista após a confirmação da API.
            await carregarAvaliacoes(idOrganizacao);

            window.setTimeout(() => {
                setModalAvaliacaoAberto(false);
                setNotaSelecionada(0);
                setTituloAvaliacao("");
                setComentarioAvaliacao("");
                setAvaliacaoAnonima(false);
                setErroAvaliacao("");
                setSucessoAvaliacao("");
            }, 900);
        } catch (error) {
            console.error("Erro ao publicar avaliação:", error);

            setErroAvaliacao(
                error instanceof Error
                    ? error.message
                    : "Não foi possível criar a avaliação."
            );
        } finally {
            setEnviandoAvaliacao(false);
        }
    }
    useEffect(() => {
        if (!usuarioEhCliente || !clienteLogado?.id_cliente) {
            setFavoritado(false);
            return;
        }

        if (organizacao?.id_organizacao) {
            carregarStatusFavorito();
        }
    }, [
        usuarioEhCliente,
        organizacao?.id_organizacao,
        clienteLogado?.id_cliente,
    ]);

    useEffect(() => {
        const refs: Record<Aba, React.RefObject<HTMLDivElement | null>> = {
            inicio: inicioRef,
            perfil: perfilRef,
            posts: postsRef,
            avaliacoes: avaliacoesRef,
        };

        refs[abaSelecionada].current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, [abaSelecionada]);

    useEffect(() => {
        function pressionouEsc(evento: KeyboardEvent) {
            if (
                evento.key === "Escape" &&
                modalAvaliacaoAberto &&
                !enviandoAvaliacao
            ) {
                fecharModalAvaliacao();
            }
        }

        document.addEventListener("keydown", pressionouEsc);

        return () => {
            document.removeEventListener("keydown", pressionouEsc);
        };
    }, [modalAvaliacaoAberto, enviandoAvaliacao]);
    useEffect(() => {
        if (
            !id_pessoa ||
            !Number.isSafeInteger(idPessoa) ||
            idPessoa <= 0
        ) {
            limparDados();
            setErro("ID da organização inválido.");
            setLoading(false);
            return;
        }

        void carregarDados();
    }, [id_pessoa]);

    useEffect(() => {
        void carregarClienteLogado();
    }, [
        user?.tipo,
        user?.id_pessoa_login,
    ]);
    function BotaoAba({ aba, icon }: { aba: Aba; icon: string }) {
        return (
            <button
                type="button"
                className={`iconeMenu ${abaSelecionada === aba
                    ? "iconeMenuSelecionado"
                    : ""
                    }`}
                onClick={() => setAbaSelecionada(aba)}
                aria-label={aba}
            >
                <span>{icon}</span>
            </button>
        );
    }

    function BotaoCriarAvaliacao() {
        if (!usuarioEhCliente) return null;

        return (
            <button
                type="button"
                className="botaoCriarAvaliacao"
                onClick={abrirModalAvaliacao}
            >
                <span className="iconeBotaoAvaliacao">＋</span>
                <span>Criar avaliação</span>
            </button>
        );
    }

    function BotaoFavoritar() {
        if (!usuarioEhCliente) return null;

        return (
            <button
                type="button"
                className={`botaoFavoritar ${favoritado ? "botaoFavoritado" : ""
                    }`}
                onClick={alternarFavorito}
                disabled={carregandoFavorito}
                aria-label={
                    favoritado
                        ? "Remover dos favoritos"
                        : "Favoritar organização"
                }
            >
                <Heart
                    size={19}
                    strokeWidth={2.3}
                    fill={favoritado ? "currentColor" : "none"}
                />
                <span>
                    {carregandoFavorito
                        ? "..."
                        : favoritado
                            ? "Favoritado"
                            : "Favoritar"}
                </span>
            </button>
        );
    }

    function AbaInicio() {
        return (
            <div>
                <div className="estatisticas">
                    <Estatistica
                        numero={favoritado ? "1" : "0"}
                        texto="Favoritado"
                    />
                    <div className="divisor" />
                    <Estatistica
                        numero={String(posts.length)}
                        texto="Posts"
                    />
                    <div className="divisor" />
                    <Estatistica
                        numero={String(media)}
                        texto="Avaliação média"
                    />
                </div>

                <div className="tituloLinha">
                    <h2 className="titulo">Destaques</h2>
                </div>

                {loadingPosts ? (
                    <Loading texto="Carregando posts..." />
                ) : postsDestaques.length === 0 ? (
                    <SemPosts />
                ) : (
                    <div className="destaques">
                        {postsDestaques.map((post, index) => (
                            <PostCard
                                key={post.id_post ?? index}
                                post={post}
                            />
                        ))}
                    </div>
                )}

                <div className="tituloAvaliacaoLinha">
                    <h2 className="titulo">Avaliações dos clientes</h2>
                    <BotaoCriarAvaliacao />
                </div>

                {avaliacoes.length === 0 ? (
                    <div className="semAvaliacoesContainer">
                        <span className="semAvaliacoes">
                            Nenhuma avaliação encontrada.
                        </span>
                    </div>
                ) : (
                    avaliacoes.slice(0, 5).map((avaliacao, index) => (
                        <div
                            key={avaliacao.id_avaliacao ?? index}
                            className="cardAvaliacao"
                        >
                            <div className="dadosAvaliacao">
                                <div className="nomeCliente">
                                    {Number(avaliacao.anonimo) === 1
                                        ? "Usuário anônimo"
                                        : avaliacao.nome_cliente || "Usuário"}
                                </div>
                                <div className="tituloAvaliacao">
                                    {avaliacao.titulo || NA}
                                </div>
                            </div>
                            <div className="nota">{avaliacao.csat}</div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container">
                <div className="scrollContent">
                    <Loading texto="Carregando perfil..." />
                </div>
            </div>
        );
    }

    if (erro || !organizacao) {
        return (
            <div className="container">
                <div
                    className="scrollContent"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <h2>{erro || "Organização não encontrada"}</h2>
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            style={{
                                marginTop: "20px",
                                padding: "12px 25px",
                                border: "none",
                                borderRadius: "8px",
                                backgroundColor: "#ACCCB1",
                                cursor: "pointer",
                                fontWeight: "700",
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
                        onClick={() => navigate(-1)}
                        aria-label="Voltar"
                    >
                        ←
                    </button>

                    <div className="perfil">
                        <div className="avatar" />

                        <div className="informacoes">
                            <div className="linhaNomeFavorito">
                                <h1 className="nomeLoja">
                                    {organizacao.nome || "Organização"}
                                </h1>
                                <BotaoFavoritar />
                            </div>

                            <span className="categoria">{categoria}</span>
                            <InfoLinha texto={NA} />
                            <InfoLinha texto={NA} />
                        </div>
                    </div>
                </header>

                <main className="areaMenu">
                    <nav className="menuNavegacao">
                        <BotaoAba aba="inicio" icon="⌂" />
                        <BotaoAba aba="perfil" icon="♙" />
                        <BotaoAba aba="posts" icon="▣" />
                        <BotaoAba aba="avaliacoes" icon="☆" />
                    </nav>

                    <div className="linha" />

                    {abaSelecionada === "inicio" && (
                        <div ref={inicioRef} className="abaRef">
                            <AbaInicio />
                        </div>
                    )}

                    {abaSelecionada === "perfil" && (
                        <div
                            ref={perfilRef}
                            className="abaConteudo abaRef"
                        >
                            <h2 className="tituloAba">
                                Informações do perfil
                            </h2>

                            <div className="cardInformacoes">
                                <InfoLinha texto={organizacao.nome || NA} />
                                <InfoLinha texto={categoria} />
                                <InfoLinha
                                    texto={
                                        organizacao.cnpj ||
                                        organizacao.cpf ||
                                        NA
                                    }
                                />
                                <InfoLinha
                                    texto={organizacao.data_criacao || NA}
                                />
                                <InfoLinha texto={NA} />
                                <InfoLinha texto={NA} />
                            </div>
                        </div>
                    )}

                    {abaSelecionada === "posts" && (
                        <div
                            ref={postsRef}
                            className="abaPosts abaRef"
                        >
                            {loadingPosts ? (
                                <Loading texto="Carregando posts..." />
                            ) : posts.length === 0 ? (
                                <SemPosts grande />
                            ) : (
                                posts.map((post, index) => (
                                    <PostCard
                                        key={post.id_post ?? index}
                                        post={post}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {abaSelecionada === "avaliacoes" && (
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
                                    <strong>{media}</strong>
                                </div>
                            </div>

                            <div className="botaoAvaliacaoTopo">
                                <BotaoCriarAvaliacao />
                            </div>

                            {avaliacoes.length === 0 ? (
                                <div className="semAvaliacoesContainer">
                                    <span className="semAvaliacoes">
                                        Nenhuma avaliação encontrada.
                                    </span>
                                </div>
                            ) : (
                                avaliacoes.map((avaliacao, index) => (
                                    <div
                                        key={
                                            avaliacao.id_avaliacao ?? index
                                        }
                                        className="cardAvaliacao"
                                    >
                                        <div className="dadosAvaliacao">
                                            <div className="nomeCliente">
                                                {Number(avaliacao.anonimo) === 1
                                                    ? "Usuário anônimo"
                                                    : avaliacao.nome_cliente ||
                                                    "Usuário"}
                                            </div>

                                            <div className="tituloAvaliacao">
                                                {avaliacao.titulo || NA}
                                            </div>

                                            {avaliacao.comentario && (
                                                <div className="comentarioAvaliacao">
                                                    <div className="bolinhaComentario">
                                                        <User
                                                            size={20}
                                                            color="#7f2a2a"
                                                        />
                                                    </div>
                                                    <span className="textoComentario">
                                                        "{avaliacao.comentario}"
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="nota">
                                            {avaliacao.csat}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </main>
            </div>

            {modalAvaliacaoAberto && usuarioEhCliente && (
                <div
                    className="modalOverlay"
                    onMouseDown={(evento) => {
                        if (
                            evento.target === evento.currentTarget &&
                            !enviandoAvaliacao
                        ) {
                            fecharModalAvaliacao();
                        }
                    }}
                >
                    <div
                        className="modalAvaliacao"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tituloModalAvaliacao"
                    >
                        <div className="modalCabecalho">
                            <div>
                                <h2
                                    id="tituloModalAvaliacao"
                                    className="modalTitulo"
                                >
                                    Criar avaliação
                                </h2>
                                <p className="modalSubtitulo">
                                    Conte como foi sua experiência com
                                    esta organização.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modalFechar"
                                onClick={fecharModalAvaliacao}
                                disabled={enviandoAvaliacao}
                                aria-label="Fechar modal"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="formAvaliacao"
                            onSubmit={enviarAvaliacao}
                        >
                            <div className="campoAvaliacao">
                                <label className="labelAvaliacao">
                                    Sua nota
                                </label>

                                <div
                                    className="estrelasAvaliacao"
                                    role="radiogroup"
                                    aria-label="Escolha uma nota"
                                >
                                    {[1, 2, 3, 4, 5].map((nota) => (
                                        <button
                                            key={nota}
                                            type="button"
                                            className={`estrelaBotao ${nota <= notaSelecionada
                                                ? "estrelaSelecionada"
                                                : ""
                                                }`}
                                            onClick={() =>
                                                setNotaSelecionada(nota)
                                            }
                                            disabled={enviandoAvaliacao}
                                            aria-label={`${nota} estrela${nota > 1 ? "s" : ""
                                                }`}
                                            aria-pressed={
                                                nota === notaSelecionada
                                            }
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>

                                {notaSelecionada > 0 && (
                                    <span className="textoNota">
                                        {
                                            {
                                                1: "Muito ruim",
                                                2: "Ruim",
                                                3: "Regular",
                                                4: "Boa",
                                                5: "Excelente",
                                            }[notaSelecionada]
                                        }
                                    </span>
                                )}
                            </div>

                            <div className="campoAvaliacao">
                                <label
                                    htmlFor="tituloAvaliacao"
                                    className="labelAvaliacao"
                                >
                                    Título
                                </label>

                                <input
                                    id="tituloAvaliacao"
                                    type="text"
                                    className="inputAvaliacao"
                                    placeholder="Ex.: Excelente atendimento"
                                    value={tituloAvaliacao}
                                    onChange={(evento) =>
                                        setTituloAvaliacao(
                                            evento.target.value
                                        )
                                    }
                                    minLength={5}
                                    maxLength={25}
                                    disabled={enviandoAvaliacao}
                                />
                            </div>

                            <div className="campoAvaliacao">
                                <label
                                    htmlFor="comentarioAvaliacao"
                                    className="labelAvaliacao"
                                >
                                    Comentário
                                </label>

                                <textarea
                                    id="comentarioAvaliacao"
                                    className="textareaAvaliacao"
                                    placeholder="Conte um pouco sobre sua experiência..."
                                    value={comentarioAvaliacao}
                                    onChange={(evento) =>
                                        setComentarioAvaliacao(
                                            evento.target.value
                                        )
                                    }
                                    minLength={10}
                                    maxLength={45}
                                    rows={5}
                                    disabled={enviandoAvaliacao}
                                />

                                <span className="contadorCaracteres">
                                    {comentarioAvaliacao.length}/45
                                </span>
                            </div>

                            <label className="checkboxAnonimo">
                                <input
                                    type="checkbox"
                                    checked={avaliacaoAnonima}
                                    onChange={(evento) =>
                                        setAvaliacaoAnonima(
                                            evento.target.checked
                                        )
                                    }
                                    disabled={enviandoAvaliacao}
                                />
                                <span className="checkmark" />
                                <span className="textoAnonimo">
                                    Publicar como anônimo
                                </span>
                            </label>

                            {erroAvaliacao && (
                                <div className="mensagemErroAvaliacao">
                                    {erroAvaliacao}
                                </div>
                            )}

                            {sucessoAvaliacao && (
                                <div className="mensagemSucessoAvaliacao">
                                    {sucessoAvaliacao}
                                </div>
                            )}

                            <div className="modalRodape">
                                <button
                                    type="button"
                                    className="botaoCancelarAvaliacao"
                                    onClick={fecharModalAvaliacao}
                                    disabled={enviandoAvaliacao}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="botaoEnviarAvaliacao"
                                    disabled={enviandoAvaliacao}
                                >
                                    {enviandoAvaliacao ? (
                                        <>
                                            <span className="spinnerBotao" />
                                            Enviando...
                                        </>
                                    ) : (
                                        "Publicar avaliação"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}