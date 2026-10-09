import {
    apiFetch,
} from "../services/api";

import "../css/Avaliação.css";

/*
 * =====================================================
 * INTERFACE DA AVALIAÇÃO
 * =====================================================
 */

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

/*
 * =====================================================
 * INTERFACE PARA CRIAR AVALIAÇÃO
 * =====================================================
 */

export interface ICriarAvaliacao {
    comentario: string;

    titulo: string;

    anonimo: boolean | number;

    csat: number | string;

    id_cliente: number;

    id_organizacao: number;
}

/*
 * =====================================================
 * BUSCAR TODAS AS AVALIAÇÕES
 * =====================================================
 */

export async function buscarAvaliacoes(): Promise<IAvaliacao[]> {
    console.log("⭐ Buscando avaliações...");

    try {
        const data = await apiFetch<any>(
            "/Avaliacao",
            {
                method: "GET",
            }
        );

        console.log(
            "📡 Resposta avaliações:",
            data
        );

        const lista =
            data?.resultadoSelecionaTodos ||
            data?.avaliacoes ||
            data?.dados ||
            data?.data ||
            data ||
            [];

        if (!Array.isArray(lista)) {
            return [];
        }

        return lista;
    } catch (error) {
        console.error(
            "❌ Erro ao buscar avaliações:",
            error
        );

        throw error;
    }
}

/*
 * =====================================================
 * BUSCAR AVALIAÇÕES POR ORGANIZAÇÃO
 * =====================================================
 */

export async function buscarAvaliacoesPorOrganizacao(
    idOrganizacao: number
): Promise<IAvaliacao[]> {
    const id = Number(idOrganizacao);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            "ID da organização inválido."
        );
    }

    console.log(
        "🏢 Buscando avaliações da organização:",
        id
    );

    const avaliacoes =
        await buscarAvaliacoes();

    return avaliacoes.filter(
        (avaliacao) =>
            Number(
                avaliacao.id_organizacao
            ) === id
    );
}

/*
 * =====================================================
 * CALCULAR MÉDIA
 * =====================================================
 */

export function calcularMediaAvaliacoes(
    avaliacoes: IAvaliacao[]
): string {
    if (!avaliacoes.length) {
        return "0,0";
    }

    const notas = avaliacoes
        .map(
            (avaliacao) =>
                Number(avaliacao.csat)
        )
        .filter(
            (nota) =>
                Number.isFinite(nota)
        );

    if (!notas.length) {
        return "0,0";
    }

    const soma = notas.reduce(
        (total, nota) =>
            total + nota,
        0
    );

    return (
        soma / notas.length
    )
        .toFixed(1)
        .replace(".", ",");
}

/*
 * =====================================================
 * CRIAR AVALIAÇÃO
 * =====================================================
 */

export async function criarAvaliacao(
    dados: ICriarAvaliacao
): Promise<any> {
    /*
     * =====================================================
     * ID CLIENTE
     *
     * IMPORTANTE:
     * Aqui deve chegar o ID da tabela CLIENTE.
     *
     * Exemplo:
     *
     * id_pessoa = 29
     * id_cliente = 13
     *
     * O valor enviado para a avaliação é 13.
     * =====================================================
     */

    const idCliente =
        Number(
            dados.id_cliente
        );

    if (
        !Number.isInteger(idCliente) ||
        idCliente <= 0
    ) {
        throw new Error(
            "ID do cliente inválido."
        );
    }

    /*
     * =====================================================
     * ID ORGANIZAÇÃO
     * =====================================================
     */

    const idOrganizacao =
        Number(
            dados.id_organizacao
        );

    if (
        !Number.isInteger(idOrganizacao) ||
        idOrganizacao <= 0
    ) {
        throw new Error(
            "ID da organização inválido."
        );
    }

    /*
     * =====================================================
     * TÍTULO
     * =====================================================
 */

    const titulo =
        String(
            dados.titulo ?? ""
        ).trim();

    if (!titulo) {
        throw new Error(
            "O título da avaliação é obrigatório."
        );
    }

    if (titulo.length < 5) {
        throw new Error(
            "O título deve ter pelo menos 5 caracteres."
        );
    }

    if (titulo.length > 25) {
        throw new Error(
            "O título pode ter no máximo 25 caracteres."
        );
    }

    /*
     * =====================================================
     * COMENTÁRIO
     * =====================================================
     */

    const comentario =
        String(
            dados.comentario ?? ""
        ).trim();

    if (!comentario) {
        throw new Error(
            "O comentário da avaliação é obrigatório."
        );
    }

    if (comentario.length < 10) {
        throw new Error(
            "O comentário deve ter pelo menos 10 caracteres."
        );
    }

    if (comentario.length > 45) {
        throw new Error(
            "O comentário pode ter no máximo 45 caracteres."
        );
    }

    /*
     * =====================================================
     * CSAT
     * =====================================================
     */

    const csat =
        Number(
            dados.csat
        );

    if (
        !Number.isInteger(csat) ||
        csat < 1 ||
        csat > 5
    ) {
        throw new Error(
            "A nota deve ser um número entre 1 e 5."
        );
    }

    /*
     * =====================================================
     * ANÔNIMO
     *
     * 0 = identificado
     * 1 = anônimo
     * =====================================================
     */

    const anonimo =
        typeof dados.anonimo === "number"
            ? Number(dados.anonimo) === 1
                ? 1
                : 0
            : dados.anonimo
                ? 1
                : 0;

    /*
     * =====================================================
     * CORPO
     * =====================================================
     */

    const corpo = {
        comentario,
        titulo,
        anonimo,
        csat,
        id_cliente: idCliente,
        id_organizacao: idOrganizacao,
    };

    console.log(
        "===================================="
    );

    console.log(
        "⭐ CRIANDO AVALIAÇÃO"
    );

    console.log(
        "📦 Corpo enviado:",
        corpo
    );

    console.log(
        "===================================="
    );

    /*
     * =====================================================
     * POST
     * =====================================================
     */

    try {
        const data =
            await apiFetch<any>(
                "/Avaliacao",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify(
                            corpo
                        ),
                }
            );

        console.log(
            "📡 Resposta da API:",
            data
        );

        const resultado =
            data?.novoRegistro ||
            data?.avaliacao ||
            data?.resultado ||
            data?.data ||
            data?.dados ||
            data;

        if (
            !resultado ||
            typeof resultado !== "object"
        ) {
            throw new Error(
                data?.message ||
                "A API não retornou o resultado da criação."
            );
        }

        /*
         * =====================================================
         * VERIFICAR INSERT
         * =====================================================
         */

        if (
            resultado.affectedRows !== undefined &&
            Number(
                resultado.affectedRows
            ) !== 1
        ) {
            throw new Error(
                "A avaliação não foi inserida no banco."
            );
        }

        console.log(
            "✅ AVALIAÇÃO CRIADA:",
            resultado
        );

        return resultado;
    } catch (error) {
        console.error(
            "❌ ERRO AO CRIAR AVALIAÇÃO:",
            error
        );

        throw error;
    }
}
