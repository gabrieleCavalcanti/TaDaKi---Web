import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { Heart, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";

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

type Aba =
    | "inicio"
    | "perfil"
    | "posts"
    | "avaliacoes";

export default function PerfilScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { id_pessoa } = useParams<{
        id_pessoa: string;
    }>();

    /*
     * IMPORTANTE:
     *
     * O parâmetro da URL é o id_pessoa.
     *
     * Exemplo:
     *
     * /perfil/29
     *
     * Aqui:
     *
     * idPessoa = 29
     *
     * Porém, os posts precisam ser buscados usando:
     *
     * organizacao.id_organizacao
     *
     * e NÃO usando idPessoa.
     */
    const idPessoa = Number(id_pessoa);

    const [organizacao, setOrganizacao] =
        useState<IOrganizacao | null>(null);

    const [categoria, setCategoria] =
        useState(NA);

    const [posts, setPosts] =
        useState<IPost[]>([]);

    const [avaliacoes, setAvaliacoes] =
        useState<IAvaliacao[]>([]);

    const [favoritado, setFavoritado] =
        useState(false);

    const [carregandoFavorito, setCarregandoFavorito] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [loadingPosts, setLoadingPosts] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const [abaSelecionada, setAbaSelecionada] =
        useState<Aba>("inicio");

    const [modalAvaliacaoAberto, setModalAvaliacaoAberto] =
        useState(false);

    const [notaSelecionada, setNotaSelecionada] =
        useState(0);

    const [tituloAvaliacao, setTituloAvaliacao] =
        useState("");

    const [comentarioAvaliacao, setComentarioAvaliacao] =
        useState("");

    const [avaliacaoAnonima, setAvaliacaoAnonima] =
        useState(false);

    const [enviandoAvaliacao, setEnviandoAvaliacao] =
        useState(false);

    const [erroAvaliacao, setErroAvaliacao] =
        useState("");

    const [sucessoAvaliacao, setSucessoAvaliacao] =
        useState("");

    /*
     * Cliente logado.
     */
    const [clienteLogado, setClienteLogado] =
        useState<ICliente | null>(null);

    const inicioRef = useRef<HTMLDivElement | null>(null);
    const perfilRef = useRef<HTMLDivElement | null>(null);
    const postsRef = useRef<HTMLDivElement | null>(null);
    const avaliacoesRef = useRef<HTMLDivElement | null>(null);

    const media = useMemo(
        () => calcularMediaAvaliacoes(avaliacoes),
        [avaliacoes]
    );

    const postsDestaques = useMemo(
        () => posts.slice(0, 5),
        [posts]
    );

    function usuarioEhCliente() {
        return (
            user?.tipo?.trim().toUpperCase() ===
            "CLIENTE"
        );
    }

    /*
     * ============================================================
     * CLIENTE LOGADO
     * ============================================================
     */

    async function carregarClienteLogado() {
        if (!usuarioEhCliente()) {
            console.log(
                "[CLIENTE] Usuário não é cliente."
            );

            setClienteLogado(null);
            return;
        }

        try {
            const possiveisIds = [
                user?.id_pessoa,
                user?.id_pessoa_login,
                user?.id,
            ]
                .map(Number)
                .filter(
                    (id) =>
                        !isNaN(id) &&
                        id > 0
                );

            const idPessoaUsuario =
                possiveisIds[0];

            console.log(
                "[CLIENTE] IDs possíveis:",
                possiveisIds
            );

            console.log(
                "[CLIENTE] ID pessoa escolhido:",
                idPessoaUsuario
            );

            if (
                !idPessoaUsuario ||
                isNaN(idPessoaUsuario)
            ) {
                console.error(
                    "[CLIENTE] Não foi possível identificar o id_pessoa:",
                    user
                );

                setClienteLogado(null);
                return;
            }

            const url =
                `${BASE_URL}/clientes/id-pessoa/${idPessoaUsuario}`;

            console.log(
                "[CLIENTE] Buscando cliente:",
                url
            );

            const resposta = await fetch(
                url,
                {
                    credentials: "include",
                }
            );

            console.log(
                "[CLIENTE] Status:",
                resposta.status
            );

            if (!resposta.ok) {
                const texto =
                    await resposta.text();

                console.error(
                    "[CLIENTE] Erro:",
                    texto
                );

                throw new Error(
                    `Erro HTTP ${resposta.status}`
                );
            }

            const data =
                await resposta.json();

            console.log(
                "[CLIENTE] Resposta completa:",
                data
            );

            const cliente =
                data?.cliente ||
                data?.data?.cliente ||
                data?.data ||
                null;

            console.log(
                "[CLIENTE] Cliente encontrado:",
                cliente
            );

            if (
                !cliente ||
                !cliente.id_cliente
            ) {
                console.error(
                    "[CLIENTE] Backend não retornou cliente válido:",
                    data
                );

                setClienteLogado(null);
                return;
            }

            const clienteNormalizado: ICliente = {
                id_cliente: Number(
                    cliente.id_cliente
                ),
                id_pessoa: Number(
                    cliente.id_pessoa
                ),
                data_nascimento:
                    cliente.data_nascimento,
            };

            console.log(
                "[CLIENTE] Cliente logado normalizado:",
                clienteNormalizado
            );

            setClienteLogado(
                clienteNormalizado
            );
        } catch (error) {
            console.error(
                "[CLIENTE] Erro ao buscar cliente:",
                error
            );

            setClienteLogado(null);
        }
    }

    /*
     * ============================================================
     * EFFECTS
     * ============================================================
     */

    useEffect(() => {
        console.log(
            "================================================"
        );

        console.log(
            "[PERFIL] ID recebido pela URL:",
            id_pessoa
        );

        console.log(
            "[PERFIL] ID pessoa convertido:",
            idPessoa
        );

        console.log(
            "[PERFIL] URL atual:",
            window.location.href
        );

        console.log(
            "================================================"
        );

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
        if (!usuarioEhCliente()) {
            setClienteLogado(null);
            return;
        }

        carregarClienteLogado();
    }, [
        user?.tipo,
        user?.id,
        user?.id_pessoa,
        user?.id_pessoa_login,
    ]);

    useEffect(() => {
        if (
            !usuarioEhCliente() ||
            !organizacao?.id_organizacao
        ) {
            setFavoritado(false);
            return;
        }

        if (clienteLogado?.id_cliente) {
            carregarStatusFavorito();
        }
    }, [
        organizacao?.id_organizacao,
        clienteLogado?.id_cliente,
        user?.tipo,
    ]);

    useEffect(() => {
        const refs = {
            inicio: inicioRef,
            perfil: perfilRef,
            posts: postsRef,
            avaliacoes: avaliacoesRef,
        };

        const refSelecionada =
            refs[abaSelecionada];

        refSelecionada.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, [abaSelecionada]);

    useEffect(() => {
        function pressionouEsc(
            evento: KeyboardEvent
        ) {
            if (
                evento.key === "Escape" &&
                modalAvaliacaoAberto &&
                !enviandoAvaliacao
            ) {
                fecharModalAvaliacao();
            }
        }

        document.addEventListener(
            "keydown",
            pressionouEsc
        );

        return () => {
            document.removeEventListener(
                "keydown",
                pressionouEsc
            );
        };
    }, [
        modalAvaliacaoAberto,
        enviandoAvaliacao,
    ]);

    /*
     * ============================================================
     * CARREGAR DADOS DO PERFIL
     * ============================================================
     */

    async function carregarDados() {
        try {
            setLoading(true);
            setErro("");

            console.log(
                "[PERFIL] Iniciando carregamento..."
            );

            console.log(
                "[PERFIL] idPessoa:",
                idPessoa
            );

            const pessoa =
                await buscarPessoaPorId();

            console.log(
                "[PERFIL] Pessoa encontrada:",
                pessoa
            );

            if (!pessoa) {
                limparDados();

                setErro(
                    "Organização não encontrada."
                );

                return;
            }

            if (
                pessoa.tipo?.trim().toUpperCase() !==
                "ORGANIZACAO"
            ) {
                console.error(
                    "[PERFIL] Pessoa encontrada não é organização:",
                    pessoa
                );

                limparDados();

                setErro(
                    "Esta pessoa não é uma organização."
                );

                return;
            }

            /*
             * PRIMEIRO:
             * Descobrimos a organização e seu id_organizacao.
             */
            await carregarOrganizacao(pessoa);

            /*
             * IMPORTANTE:
             *
             * Não chamamos carregarPosts() aqui
             * usando idPessoa.
             *
             * O carregamento dos posts acontece
             * dentro de carregarOrganizacao(),
             * depois que descobrimos o id_organizacao.
             */
        } catch (error) {
            console.error(
                "[PERFIL] Erro ao carregar perfil:",
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
        setFavoritado(false);
    }

    /*
     * ============================================================
     * BUSCAR PESSOA
     * ============================================================
     */

    async function buscarPessoaPorId(): Promise<IPessoa | null> {
        console.log(
            "[PESSOA] Buscando pessoa pelo ID:",
            idPessoa
        );

        try {
            const url =
                `${BASE_URL}/pessoas/${idPessoa}`;

            console.log(
                "[PESSOA] GET:",
                url
            );

            const resposta = await fetch(
                url,
                {
                    credentials: "include",
                }
            );

            console.log(
                "[PESSOA] Status:",
                resposta.status
            );

            if (resposta.ok) {
                const data =
                    await resposta.json();

                console.log(
                    "[PESSOA] Resposta:",
                    data
                );

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
                    console.log(
                        "[PESSOA] Pessoa encontrada diretamente:",
                        pessoa
                    );

                    return pessoa;
                }

                const lista =
                    data?.pessoas ||
                    data?.funcionarios ||
                    data?.dados ||
                    [];

                if (Array.isArray(lista)) {
                    const encontrada =
                        lista.find(
                            (
                                item: IPessoa
                            ) =>
                                Number(
                                    item.id_pessoa
                                ) === idPessoa
                        );

                    if (encontrada) {
                        console.log(
                            "[PESSOA] Pessoa encontrada na lista:",
                            encontrada
                        );

                        return encontrada;
                    }
                }
            }
        } catch (error) {
            console.warn(
                "[PESSOA] Erro ao buscar pessoa por ID:",
                error
            );
        }

        /*
         * FALLBACK
         */

        try {
            const url =
                `${BASE_URL}/pessoas`;

            console.log(
                "[PESSOA] FALLBACK GET:",
                url
            );

            const resposta = await fetch(
                url,
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

            console.log(
                "[PESSOA] FALLBACK resposta:",
                data
            );

            const lista =
                data?.pessoas ||
                data?.funcionarios ||
                data?.dados ||
                data?.data ||
                [];

            if (!Array.isArray(lista)) {
                return null;
            }

            const encontrada =
                lista.find(
                    (item: IPessoa) =>
                        Number(
                            item.id_pessoa
                        ) === idPessoa
                );

            console.log(
                "[PESSOA] FALLBACK encontrada:",
                encontrada
            );

            return encontrada || null;
        } catch (error) {
            console.error(
                "[PESSOA] Erro no fallback:",
                error
            );

            return null;
        }
    }

    /*
     * ============================================================
     * CARREGAR ORGANIZAÇÃO
     * ============================================================
     */

    async function carregarOrganizacao(
        pessoa: IPessoa
    ) {
        const pessoaCompleta =
            pessoa as IOrganizacao;

        console.log(
            "================================================"
        );

        console.log(
            "[ORGANIZAÇÃO] Pessoa recebida:",
            pessoaCompleta
        );

        console.log(
            "[ORGANIZAÇÃO] id_pessoa:",
            pessoaCompleta.id_pessoa
        );

        console.log(
            "[ORGANIZAÇÃO] id_organizacao:",
            pessoaCompleta.id_organizacao
        );

        console.log(
            "================================================"
        );

        /*
         * CASO 1:
         *
         * A própria pessoa já possui id_organizacao.
         */
        if (
            pessoaCompleta.id_organizacao
        ) {
            const idOrganizacao =
                Number(
                    pessoaCompleta.id_organizacao
                );

            console.log(
                "[ORGANIZAÇÃO] ID encontrado diretamente:",
                idOrganizacao
            );

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

            /*
             * Carrega avaliações usando o ID correto.
             */
            await carregarAvaliacoes(
                idOrganizacao
            );

            /*
             * MUITO IMPORTANTE:
             *
             * Agora carregamos os posts usando
             * id_organizacao, e não id_pessoa.
             */
            await carregarPosts(
                idOrganizacao
            );

            return;
        }

        /*
         * CASO 2:
         *
         * A rota /pessoas/:id não trouxe
         * id_organizacao.
         *
         * Então buscamos todas as organizações.
         */

        try {
            const url =
                `${BASE_URL}/pessoas?tipo=ORGANIZACAO`;

            console.log(
                "[ORGANIZAÇÃO] Buscando lista de organizações:",
                url
            );

            const resposta = await fetch(
                url,
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

            console.log(
                "[ORGANIZAÇÃO] Lista de organizações:",
                data
            );

            const lista =
                data?.funcionarios ||
                data?.pessoas ||
                data?.dados ||
                data?.data ||
                [];

            if (!Array.isArray(lista)) {
                setOrganizacao(
                    pessoaCompleta
                );

                setCategoria(NA);

                setErro(
                    "Não foi possível identificar o id_organizacao."
                );

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

            console.log(
                "[ORGANIZAÇÃO] Organização encontrada na lista:",
                encontrada
            );

            if (!encontrada) {
                setOrganizacao(
                    pessoaCompleta
                );

                setCategoria(NA);

                setErro(
                    "Organização encontrada, mas o id_organizacao não foi localizado."
                );

                return;
            }

            const idOrganizacao =
                Number(
                    encontrada.id_organizacao
                );

            console.log(
                "[ORGANIZAÇÃO] ID organização encontrado:",
                idOrganizacao
            );

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

            if (
                encontrada.id_organizacao
            ) {
                /*
                 * Avaliações.
                 */
                await carregarAvaliacoes(
                    idOrganizacao
                );

                /*
                 * Posts.
                 *
                 * AGORA USAMOS O ID DA ORGANIZAÇÃO.
                 */
                await carregarPosts(
                    idOrganizacao
                );
            } else {
                setErro(
                    "A organização não possui id_organizacao."
                );
            }
        } catch (error) {
            console.error(
                "[ORGANIZAÇÃO] Erro ao buscar organização:",
                error
            );

            setOrganizacao(
                pessoaCompleta
            );

            setCategoria(NA);

            setErro(
                "Não foi possível identificar o id_organizacao da organização."
            );
        }
    }

    /*
     * ============================================================
     * CATEGORIA
     * ============================================================
     */

    async function carregarCategoria(
        idArea: number
    ) {
        try {
            const url =
                `${BASE_URL}/AreaAtuacao?id_area_atuacao=${idArea}`;

            console.log(
                "[CATEGORIA] GET:",
                url
            );

            const resposta = await fetch(
                url,
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

            console.log(
                "[CATEGORIA] Resposta:",
                data
            );

            const lista =
                data?.resultadoSelecionaId ||
                data?.dados ||
                data?.data ||
                [];

            setCategoria(
                lista[0]?.descricao || NA
            );
        } catch (error) {
            console.error(
                "[CATEGORIA] Erro:",
                error
            );

            setCategoria(NA);
        }
    }

    /*
     * ============================================================
     * AVALIAÇÕES
     * ============================================================
     */

    async function carregarAvaliacoes(
        idOrganizacaoParam?: number
    ) {
        try {
            const idOrganizacao = Number(
                idOrganizacaoParam ??
                    organizacao?.id_organizacao
            );

            console.log(
                "[AVALIAÇÕES] ID organização:",
                idOrganizacao
            );

            if (
                !idOrganizacao ||
                isNaN(idOrganizacao)
            ) {
                console.error(
                    "[AVALIAÇÕES] ID organização inválido."
                );

                setAvaliacoes([]);
                return;
            }

            const resultado =
                await buscarAvaliacoesPorOrganizacao(
                    idOrganizacao
                );

            console.log(
                "[AVALIAÇÕES] Resultado:",
                resultado
            );

            setAvaliacoes(resultado);
        } catch (error) {
            console.error(
                "[AVALIAÇÕES] Erro:",
                error
            );

            setAvaliacoes([]);
        }
    }

    /*
     * ============================================================
     * POSTS DA ORGANIZAÇÃO
     * ============================================================
     *
     * ESTA É A PARTE PRINCIPAL DA CORREÇÃO.
     *
     * Antes:
     *
     * /posts/organizacao?id_organizacao=${idPessoa}
     *
     * ERRADO.
     *
     * Agora:
     *
     * /posts/organizacao?id_organizacao=${idOrganizacao}
     *
     * CORRETO.
     */

    async function carregarPosts(
        idOrganizacaoParam?: number
    ) {
        try {
            setLoadingPosts(true);

            const idOrganizacao = Number(
                idOrganizacaoParam ??
                    organizacao?.id_organizacao
            );

            console.log(
                "================================================"
            );

            console.log(
                "[POSTS] Iniciando busca de posts."
            );

            console.log(
                "[POSTS] id_pessoa da URL:",
                idPessoa
            );

            console.log(
                "[POSTS] id_organizacao recebido:",
                idOrganizacao
            );

            console.log(
                "[POSTS] Organização atual:",
                organizacao
            );

            console.log(
                "================================================"
            );

            /*
             * Nunca buscar posts sem ID da organização.
             */
            if (
                !idOrganizacao ||
                isNaN(idOrganizacao) ||
                idOrganizacao <= 0
            ) {
                console.error(
                    "[POSTS] ID da organização inválido:",
                    idOrganizacao
                );

                setPosts([]);

                return;
            }

            /*
             * AQUI ESTÁ A CORREÇÃO.
             */
            const url =
                `${BASE_URL}/posts/organizacao?id_organizacao=${idOrganizacao}`;

            console.log(
                "[POSTS] URL final:",
                url
            );

            const resposta = await fetch(
                url,
                {
                    credentials: "include",
                }
            );

            console.log(
                "[POSTS] Status HTTP:",
                resposta.status
            );

            /*
             * Capturamos o texto primeiro para facilitar
             * o diagnóstico caso o backend retorne erro.
             */
            const textoResposta =
                await resposta.text();

            console.log(
                "[POSTS] Resposta bruta:",
                textoResposta
            );

            if (!resposta.ok) {
                throw new Error(
                    `Erro HTTP ${resposta.status}: ${textoResposta}`
                );
            }

            let data: any;

            try {
                data =
                    JSON.parse(
                        textoResposta
                    );
            } catch {
                console.error(
                    "[POSTS] Backend não retornou JSON válido."
                );

                setPosts([]);

                return;
            }

            console.log(
                "[POSTS] JSON recebido:",
                data
            );

            /*
             * Alguns backends retornam:
             *
             * { posts: [...] }
             *
             * outros podem retornar:
             *
             * { data: [...] }
             *
             * ou diretamente:
             *
             * [...]
             */
            const listaPosts =
                data?.posts ??
                data?.data ??
                data?.dados ??
                data;

            console.log(
                "[POSTS] Lista extraída:",
                listaPosts
            );

            if (!Array.isArray(listaPosts)) {
                console.error(
                    "[POSTS] Resposta não contém uma lista de posts:",
                    data
                );

                setPosts([]);

                return;
            }

            /*
             * Segurança adicional:
             *
             * Mesmo que o backend eventualmente retorne
             * posts de outras organizações, o frontend
             * mantém somente os posts da organização
             * atualmente aberta.
             */
            const postsDaOrganizacao =
                listaPosts.filter(
                    (post: IPost) => {
                        const idPostOrganizacao =
                            Number(
                                post.id_organizacao
                            );

                        return (
                            !post.id_organizacao ||
                            idPostOrganizacao ===
                                idOrganizacao
                        );
                    }
                );

            console.log(
                "[POSTS] Total recebido pelo backend:",
                listaPosts.length
            );

            console.log(
                "[POSTS] Total da organização:",
                postsDaOrganizacao.length
            );

            console.log(
                "[POSTS] Posts finais:",
                postsDaOrganizacao
            );

            setPosts(
                postsDaOrganizacao
            );
        } catch (error) {
            console.error(
                "[POSTS] ERRO AO BUSCAR POSTS:",
                error
            );

            setPosts([]);
        } finally {
            setLoadingPosts(false);
        }
    }

    /*
     * ============================================================
     * FAVORITO
     * ============================================================
     */

    async function carregarStatusFavorito() {
        if (!usuarioEhCliente()) {
            return;
        }

        const idOrganizacao = Number(
            organizacao?.id_organizacao
        );

        const idCliente = Number(
            clienteLogado?.id_cliente
        );

        if (
            !idOrganizacao ||
            isNaN(idOrganizacao) ||
            !idCliente ||
            isNaN(idCliente)
        ) {
            setFavoritado(false);
            return;
        }

        try {
            const url =
                `${BASE_URL}/favoritos?id_cliente=${idCliente}&id_organizacao=${idOrganizacao}`;

            console.log(
                "[FAVORITO] Verificando:",
                url
            );

            const resposta = await fetch(
                url,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (!resposta.ok) {
                return;
            }

            const data =
                await resposta.json();

            console.log(
                "[FAVORITO] Resposta:",
                data
            );

            const status =
                data?.favoritado ??
                data?.favorito ??
                data?.data?.favoritado ??
                data?.data?.favorito;

            if (
                typeof status ===
                "boolean"
            ) {
                setFavoritado(status);
            } else if (
                Number(status) === 1
            ) {
                setFavoritado(true);
            } else if (
                Number(status) === 0
            ) {
                setFavoritado(false);
            }
        } catch (error) {
            console.error(
                "[FAVORITO] Erro:",
                error
            );
        }
    }

    async function alternarFavorito() {
        if (!usuarioEhCliente()) {
            return;
        }

        const idOrganizacao = Number(
            organizacao?.id_organizacao
        );

        const idCliente = Number(
            clienteLogado?.id_cliente
        );

        if (
            !idOrganizacao ||
            isNaN(idOrganizacao) ||
            idOrganizacao <= 0
        ) {
            console.error(
                "[FAVORITO] Organização sem id_organizacao:",
                organizacao
            );

            return;
        }

        if (
            !idCliente ||
            isNaN(idCliente) ||
            idCliente <= 0
        ) {
            console.error(
                "[FAVORITO] Cliente sem id_cliente:",
                clienteLogado
            );

            return;
        }

        try {
            setCarregandoFavorito(true);

            if (!favoritado) {
                const resposta = await fetch(
                    `${BASE_URL}/favoritos`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            id_cliente:
                                idCliente,
                            id_organizacao:
                                idOrganizacao,
                        }),
                    }
                );

                if (!resposta.ok) {
                    const texto =
                        await resposta.text();

                    throw new Error(
                        texto ||
                            "Não foi possível favoritar a organização."
                    );
                }

                setFavoritado(true);

                return;
            }

            const resposta = await fetch(
                `${BASE_URL}/favoritos`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        id_cliente:
                            idCliente,
                        id_organizacao:
                            idOrganizacao,
                    }),
                }
            );

            if (!resposta.ok) {
                const texto =
                    await resposta.text();

                throw new Error(
                    texto ||
                        "Não foi possível remover a organização dos favoritos."
                );
            }

            setFavoritado(false);
        } catch (error) {
            console.error(
                "[FAVORITO] Erro:",
                error
            );
        } finally {
            setCarregandoFavorito(false);
        }
    }

    /*
     * ============================================================
     * AVALIAÇÃO
     * ============================================================
     */

    function abrirModalAvaliacao() {
        if (!usuarioEhCliente()) {
            return;
        }

        setNotaSelecionada(0);
        setTituloAvaliacao("");
        setComentarioAvaliacao("");
        setAvaliacaoAnonima(false);
        setErroAvaliacao("");
        setSucessoAvaliacao("");
        setModalAvaliacaoAberto(true);
    }

    function fecharModalAvaliacao() {
        if (enviandoAvaliacao) {
            return;
        }

        setModalAvaliacaoAberto(false);
        setErroAvaliacao("");
        setSucessoAvaliacao("");
    }

    async function enviarAvaliacao(
        evento: React.FormEvent<HTMLFormElement>
    ) {
        evento.preventDefault();

        setErroAvaliacao("");
        setSucessoAvaliacao("");

        if (!usuarioEhCliente()) {
            setErroAvaliacao(
                "Somente clientes podem criar avaliações."
            );

            return;
        }

        if (
            notaSelecionada < 1 ||
            notaSelecionada > 5
        ) {
            setErroAvaliacao(
                "Selecione uma nota de 1 a 5."
            );

            return;
        }

        const titulo =
            tituloAvaliacao.trim();

        if (!titulo) {
            setErroAvaliacao(
                "Digite um título para a avaliação."
            );

            return;
        }

        if (titulo.length < 5) {
            setErroAvaliacao(
                "O título deve ter pelo menos 5 caracteres."
            );

            return;
        }

        if (titulo.length > 25) {
            setErroAvaliacao(
                "O título pode ter no máximo 25 caracteres."
            );

            return;
        }

        const comentario =
            comentarioAvaliacao.trim();

        if (!comentario) {
            setErroAvaliacao(
                "Digite um comentário para a avaliação."
            );

            return;
        }

        if (comentario.length < 10) {
            setErroAvaliacao(
                "O comentário deve ter pelo menos 10 caracteres."
            );

            return;
        }

        if (comentario.length > 45) {
            setErroAvaliacao(
                "O comentário pode ter no máximo 45 caracteres."
            );

            return;
        }

        const idOrganizacao = Number(
            organizacao?.id_organizacao
        );

        if (
            !idOrganizacao ||
            isNaN(idOrganizacao) ||
            idOrganizacao <= 0
        ) {
            setErroAvaliacao(
                "Não foi possível identificar a organização."
            );

            return;
        }

        const idCliente = Number(
            clienteLogado?.id_cliente
        );

        if (
            !idCliente ||
            isNaN(idCliente) ||
            idCliente <= 0
        ) {
            console.error(
                "Cliente logado inválido:",
                {
                    clienteLogado,
                    user,
                }
            );

            setErroAvaliacao(
                "Não foi possível identificar o cliente logado."
            );

            return;
        }

        const dadosAvaliacao = {
            comentario,
            titulo,
            anonimo:
                avaliacaoAnonima ? 1 : 0,
            csat: notaSelecionada,
            id_cliente: idCliente,
            id_organizacao:
                idOrganizacao,
        };

        console.log(
            "[AVALIAÇÃO] Dados:",
            dadosAvaliacao
        );

        try {
            setEnviandoAvaliacao(true);

            await criarAvaliacaoApi(
                dadosAvaliacao
            );

            setSucessoAvaliacao(
                "Avaliação criada com sucesso!"
            );

            await carregarAvaliacoes(
                idOrganizacao
            );

            setTimeout(() => {
                setModalAvaliacaoAberto(false);
                setNotaSelecionada(0);
                setTituloAvaliacao("");
                setComentarioAvaliacao("");
                setAvaliacaoAnonima(false);
                setErroAvaliacao("");
                setSucessoAvaliacao("");
            }, 900);
        } catch (error) {
            console.error(
                "[AVALIAÇÃO] Erro:",
                error
            );

            setSucessoAvaliacao("");

            setErroAvaliacao(
                error instanceof Error
                    ? error.message
                    : "Não foi possível criar a avaliação."
            );
        } finally {
            setEnviandoAvaliacao(false);
        }
    }

    /*
     * ============================================================
     * FUNÇÕES DE UI
     * ============================================================
     */

    function mudarAba(aba: Aba) {
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

    function obterUrlImagem(
        nome?: string
    ) {
        if (!nome) {
            return "";
        }

        if (
            nome.startsWith("http://") ||
            nome.startsWith("https://")
        ) {
            return nome;
        }

        const nomeArquivo = nome
            .replace(/\\/g, "/")
            .split("/")
            .pop();

        if (!nomeArquivo) {
            return "";
        }

        return `${BASE_URL}/images/${nomeArquivo}`;
    }

    function PostCard({
        post,
    }: {
        post: IPost;
    }) {
        const imagem = obterUrlImagem(
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
                onClick={() => mudarAba(aba)}
            >
                <span>{icon}</span>
            </button>
        );
    }

    function BotaoCriarAvaliacao() {
        if (!usuarioEhCliente()) {
            return null;
        }

        return (
            <button
                type="button"
                className="botaoCriarAvaliacao"
                onClick={abrirModalAvaliacao}
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

    function BotaoFavoritar() {
        if (!usuarioEhCliente()) {
            return null;
        }

        return (
            <button
                type="button"
                className={`botaoFavoritar ${
                    favoritado
                        ? "botaoFavoritado"
                        : ""
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
                    fill={
                        favoritado
                            ? "currentColor"
                            : "none"
                    }
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

    function Estatistica({
        numero,
        texto,
    }: {
        numero: string;
        texto: string;
    }) {
        return (
            <div className="estatistica">
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
                <span>{icon}</span>

                <span className="infoTexto">
                    {texto}
                </span>
            </div>
        );
    }

    /*
     * ============================================================
     * ABA INÍCIO
     * ============================================================
     */

    function AbaInicio() {
        return (
            <div>
                <div className="estatisticas">
                    <Estatistica
                        numero={
                            favoritado
                                ? "1"
                                : "0"
                        }
                        texto="Favoritado"
                    />

                    <div className="divisor" />

                    <Estatistica
                        numero={String(
                            posts.length
                        )}
                        texto="Posts"
                    />

                    <div className="divisor" />

                    <Estatistica
                        numero={String(media)}
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
                    postsDestaques.length === 0 && (
                        <SemPosts />
                    )}

                {!loadingPosts &&
                    postsDestaques.length > 0 && (
                        <div className="destaques">
                            {postsDestaques.map(
                                (post) => (
                                    <PostCard
                                        key={
                                            post.id_post
                                        }
                                        post={post}
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

                {avaliacoes.length === 0 && (
                    <div className="semAvaliacoesContainer">
                        <span className="semAvaliacoes">
                            Nenhuma avaliação
                            encontrada.
                        </span>
                    </div>
                )}

                {avaliacoes
                    .slice(0, 5)
                    .map((avaliacao) => (
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
                                    ) === 1
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
                                {
                                    avaliacao.csat
                                }
                            </div>
                        </div>
                    ))}
            </div>
        );
    }

    /*
     * ============================================================
     * LOADING
     * ============================================================
     */

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

    /*
     * ============================================================
     * ERRO
     * ============================================================
     */

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
                    <div
                        style={{
                            textAlign: "center",
                        }}
                    >
                        <h2>
                            {erro ||
                                "Organização não encontrada"}
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/")
                            }
                            style={{
                                marginTop: "20px",
                                padding: "12px 25px",
                                border: "none",
                                borderRadius: "8px",
                                backgroundColor:
                                    "#ACCCB1",
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

    /*
     * ============================================================
     * TELA PRINCIPAL
     * ============================================================
     */

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
                            <div className="linhaNomeFavorito">
                                <h1 className="nomeLoja">
                                    {organizacao.nome ||
                                        "Organização"}
                                </h1>

                                <BotaoFavoritar />
                            </div>

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
                                    (post) => (
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
                            ref={
                                avaliacoesRef
                            }
                            className="abaAvaliacoes abaRef"
                        >
                            <div className="cabecalhoAvaliacoes">
                                <div>
                                    <h2 className="tituloAba">
                                        Avaliações
                                    </h2>

                                    <p className="subtituloAba">
                                        O que os
                                        clientes
                                        estão
                                        dizendo
                                    </p>
                                </div>

                                <div className="mediaAvaliacao">
                                    <strong>
                                        {media}
                                    </strong>
                                </div>
                            </div>

                            <div className="botaoAvaliacaoTopo">
                                <BotaoCriarAvaliacao />
                            </div>

                            {avaliacoes.length ===
                            0 ? (
                                <div className="semAvaliacoesContainer">
                                    <span className="semAvaliacoes">
                                        Nenhuma
                                        avaliação
                                        encontrada.
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

            /*
             * ========================================================
             * MODAL DE AVALIAÇÃO
             * ========================================================
             */

            {modalAvaliacaoAberto &&
                usuarioEhCliente() && (
                    <div
                        className="modalOverlay"
                        onMouseDown={(
                            evento
                        ) => {
                            if (
                                evento.target ===
                                    evento.currentTarget &&
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
                                        Criar
                                        avaliação
                                    </h2>

                                    <p className="modalSubtitulo">
                                        Conte
                                        como foi
                                        sua
                                        experiência
                                        com
                                        esta
                                        organização.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modalFechar"
                                    onClick={
                                        fecharModalAvaliacao
                                    }
                                    disabled={
                                        enviandoAvaliacao
                                    }
                                    aria-label="Fechar modal"
                                >
                                    ×
                                </button>
                            </div>

                            <form
                                className="formAvaliacao"
                                onSubmit={
                                    enviarAvaliacao
                                }
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
                                        {[1, 2, 3, 4, 5].map(
                                            (
                                                nota
                                            ) => (
                                                <button
                                                    key={
                                                        nota
                                                    }
                                                    type="button"
                                                    className={`estrelaBotao ${
                                                        nota <=
                                                        notaSelecionada
                                                            ? "estrelaSelecionada"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        setNotaSelecionada(
                                                            nota
                                                        )
                                                    }
                                                    disabled={
                                                        enviandoAvaliacao
                                                    }
                                                    aria-label={`${nota} estrela${
                                                        nota >
                                                        1
                                                            ? "s"
                                                            : ""
                                                    }`}
                                                    aria-pressed={
                                                        nota ===
                                                        notaSelecionada
                                                    }
                                                >
                                                    ★
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {notaSelecionada >
                                        0 && (
                                        <span className="textoNota">
                                            {notaSelecionada ===
                                                1 &&
                                                "Muito ruim"}

                                            {notaSelecionada ===
                                                2 &&
                                                "Ruim"}

                                            {notaSelecionada ===
                                                3 &&
                                                "Regular"}

                                            {notaSelecionada ===
                                                4 &&
                                                "Boa"}

                                            {notaSelecionada ===
                                                5 &&
                                                "Excelente"}
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
                                        value={
                                            tituloAvaliacao
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setTituloAvaliacao(
                                                evento
                                                    .target
                                                    .value
                                            )
                                        }
                                        maxLength={
                                            25
                                        }
                                        disabled={
                                            enviandoAvaliacao
                                        }
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
                                        value={
                                            comentarioAvaliacao
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setComentarioAvaliacao(
                                                evento
                                                    .target
                                                    .value
                                            )
                                        }
                                        maxLength={
                                            45
                                        }
                                        rows={5}
                                        disabled={
                                            enviandoAvaliacao
                                        }
                                    />

                                    <span className="contadorCaracteres">
                                        {
                                            comentarioAvaliacao.length
                                        }
                                        /45
                                    </span>
                                </div>

                                <label className="checkboxAnonimo">
                                    <input
                                        type="checkbox"
                                        checked={
                                            avaliacaoAnonima
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setAvaliacaoAnonima(
                                                evento
                                                    .target
                                                    .checked
                                            )
                                        }
                                        disabled={
                                            enviandoAvaliacao
                                        }
                                    />

                                    <span className="checkmark" />

                                    <span className="textoAnonimo">
                                        Publicar
                                        como
                                        anônimo
                                    </span>
                                </label>

                                {erroAvaliacao && (
                                    <div className="mensagemErroAvaliacao">
                                        {
                                            erroAvaliacao
                                        }
                                    </div>
                                )}

                                {sucessoAvaliacao && (
                                    <div className="mensagemSucessoAvaliacao">
                                        {
                                            sucessoAvaliacao
                                        }
                                    </div>
                                )}

                                <div className="modalRodape">
                                    <button
                                        type="button"
                                        className="botaoCancelarAvaliacao"
                                        onClick={
                                            fecharModalAvaliacao
                                        }
                                        disabled={
                                            enviandoAvaliacao
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="botaoEnviarAvaliacao"
                                        disabled={
                                            enviandoAvaliacao
                                        }
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
