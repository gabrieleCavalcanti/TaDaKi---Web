import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Star,
    MessageSquareText,
    ClipboardList,
    Building2,
    Pencil,
    Trash2,
    X,
    Save,
} from "lucide-react";

import {
    buscarAvaliacoesPorCliente,
} from "./Avaliacao";

import type { IAvaliacao } from "./Avaliacao";

import { BASE_URL, apiFetch } from "../services/api";
import "../css/AvaliaçõesCliente.css";
import "../css/Perfil.css";

type AvaliacaoEditavel = IAvaliacao & {
    id_avaliacao: number;
    titulo: string;
    comentario: string;
    csat: number;
    anonimo: number | boolean;
};

export default function MinhasAvaliacoes() {
    const navigate = useNavigate();

    async function abrirAvaliacaoNaOrganizacao(avaliacao: IAvaliacao) {
        const idOrganizacao = Number(avaliacao.id_organizacao);
        const idAvaliacao = Number(avaliacao.id_avaliacao);
        if (!Number.isSafeInteger(idOrganizacao) || idOrganizacao <= 0 ||
            !Number.isSafeInteger(idAvaliacao) || idAvaliacao <= 0) {
            setErro("Esta avaliação não possui identificação válida da organização.");
            return;
        }
        try {
            const resposta = await apiFetch<any>("/pessoas?tipo=ORGANIZACAO");
            const candidatos = [resposta?.funcionarios, resposta?.pessoas,
                resposta?.dados, resposta?.data, resposta];
            const lista = candidatos.find(Array.isArray) as any[] | undefined;
            const organizacao = lista?.find((item: any) =>
                Number(item?.id_organizacao) === idOrganizacao);
            const idPessoa = Number(organizacao?.id_pessoa);
            if (!Number.isSafeInteger(idPessoa) || idPessoa <= 0) {
                throw new Error("Não foi possível encontrar o perfil desta organização.");
            }
            navigate(`/perfil/${idPessoa}?aba=avaliacoes&avaliacao=${idAvaliacao}`);
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível abrir a organização.");
        }
    }

    const [avaliacoes, setAvaliacoes] = useState<IAvaliacao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    const [avaliacaoEditando, setAvaliacaoEditando] =
        useState<AvaliacaoEditavel | null>(null);

    const [titulo, setTitulo] = useState("");
    const [comentario, setComentario] = useState("");
    const [csat, setCsat] = useState(5);
    const [anonimo, setAnonimo] = useState(false);

    const [salvando, setSalvando] = useState(false);
    const [excluindoId, setExcluindoId] = useState<number | null>(null);

    // Considera apenas notas válidas para evitar "NaN" na média.
    const notasValidas = avaliacoes
        .map((avaliacao) => Number(avaliacao.csat))
        .filter((nota) => Number.isFinite(nota) && nota >= 1 && nota <= 5);
    const mediaAvaliacoes = notasValidas.length
        ? notasValidas.reduce((total, nota) => total + nota, 0) / notasValidas.length
        : null;

    async function carregarAvaliacoes() {
        setCarregando(true);
        setErro("");

        try {
            // Usa a mesma identificação de sessão do PerfilPessoal.
            const respostaLogin = await apiFetch<any>("/auth/me");
            const dadosLogin = respostaLogin?.user ?? respostaLogin;
            const idPessoa = Number(
                dadosLogin?.id_pessoa ?? dadosLogin?.id_pessoa_login ?? 0
            );

            if (!Number.isSafeInteger(idPessoa) || idPessoa <= 0) {
                throw new Error("Não foi possível identificar o usuário logado.");
            }

            const data = await apiFetch<any>(`/pessoas?id=${idPessoa}`);
            const candidatos = [
                data?.pessoaId, data?.pessoas, data?.pessoa,
                data?.dados, data?.data?.pessoaId, data?.data?.pessoas,
                data?.data, data,
            ];
            const pessoas = candidatos.flatMap((valor: any) =>
                Array.isArray(valor) ? valor : valor && typeof valor === "object" ? [valor] : []
            );
            const pessoa = pessoas.find(
                (item: any) =>
                    Number(item?.id_pessoa) === idPessoa ||
                    (
                        String(item?.tipo).toUpperCase() === "CLIENTE" &&
                        Number(item?.id_cliente) > 0
                    )
            );

            // O endpoint /pessoas já fornece o ID do cliente vinculado.
            // const idCliente = Number(pessoa?.id_cliente ?? pessoa?.cliente?.id_cliente);
            const idCliente = Number(pessoa?.id_cliente);
            if (!Number.isSafeInteger(idCliente) || idCliente <= 0) {
                console.error("Resposta de /pessoas:", data);
                throw new Error("Não foi possível identificar o cliente na rota /pessoas.");
            }

            const resultado = await buscarAvaliacoesPorCliente(idCliente);
            console.log("Avaliações retornadas:", resultado);
            setAvaliacoes(resultado);
        } catch (error) {
            console.error(error);

            setErro(
                error instanceof Error
                    ? error.message
                    : "Erro ao carregar avaliações."
            );
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        void carregarAvaliacoes();
    }, []);

    useEffect(() => {
        if (!avaliacaoEditando || salvando) return;
        const fecharComEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") cancelarEdicao();
        };
        window.addEventListener("keydown", fecharComEscape);
        return () => window.removeEventListener("keydown", fecharComEscape);
    }, [avaliacaoEditando, salvando]);

    function iniciarEdicao(avaliacao: IAvaliacao) {
        const id = Number(avaliacao.id_avaliacao);

        if (!Number.isSafeInteger(id) || id <= 0) {
            setErro("Não foi possível identificar esta avaliação.");
            return;
        }

        const item = avaliacao as AvaliacaoEditavel;

        setAvaliacaoEditando(item);
        setTitulo(item.titulo ?? "");
        setComentario(item.comentario ?? "");
        setCsat(Number(item.csat) || 5);
        setAnonimo(
            Number(item.anonimo) === 1 || item.anonimo === true
        );
        setErro("");
        setMensagem("");
    }

    function cancelarEdicao() {
        setAvaliacaoEditando(null);
        setTitulo("");
        setComentario("");
        setCsat(5);
        setAnonimo(false);
    }


    async function salvarEdicao(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!avaliacaoEditando) return;

        if (titulo.trim().length < 5 || titulo.trim().length > 25) {
            setErro("O título deve ter entre 5 e 25 caracteres.");
            return;
        }

        if (
            comentario.trim().length < 10 ||
            comentario.trim().length > 45
        ) {
            setErro("O comentário deve ter entre 10 e 45 caracteres.");
            return;
        }

        if (!Number.isInteger(Number(csat)) || Number(csat) < 1 || Number(csat) > 5) {
            setErro("A nota deve estar entre 1 e 5.");
            return;
        }

        const idCliente = Number(avaliacaoEditando.id_cliente);
        const idOrganizacao = Number(avaliacaoEditando.id_organizacao);

        if (
            !Number.isInteger(idCliente) ||
            idCliente <= 0 ||
            !Number.isInteger(idOrganizacao) ||
            idOrganizacao <= 0
        ) {
            setErro(
                "Não foi possível identificar o cliente ou a organização desta avaliação."
            );
            return;
        }

        setSalvando(true);
        setErro("");
        setMensagem("");

        try {
            const resposta = await fetch(
                `${BASE_URL}/Avaliacao/${avaliacaoEditando.id_avaliacao}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        titulo: titulo.trim(),
                        comentario: comentario.trim(),
                        csat: Number(csat),
                        anonimo: anonimo ? 1 : 0,
                        id_cliente: idCliente,
                        id_organizacao: idOrganizacao,
                    }),
                }
            );

            const texto = await resposta.text();

            let dados: any = {};

            try {
                dados = texto ? JSON.parse(texto) : {};
            } catch {
                dados = { message: texto };
            }

            if (!resposta.ok) {
                throw new Error(
                    dados.message ||
                    dados.mensagem ||
                    "Não foi possível editar a avaliação."
                );
            }

            cancelarEdicao();
            setMensagem("Avaliação atualizada com sucesso!");

            await carregarAvaliacoes();
        } catch (error) {
            console.error("Erro ao editar avaliação:", error);

            setErro(
                error instanceof Error
                    ? error.message
                    : "Erro ao atualizar avaliação."
            );
        } finally {
            setSalvando(false);
        }
    }


    async function excluirAvaliacao(id: number | undefined) {
        const idAvaliacao = Number(id);

        if (!Number.isSafeInteger(idAvaliacao) || idAvaliacao <= 0) {
            setErro("Não foi possível identificar esta avaliação.");
            return;
        }

        const confirmado = window.confirm(
            "Tem certeza de que deseja excluir esta avaliação? Esta ação não pode ser desfeita."
        );

        if (!confirmado) return;

        setExcluindoId(idAvaliacao);
        setErro("");
        setMensagem("");

        try {
            const resposta = await fetch(
                `${BASE_URL}/Avaliacao/${idAvaliacao}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(
                    dados.message || "Não foi possível excluir a avaliação."
                );
            }

            if (
                avaliacaoEditando?.id_avaliacao === idAvaliacao
            ) {
                cancelarEdicao();
            }

            setMensagem("Avaliação excluída com sucesso!");
            await carregarAvaliacoes();
        } catch (error) {
            console.error(error);

            setErro(
                error instanceof Error
                    ? error.message
                    : "Erro ao excluir avaliação."
            );
        } finally {
            setExcluindoId(null);
        }
    }

    if (carregando) {
        return (
            <div className="container">
                Carregando avaliações...
            </div>
        );
    }

    if (erro && avaliacoes.length === 0) {
        return (
            <div className="container">
                <p role="alert">{erro}</p>
                <button type="button" onClick={() => void carregarAvaliacoes()}>
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <main className="minhasAvaliacoesPagina">
            <div className="minhasAvaliacoesConteudo">
                <button
                    className="voltarAvaliacoes"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={19} />
                    Voltar
                </button>

                <header className="cabecalhoMinhasAvaliacoes">
                    <div className="iconeCabecalhoAvaliacoes">
                        <MessageSquareText size={29} />
                    </div>

                    <div>
                        <span className="sobreTituloAvaliacoes">
                            SUA EXPERIÊNCIA IMPORTA
                        </span>

                        <h1>Minhas avaliações</h1>

                        <p>
                            Confira suas opiniões e as experiências
                            que você compartilhou com as organizações.
                        </p>
                    </div>
                </header>

                {erro && (
                    <p role="alert" className="mensagemErroAvaliacao">
                        {erro}
                    </p>
                )}

                {mensagem && (
                    <p role="status" className="mensagemSucessoAvaliacao">
                        {mensagem}
                    </p>
                )}

                <section className="resumoAvaliacoes">
                    <article className="resumoCard">
                        <div className="resumoIcone resumoIconeRoxo">
                            <ClipboardList size={23} />
                        </div>

                        <div>
                            <span>Total de avaliações</span>
                            <strong>{avaliacoes.length}</strong>
                        </div>
                    </article>

                    <article className="resumoCard">
                        <div className="resumoIcone resumoIconeAmarelo">
                            <Star size={23} />
                        </div>

                        <div>
                            <span>Média das notas</span>
                            <strong>
                                {mediaAvaliacoes !== null
                                    ? mediaAvaliacoes.toFixed(1)
                                    : "—"}
                                <small>
                                    {mediaAvaliacoes !== null ? " / 5" : ""}
                                </small>
                            </strong>
                        </div>
                    </article>
                </section>

                <section className="listaMinhasAvaliacoes">
                    <div className="tituloListaAvaliacoes">
                        <div>
                            <h2>Seu histórico</h2>
                            <p>
                                Todas as avaliações que você publicou.
                            </p>
                        </div>

                        <span className="contadorAvaliacoes">
                            {avaliacoes.length}
                        </span>
                    </div>

                    {avaliacoes.length === 0 ? (
                        <div className="estadoVazioAvaliacoes">
                            <div className="iconeEstadoVazio">
                                <MessageSquareText size={35} />
                            </div>

                            <h3>Nenhuma avaliação por aqui</h3>

                            <p>
                                Quando você avaliar uma organização,
                                sua avaliação aparecerá nesta página.
                            </p>

                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                            >
                                Voltar
                            </button>
                        </div>
                    ) : (
                        <div className="gradeAvaliacoes">
                            {avaliacoes.map((avaliacao, index) => (
                                <article
                                    className="minhaAvaliacaoCard"
                                    key={
                                        avaliacao.id_avaliacao ?? index
                                    }
                                >
                                    <div className="avaliacaoCardTopo">
                                        <div className="iconeOrganizacao">
                                            <Building2 size={22} />
                                        </div>

                                        <div className="avaliacaoIdentificacao">
                                            <span className="rotuloAvaliacao">
                                                MINHA AVALIAÇÃO
                                            </span>

                                            <h3>
                                                <button type="button"
                                                    onClick={() => void abrirAvaliacaoNaOrganizacao(avaliacao)}
                                                    title="Ver avaliação no perfil da organização"
                                                    style={{ background: "none", border: 0, padding: 0,
                                                        font: "inherit", color: "inherit", cursor: "pointer",
                                                        textAlign: "left", textDecoration: "underline" }}>
                                                    {avaliacao.titulo || "Avaliação sem título"}
                                                </button>
                                            </h3>
                                        </div>

                                        <div className="notaDestaque">
                                            <Star
                                                size={17}
                                                fill="currentColor"
                                            />
                                            <strong>
                                                {avaliacao.csat}/5
                                            </strong>
                                        </div>
                                    </div>

                                    <div
                                        className="estrelasHistorico"
                                        aria-label={`Nota ${avaliacao.csat} de 5`}
                                    >
                                        {[1, 2, 3, 4, 5].map((estrela) => (
                                            <Star
                                                key={estrela}
                                                size={18}
                                                fill={
                                                    estrela <=
                                                        Number(avaliacao.csat)
                                                        ? "currentColor"
                                                        : "none"
                                                }
                                                className={
                                                    estrela <=
                                                        Number(avaliacao.csat)
                                                        ? "estrelaPreenchida"
                                                        : "estrelaVazia"
                                                }
                                            />
                                        ))}
                                    </div>

                                    <div className="separadorAvaliacao" />

                                    <div className="comentarioHistorico">
                                        <MessageSquareText size={18} />
                                        <p>
                                            {avaliacao.comentario ||
                                                "Nenhum comentário informado."}
                                        </p>
                                    </div>

                                    <footer className="rodapeAvaliacao">
                                        <span>
                                            {Number(avaliacao.anonimo) === 1
                                                ? "Publicada anonimamente"
                                                : "Publicada por você"}
                                        </span>
                                    </footer>

                                    <div className="acoesAvaliacao">
                                        <button
                                            type="button"
                                            className="botaoEditarAvaliacao"
                                            onClick={() => iniciarEdicao(avaliacao)}
                                        >
                                            <Pencil size={16} />
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            className="botaoExcluirAvaliacao"
                                            disabled={
                                                excluindoId ===
                                                Number(avaliacao.id_avaliacao)
                                            }
                                            onClick={() =>
                                                void excluirAvaliacao(
                                                    avaliacao.id_avaliacao
                                                )
                                            }
                                        >
                                            <Trash2 size={16} />
                                            {excluindoId ===
                                                Number(avaliacao.id_avaliacao)
                                                ? "Excluindo..."
                                                : "Excluir"}
                                        </button>
                                    </div>

                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            {avaliacaoEditando && (
                <div className="modalEdicaoOverlay">
                    <button type="button" className="modalEdicaoBackdrop"
                        aria-label="Fechar janela de edição"
                        onClick={() => { if (!salvando) cancelarEdicao(); }} />
<section
                        className="formularioEdicaoAvaliacao modalEdicaoAvaliacao"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tituloEdicaoAvaliacao"
                    >
                        <div className="tituloListaAvaliacoes">
                            <h2 id="tituloEdicaoAvaliacao">
                                Editar avaliação
                            </h2>

                            <button
                                type="button"
                                onClick={cancelarEdicao}
                                disabled={salvando}
                                aria-label="Cancelar edição"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={salvarEdicao}>
                            <label htmlFor="tituloAvaliacao">
                                Título
                            </label>

                            <input
                                id="tituloAvaliacao"
                                type="text"
                                value={titulo}
                                onChange={(event) =>
                                    setTitulo(event.target.value)
                                }
                                maxLength={150}
                                required
                            />

                            <label htmlFor="comentarioAvaliacao">
                                Comentário
                            </label>

                            <textarea
                                id="comentarioAvaliacao"
                                value={comentario}
                                onChange={(event) =>
                                    setComentario(event.target.value)
                                }
                                rows={4}
                                required
                            />

                            <label>Nota</label>

                            <div className="seletorEstrelasEdicao">
                                {[1, 2, 3, 4, 5].map((estrela) => (
                                    <button
                                        key={estrela}
                                        type="button"
                                        onClick={() => setCsat(estrela)}
                                        aria-label={`Dar nota ${estrela}`}
                                        aria-pressed={estrela <= csat}
                                    >
                                        <Star
                                            size={27}
                                            fill={
                                                estrela <= csat
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
                                    </button>
                                ))}
                            </div>

                            <label className="opcaoAnonimaAvaliacao">
                                <input
                                    type="checkbox"
                                    checked={anonimo}
                                    onChange={(event) =>
                                        setAnonimo(event.target.checked)
                                    }
                                />
                                Publicar avaliação anonimamente
                            </label>

                            <div className="acoesEdicaoAvaliacao">
                                <button
                                    type="button"
                                    onClick={cancelarEdicao}
                                    disabled={salvando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={salvando}
                                >
                                    <Save size={17} />
                                    {salvando
                                        ? "Salvando..."
                                        : "Salvar alterações"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}
