import { BASE_URL } from "../services/api";

export interface IAvaliacao {
    id_avaliacao: number;
    comentario: string;
    titulo: string;
    anonimo: boolean | number;
    csat: number | string;
    id_cliente: number;
    id_organizacao: number;
    nome_cliente: string;
}

/*
 * =====================================================
 * BUSCAR TODAS AS AVALIAÇÕES
 * =====================================================
 */
export async function buscarAvaliacoes(): Promise<IAvaliacao[]> {
    try {
        const url = `${BASE_URL}/Avaliacao`;

        console.log("⭐ Buscando avaliações...");
        console.log("🌐 URL:", url);

        const response = await fetch(url, {
            credentials: "include",
        });

        console.log(
            "📡 Status avaliações:",
            response.status
        );

        if (!response.ok) {
            const textoErro =
                await response.text();

            console.error(
                "❌ Erro HTTP avaliações:",
                response.status,
                textoErro
            );

            throw new Error(
                `Erro HTTP ${response.status}: ${textoErro}`
            );
        }

        const data =
            await response.json();

        console.log(
            "📦 Resposta completa das avaliações:",
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
            console.warn(
                "⚠️ A resposta de avaliações não é um array:",
                lista
            );

            return [];
        }

        console.log(
            "✅ Total de avaliações recebidas:",
            lista.length
        );

        return lista;
    } catch (error) {
        console.error(
            "❌ ERRO NO buscarAvaliacoes:",
            error
        );

        throw error;
    }
}

/*
 * =====================================================
 * BUSCAR AVALIAÇÕES DE UMA ORGANIZAÇÃO
 * =====================================================
 */
export async function buscarAvaliacoesPorOrganizacao(
    idOrganizacao: number
): Promise<IAvaliacao[]> {
    try {
        console.log(
            "🏢 Buscando avaliações da organização:",
            idOrganizacao
        );

        const avaliacoes =
            await buscarAvaliacoes();

        console.log(
            "🔎 Filtrando avaliações pelo ID:",
            idOrganizacao
        );

        console.log(
            "📋 Todas as avaliações:",
            avaliacoes
        );

        const resultado =
            avaliacoes.filter(
                (item) => {
                    const id =
                        Number(
                            item.id_organizacao
                        );

                    const idProcurado =
                        Number(
                            idOrganizacao
                        );

                    console.log(
                        `🔍 Avaliação ${item.id_avaliacao}: organização=${id} | procurada=${idProcurado}`
                    );

                    return (
                        id ===
                        idProcurado
                    );
                }
            );

        console.log(
            "✅ Avaliações encontradas para a organização:",
            resultado.length
        );

        console.log(
            "⭐ Avaliações filtradas:",
            resultado
        );

        return resultado;
    } catch (error) {
        console.error(
            "❌ ERRO NO buscarAvaliacoesPorOrganizacao:",
            error
        );

        throw error;
    }
}

/*
 * =====================================================
 * CALCULAR MÉDIA
 * =====================================================
 */
export function calcularMediaAvaliacoes(
    avaliacoes: IAvaliacao[]
): string {
    if (
        !avaliacoes ||
        avaliacoes.length === 0
    ) {
        return "0,0";
    }

    const notas =
        avaliacoes
            .map((item) =>
                Number(item.csat)
            )
            .filter(
                (nota) =>
                    !isNaN(nota)
            );

    if (notas.length === 0) {
        return "0,0";
    }

    const soma =
        notas.reduce(
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