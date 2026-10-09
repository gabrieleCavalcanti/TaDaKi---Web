
import React, { useEffect, useState } from "react";
import {
    Star,
    User,
    Pencil,
    Heart,
    Calendar,
    AtSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getImageUrl } from "../services/api";
import "../css/PerfilPessoal.css";

const VERMELHO = "#8E0808";

interface Usuario {
    id_pessoa_login?: number;
    id_pessoa?: number;
    nome?: string;
    username?: string;
    tipo?: string;
    data_nascimento?: string;
    imagem?: string;
    email?: string;
    telefone?: string;
}

export default function PerfilPessoal() {
    const navigate = useNavigate();

    const [usuario, setUsuario] =
        useState<Usuario | null>(null);

    const [favoritos, setFavoritos] =
        useState(0);

    const [likes, setLikes] =
        useState(0);

    const [avaliacoes, setAvaliacoes] =
        useState(0);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        carregarUsuario();
    }, []);

    async function carregarUsuario() {
        try {
            setLoading(true);

            const resposta =
                await apiFetch<any>("/auth/me");

            console.log(
                "Usuário logado:",
                resposta
            );

            const dadosUsuario =
                resposta?.user ||
                resposta;

            setUsuario(dadosUsuario);

            /*
             * Depois podemos substituir esses valores
             * pelas chamadas reais da API.
             */
            setFavoritos(0);
            setLikes(0);
            setAvaliacoes(0);

        } catch (error) {
            console.error(
                "Erro ao buscar usuário logado:",
                error
            );
        } finally {
            setLoading(false);
        }
    }

    function formatarData(data?: string) {
        if (!data) return "Não informado";

        const partes = data.split("-");

        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        return data;
    }

    if (loading) {
        return (
            <div className="perfilPessoalLoading">
                <div className="spinner" />

                <span>
                    Carregando perfil...
                </span>
            </div>
        );
    }

    return (
        <div className="perfilPessoal">

            <div className="perfilPessoalConteudo">

                {/* VOLTAR */}

                <button
                    type="button"
                    className="botaoVoltarFeed"
                    onClick={() => navigate("/")}
                >
                    ← Voltar para o Feed
                </button>


                {/* PERFIL */}

                <section className="cardPerfilPessoal">

                    <div className="detalheVermelho" />

                    <div className="topoPerfilPessoal">

                        <div className="avatarPessoal">

                            {usuario?.imagem ? (

                                <img
                                    src={getImageUrl(
                                        usuario.imagem
                                    )}
                                    alt="Foto de perfil"
                                />

                            ) : (

                                <User
                                    size={55}
                                    color="#fff"
                                />

                            )}

                        </div>

                        <div className="nomePerfilPessoal">

                            <h1>
                                {usuario?.nome ||
                                    usuario?.username ||
                                    "Usuário"}
                            </h1>

                            <span>
                                @{usuario?.username || "usuario"}
                            </span>

                        </div>

                    </div>


                    {/* INFORMAÇÕES */}

                    <div className="informacoesPessoais">

                        <h2>
                            Informações pessoais
                        </h2>


                        <div className="informacoesGrid">

                            <div className="informacaoItem">

                                <div className="iconeInformacao">
                                    <User
                                        size={22}
                                        color={VERMELHO}
                                    />
                                </div>

                                <div>
                                    <span>
                                        Nome
                                    </span>

                                    <strong>
                                        {usuario?.nome ||
                                            "Não informado"}
                                    </strong>
                                </div>

                            </div>


                            <div className="informacaoItem">

                                <div className="iconeInformacao">
                                    <AtSign
                                        size={22}
                                        color={VERMELHO}
                                    />
                                </div>

                                <div>
                                    <span>
                                        Username
                                    </span>

                                    <strong>
                                        {usuario?.username
                                            ? `@${usuario.username}`
                                            : "Não informado"}
                                    </strong>
                                </div>

                            </div>


                            <div className="informacaoItem">

                                <div className="iconeInformacao">
                                    <Calendar
                                        size={22}
                                        color={VERMELHO}
                                    />
                                </div>

                                <div>
                                    <span>
                                        Data de nascimento
                                    </span>

                                    <strong>
                                        {formatarData(
                                            usuario?.data_nascimento
                                        )}
                                    </strong>
                                </div>

                            </div>


                            <div className="informacaoItem">

                                <div className="iconeInformacao">
                                    <AtSign
                                        size={22}
                                        color={VERMELHO}
                                    />
                                </div>

                                <div>
                                    <span>
                                        E-mail
                                    </span>

                                    <strong>
                                        {usuario?.email ||
                                            "Não informado"}
                                    </strong>
                                </div>

                            </div>

                        </div>

                    </div>


                    {/* EDITAR */}

                    <button
                        type="button"
                        className="botaoEditarPessoal"
                        onClick={() =>
                            navigate(
                                "/editar-perfil"
                            )
                        }
                    >
                        <Pencil
                            size={20}
                        />

                        Editar perfil
                    </button>

                </section>


                {/* MÉTRICAS */}

                <section className="secaoMetricas">

                    <div className="tituloMetricas">
                        <h2>
                            Minha atividade
                        </h2>

                        <span>
                            Acesse suas atividades
                        </span>
                    </div>


                    <div className="metricasPessoal">


                        {/* LIKES */}

                        <button
                            type="button"
                            className="metricaCard metricaLikes"
                            onClick={() =>
                                navigate("/likes")
                            }
                        >

                            <div className="iconeMetrica">
                                <Heart
                                    size={27}
                                    color={VERMELHO}
                                    fill={VERMELHO}
                                />
                            </div>

                            <div className="textoMetrica">

                                <strong>
                                    {likes}
                                </strong>

                                <span>
                                    Curtidas
                                </span>

                            </div>

                            <span className="setaMetrica">
                                →
                            </span>

                        </button>


                        {/* FAVORITOS */}

                        <button
                            type="button"
                            className="metricaCard metricaFavoritos"
                            onClick={() =>
                                navigate("/favoritos")
                            }
                        >

                            <div className="iconeMetrica">
                                <Star
                                    size={27}
                                    color="#6685A8"
                                    fill="#6685A8"
                                />
                            </div>

                            <div className="textoMetrica">

                                <strong>
                                    {favoritos}
                                </strong>

                                <span>
                                    Favoritos
                                </span>

                            </div>

                            <span className="setaMetrica">
                                →
                            </span>

                        </button>


                        {/* AVALIAÇÕES */}

                        <button
                            type="button"
                            className="metricaCard metricaAvaliacoes"
                            onClick={() =>
                                navigate("/avaliacoes")
                            }
                        >

                            <div className="iconeMetrica">
                                <User
                                    size={27}
                                    color="#666"
                                />
                            </div>

                            <div className="textoMetrica">

                                <strong>
                                    {avaliacoes}
                                </strong>

                                <span>
                                    Avaliações
                                </span>

                            </div>

                            <span className="setaMetrica">
                                →
                            </span>

                        </button>

                    </div>

                </section>

            </div>

        </div>
    );
}