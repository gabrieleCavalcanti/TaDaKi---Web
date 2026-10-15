import { apiFetch } from "../services/api";
import "../css/Avaliação.css";

export interface IAvaliacao {
    id_avaliacao: number;
    data?: string;
    comentario: string;
    titulo: string;
    anonimo: boolean | number;
    csat: number | string;
    id_cliente: number;
    id_organizacao: number;
    nome_cliente?: string;
}

export interface ICriarAvaliacao {
    comentario: string;
    titulo: string;
    anonimo: boolean | number;
    csat: number | string;
    id_cliente: number;
    id_organizacao: number;
}

export async function buscarAvaliacoes(): Promise<IAvaliacao[]> {
    try {
        const data = await apiFetch<any>("/Avaliacao", {
            method: "GET",
        });

        const lista =
            data?.resultadoSelecionaTodos ??
            data?.avaliacoes ??
            data?.dados ??
            data?.data ??
            data ??
            [];

        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
        throw error;
    }
}

export async function buscarAvaliacoesPorOrganizacao(
    idOrganizacao: number
): Promise<IAvaliacao[]> {
    const id = Number(idOrganizacao);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID da organização inválido.");
    }

    const avaliacoes = await buscarAvaliacoes();

    return avaliacoes.filter(
        (avaliacao) => Number(avaliacao.id_organizacao) === id
    );
}

export function calcularMediaAvaliacoes(
    avaliacoes: IAvaliacao[]
): string {
    const notas = avaliacoes
        .map((avaliacao) => Number(avaliacao.csat))
        .filter((nota) => Number.isFinite(nota));

    if (notas.length === 0) {
        return "0,0";
    }

    const soma = notas.reduce((total, nota) => total + nota, 0);

    return (soma / notas.length)
        .toFixed(1)
        .replace(".", ",");
}

export async function criarAvaliacao(
    dados: ICriarAvaliacao
): Promise<any> {
    const idCliente = Number(dados.id_cliente);
    const idOrganizacao = Number(dados.id_organizacao);

    if (!Number.isInteger(idCliente) || idCliente <= 0) {
        throw new Error("ID do cliente inválido.");
    }

    if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
        throw new Error("ID da organização inválido.");
    }

    const titulo = String(dados.titulo ?? "").trim();

    if (titulo.length < 5 || titulo.length > 25) {
        throw new Error(
            "O título deve ter entre 5 e 25 caracteres."
        );
    }

    const comentario = String(dados.comentario ?? "").trim();

    if (comentario.length < 10 || comentario.length > 45) {
        throw new Error(
            "O comentário deve ter entre 10 e 45 caracteres."
        );
    }

    const csat = Number(dados.csat);

    if (!Number.isInteger(csat) || csat < 1 || csat > 5) {
        throw new Error("A nota deve ser um número entre 1 e 5.");
    }

    const anonimo =
        dados.anonimo === true ||
        Number(dados.anonimo) === 1
            ? 1
            : 0;

    const corpo: ICriarAvaliacao = {
        comentario,
        titulo,
        anonimo,
        csat,
        id_cliente: idCliente,
        id_organizacao: idOrganizacao,
    };

    try {
        const data = await apiFetch<any>("/Avaliacao", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(corpo),
        });

        const resultado =
            data?.novoRegistro ??
            data?.avaliacao ??
            data?.resultado ??
            data?.data ??
            data?.dados ??
            data;

        if (!resultado || typeof resultado !== "object") {
            throw new Error(
                data?.message ??
                "A API não retornou o resultado da criação."
            );
        }

        if (
            resultado.affectedRows !== undefined &&
            Number(resultado.affectedRows) !== 1
        ) {
            throw new Error(
                "A avaliação não foi inserida no banco."
            );
        }

        return resultado;
    } catch (error) {
        console.error("Erro ao criar avaliação:", error);
        throw error;
    }
}