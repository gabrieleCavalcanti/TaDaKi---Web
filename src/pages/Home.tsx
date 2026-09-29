// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth";
// import logo from "../assets/Logo.png";

// export const Home: React.FC = () => {

//     const { user, loading, logout } = useAuth();
//     const navigate = useNavigate();

//     const handleSair = async () => {
//         await logout();
//         navigate("/login");
//     };

//     if (loading) {
//         return (
//             <div
//                 style={{
//                     width: "100%",
//                     height: "100vh",
//                     display: "flex",
//                     justifyContent: "center",
//                     alignItems: "center",
//                     backgroundColor: "#dbe5f3",
//                 }}
//             >
//                 <h2>Carregando...</h2>
//             </div>
//         );
//     }

//     const usuario = user as unknown as {
//         nome?: string;
//         username?: string;
//         email?: string;
//     };

//     const nomeUsuario =
//         usuario?.nome ||
//         usuario?.username ||
//         usuario?.email?.split("@")[0] ||
//         "Usuário";

//     return (
//         <main
//             style={{
//                 width: "100%",
//                 height: "100vh",
//                 backgroundColor: "#dbe5f3",
//                 display: "flex",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 fontFamily: "Georgia, 'Times New Roman', serif",
//                 padding: "20px",
//             }}
//         >
//             <section
//                 style={{
//                     width: "485px",
//                     minHeight: "355px",
//                     backgroundColor: "#f4f7fb",
//                     borderRadius: "5px",
//                     display: "flex",
//                     flexDirection: "column",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     padding: "30px 40px",
//                     boxSizing: "border-box",
//                 }}
//             >

//                 {/* LOGO */}
//                 <img
//                     src={logo}
//                     alt="TaDaki"
//                     style={{
//                         width: "185px",
//                         height: "auto",
//                         marginBottom: "28px",
//                     }}
//                 />

//                 {/* TÍTULO */}
//                 <h1
//                     style={{
//                         fontSize: "40px",
//                         fontWeight: "bold",
//                         color: "#000",
//                         margin: "0",
//                         lineHeight: "1.1",
//                         textAlign: "center",
//                     }}
//                 >
//                     Seja Bem Vindo!
//                 </h1>

//                 {/* NOME DO USUÁRIO LOGADO */}
//                 <h2
//                     style={{
//                         fontSize: "38px",
//                         fontWeight: "normal",
//                         color: "#c91019",
//                         marginTop: "5px",
//                         marginBottom: "25px",
//                         textAlign: "center",
//                     }}
//                 >
//                     {nomeUsuario}
//                 </h2>

//                 {/* BOTÕES */}
//                 <div
//                     style={{
//                         display: "flex",
//                         justifyContent: "center",
//                         alignItems: "center",
//                         gap: "34px",
//                     }}
//                 >
//                     <button
//                         type="button"
//                         onClick={() => {
//                             console.log("Entrar");
//                         }}
//                         style={{
//                             width: "115px",
//                             height: "36px",
//                             border: "none",
//                             borderRadius: "6px",
//                             backgroundColor: "#acd5b7",
//                             color: "#ffffff",
//                             fontSize: "20px",
//                             fontFamily: "Georgia, 'Times New Roman', serif",
//                             cursor: "pointer",
//                         }}
//                     >
//                         Entrar
//                     </button>
//                     <button
//                         type="button"
//                         onClick={() => navigate("/perfil")}
//                         style={{
//                             width: "115px",
//                             height: "36px",
//                             border: "none",
//                             borderRadius: "6px",
//                             backgroundColor: "#acd5b7",
//                             color: "#ffffff",
//                             fontSize: "20px",
//                             fontFamily: "Georgia, 'Times New Roman', serif",
//                             cursor: "pointer",
//                         }}
//                     >
//                         Perfil
//                     </button>

//                     <button
//                         type="button"
//                         onClick={handleSair}
//                         style={{
//                             width: "115px",
//                             height: "36px",
//                             border: "none",
//                             borderRadius: "6px",
//                             backgroundColor: "#c40e15",
//                             color: "#ffffff",
//                             fontSize: "20px",
//                             fontFamily: "Georgia, 'Times New Roman', serif",
//                             cursor: "pointer",
//                         }}
//                     >
//                         Sair
//                     </button>
//                 </div>
//             </section>
//         </main>
//     );
// };




import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BASE_URL } from "../services/api";
import logo from "../assets/Logo.png";

interface IOrganizacao {
    id_pessoa: number;
    nome: string;
    tipo: string;
    cpf?: string | null;
    cnpj?: string | null;
    data_criacao?: string | null;
    id_area_atuacao?: number | null;
}

export const Home: React.FC = () => {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    const [organizacoes, setOrganizacoes] = useState<IOrganizacao[]>([]);
    const [loadingOrganizacoes, setLoadingOrganizacoes] = useState(true);
    const [erroOrganizacoes, setErroOrganizacoes] = useState("");

    /**
     * Busca todas as organizações cadastradas no banco.
     */
    useEffect(() => {
        const carregarOrganizacoes = async () => {
            try {
                setLoadingOrganizacoes(true);
                setErroOrganizacoes("");

                console.log("📡 Buscando organizações...");
                console.log("🌐 URL:", `${BASE_URL}/pessoas`);

                const resposta = await fetch(
                    `${BASE_URL}/pessoas?tipo=ORGANIZACAO`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!resposta.ok) {
                    throw new Error(
                        `Erro HTTP ${resposta.status}`
                    );
                }

                const dados = await resposta.json();

                console.log(
                    "✅ Resposta das organizações:",
                    dados
                );

                /**
                 * No seu React Native você estava usando:
                 *
                 * resposta.data?.funcionarios || []
                 *
                 * Por isso mantemos essa estrutura.
                 *
                 * Também deixei algumas alternativas para caso
                 * seu backend retorne diretamente um array.
                 */
                const lista: IOrganizacao[] = Array.isArray(dados)
                    ? dados
                    : dados?.funcionarios ||
                    dados?.organizacoes ||
                    dados?.data ||
                    [];

                console.log(
                    "🏢 Organizações encontradas:",
                    lista.length
                );

                setOrganizacoes(lista);
            } catch (error) {
                console.error(
                    "❌ Erro ao buscar organizações:",
                    error
                );

                setOrganizacoes([]);

                setErroOrganizacoes(
                    "Não foi possível carregar as organizações."
                );
            } finally {
                setLoadingOrganizacoes(false);
            }
        };

        carregarOrganizacoes();
    }, []);

    /**
     * Faz logout.
     */
    const handleSair = async () => {
        await logout();
        navigate("/login");
    };

    /**
     * Abre o perfil da organização.
     *
     * IMPORTANTE:
     * Cada organização recebe seu próprio id_pessoa.
     *
     * Exemplo:
     * /perfil/10
     * /perfil/15
     * /perfil/23
     */
    const abrirPerfilOrganizacao = (
        organizacao: IOrganizacao
    ) => {
        console.log(
            "➡️ Abrindo perfil da organização:",
            organizacao.id_pessoa,
            organizacao.nome
        );

        navigate(`/perfil/${organizacao.id_pessoa}`);
    };

    /**
     * Primeira letra do nome para o avatar.
     */
    const primeiraLetra = (nome?: string) => {
        return (
            nome?.trim()?.charAt(0)?.toUpperCase() || "O"
        );
    };

    /**
     * Usuário logado.
     */
    if (loading) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#dbe5f3",
                    fontFamily:
                        "Georgia, 'Times New Roman', serif",
                }}
            >
                <h2>Carregando...</h2>
            </div>
        );
    }

    const usuario = user as unknown as {
        nome?: string;
        username?: string;
        email?: string;
    };

    const nomeUsuario =
        usuario?.nome ||
        usuario?.username ||
        usuario?.email?.split("@")[0] ||
        "Usuário";

    return (
        <main
            style={{
                width: "100%",
                minHeight: "100vh",
                backgroundColor: "#dbe5f3",
                fontFamily:
                    "Georgia, 'Times New Roman', serif",
                padding: "20px",
                boxSizing: "border-box",
            }}
        >
            {/* CONTEÚDO PRINCIPAL */}

            <div
                style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                }}
            >
                {/* CARD DE BOAS-VINDAS */}

                <section
                    style={{
                        width: "100%",
                        minHeight: "355px",
                        backgroundColor: "#f4f7fb",
                        borderRadius: "5px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "30px 40px",
                        boxSizing: "border-box",
                        marginBottom: "30px",
                    }}
                >
                    {/* LOGO */}

                    <img
                        src={logo}
                        alt="TaDaki"
                        style={{
                            width: "185px",
                            height: "auto",
                            marginBottom: "28px",
                        }}
                    />

                    {/* TÍTULO */}

                    <h1
                        style={{
                            fontSize: "40px",
                            fontWeight: "bold",
                            color: "#000",
                            margin: "0",
                            lineHeight: "1.1",
                            textAlign: "center",
                        }}
                    >
                        Seja Bem Vindo!
                    </h1>

                    {/* NOME */}

                    <h2
                        style={{
                            fontSize: "38px",
                            fontWeight: "normal",
                            color: "#c91019",
                            marginTop: "5px",
                            marginBottom: "25px",
                            textAlign: "center",
                        }}
                    >
                        {nomeUsuario}
                    </h2>

                    {/* BOTÕES */}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "34px",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                document
                                    .getElementById(
                                        "organizacoes"
                                    )
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                    });
                            }}
                            style={{
                                width: "115px",
                                height: "36px",
                                border: "none",
                                borderRadius: "6px",
                                backgroundColor: "#acd5b7",
                                color: "#ffffff",
                                fontSize: "20px",
                                fontFamily:
                                    "Georgia, 'Times New Roman', serif",
                                cursor: "pointer",
                            }}
                        >
                            Entrar
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/perfil")
                            }
                            style={{
                                width: "115px",
                                height: "36px",
                                border: "none",
                                borderRadius: "6px",
                                backgroundColor: "#acd5b7",
                                color: "#ffffff",
                                fontSize: "20px",
                                fontFamily:
                                    "Georgia, 'Times New Roman', serif",
                                cursor: "pointer",
                            }}
                        >
                            Perfil
                        </button>

                        <button
                            type="button"
                            onClick={handleSair}
                            style={{
                                width: "115px",
                                height: "36px",
                                border: "none",
                                borderRadius: "6px",
                                backgroundColor: "#c40e15",
                                color: "#ffffff",
                                fontSize: "20px",
                                fontFamily:
                                    "Georgia, 'Times New Roman', serif",
                                cursor: "pointer",
                            }}
                        >
                            Sair
                        </button>
                    </div>
                </section>

                {/* ORGANIZAÇÕES */}

                <section
                    id="organizacoes"
                    style={{
                        width: "100%",
                        backgroundColor: "#f4f7fb",
                        borderRadius: "5px",
                        padding: "30px",
                        boxSizing: "border-box",
                    }}
                >
                    {/* CABEÇALHO */}

                    <div
                        style={{
                            marginBottom: "25px",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "30px",
                                fontWeight: "700",
                                color: "#111",
                                margin: 0,
                            }}
                        >
                            Descubra organizações
                        </h2>

                        <p
                            style={{
                                fontSize: "15px",
                                color: "#666",
                                marginTop: "8px",
                                marginBottom: 0,
                            }}
                        >
                            Encontre empresas e conheça seus
                            perfis.
                        </p>
                    </div>

                    {/* LOADING */}

                    {loadingOrganizacoes && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "60px 20px",
                            }}
                        >
                            <div
                                style={{
                                    width: "35px",
                                    height: "35px",
                                    border: "4px solid #d8dfda",
                                    borderTop:
                                        "4px solid #66816d",
                                    borderRadius: "50%",
                                    animation:
                                        "spin 1s linear infinite",
                                }}
                            />

                            <p
                                style={{
                                    marginTop: "15px",
                                    color: "#666",
                                }}
                            >
                                Carregando organizações...
                            </p>
                        </div>
                    )}

                    {/* ERRO */}

                    {!loadingOrganizacoes &&
                        erroOrganizacoes && (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "40px 20px",
                                    color: "#c40e15",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "40px",
                                        marginBottom: "10px",
                                    }}
                                >
                                    ⚠️
                                </div>

                                <p
                                    style={{
                                        fontSize: "16px",
                                        margin: 0,
                                    }}
                                >
                                    {erroOrganizacoes}
                                </p>
                            </div>
                        )}

                    {/* NENHUMA ORGANIZAÇÃO */}

                    {!loadingOrganizacoes &&
                        !erroOrganizacoes &&
                        organizacoes.length === 0 && (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "60px 20px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "50px",
                                        marginBottom: "15px",
                                    }}
                                >
                                    🏢
                                </div>

                                <h3
                                    style={{
                                        fontSize: "20px",
                                        color: "#111",
                                        margin: "0 0 8px",
                                    }}
                                >
                                    Nenhuma organização
                                    encontrada
                                </h3>

                                <p
                                    style={{
                                        fontSize: "14px",
                                        color: "#777",
                                        margin: 0,
                                    }}
                                >
                                    Ainda não existem
                                    organizações cadastradas.
                                </p>
                            </div>
                        )}

                    {/* CONTADOR */}

                    {!loadingOrganizacoes &&
                        !erroOrganizacoes &&
                        organizacoes.length > 0 && (
                            <>
                                <div
                                    style={{
                                        marginBottom: "15px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            color: "#777",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {organizacoes.length}{" "}
                                        {organizacoes.length ===
                                            1
                                            ? "organização"
                                            : "organizações"}
                                    </span>
                                </div>

                                {/* GRID DOS CARDS */}

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fill, minmax(300px, 1fr))",
                                        gap: "18px",
                                    }}
                                >
                                    {organizacoes.map(
                                        (
                                            organizacao,
                                            index
                                        ) => (
                                            <div
                                                key={`${organizacao.id_pessoa}-${index}`}
                                                onClick={() =>
                                                    abrirPerfilOrganizacao(
                                                        organizacao
                                                    )
                                                }
                                                style={{
                                                    backgroundColor:
                                                        "#ffffff",
                                                    borderRadius:
                                                        "22px",
                                                    padding:
                                                        "18px",
                                                    cursor: "pointer",
                                                    boxShadow:
                                                        "0 2px 8px rgba(0,0,0,0.08)",
                                                    transition:
                                                        "transform 0.2s ease, box-shadow 0.2s ease",
                                                }}
                                                onMouseEnter={(
                                                    e
                                                ) => {
                                                    e.currentTarget.style.transform =
                                                        "translateY(-3px)";
                                                    e.currentTarget.style.boxShadow =
                                                        "0 5px 15px rgba(0,0,0,0.12)";
                                                }}
                                                onMouseLeave={(
                                                    e
                                                ) => {
                                                    e.currentTarget.style.transform =
                                                        "translateY(0)";
                                                    e.currentTarget.style.boxShadow =
                                                        "0 2px 8px rgba(0,0,0,0.08)";
                                                }}
                                            >
                                                {/* PARTE SUPERIOR */}

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                    }}
                                                >
                                                    {/* AVATAR */}

                                                    <div
                                                        style={{
                                                            width: "64px",
                                                            height: "64px",
                                                            minWidth:
                                                                "64px",
                                                            borderRadius:
                                                                "50%",
                                                            backgroundColor:
                                                                "#ACCCB1",
                                                            display:
                                                                "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "27px",
                                                                fontWeight:
                                                                    "700",
                                                                color: "#111",
                                                            }}
                                                        >
                                                            {primeiraLetra(
                                                                organizacao.nome
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* NOME */}

                                                    <div
                                                        style={{
                                                            flex: 1,
                                                            marginLeft:
                                                                "14px",
                                                            minWidth:
                                                                0,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "18px",
                                                                fontWeight:
                                                                    "700",
                                                                color: "#111",
                                                                whiteSpace:
                                                                    "nowrap",
                                                                overflow:
                                                                    "hidden",
                                                                textOverflow:
                                                                    "ellipsis",
                                                            }}
                                                        >
                                                            {organizacao.nome ||
                                                                "Organização"}
                                                        </div>

                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "11px",
                                                                fontWeight:
                                                                    "600",
                                                                color: "#66816D",
                                                                marginTop:
                                                                    "5px",
                                                                letterSpacing:
                                                                    "0.5px",
                                                            }}
                                                        >
                                                            ORGANIZAÇÃO
                                                        </div>
                                                    </div>

                                                    {/* SETA */}

                                                    <span
                                                        style={{
                                                            fontSize:
                                                                "27px",
                                                            color: "#111",
                                                            marginLeft:
                                                                "8px",
                                                        }}
                                                    >
                                                        →
                                                    </span>
                                                </div>

                                                {/* LINHA */}

                                                <div
                                                    style={{
                                                        height: "1px",
                                                        backgroundColor:
                                                            "#E5E3D8",
                                                        margin:
                                                            "17px 0",
                                                    }}
                                                />

                                                {/* INFORMAÇÕES */}

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        gap: "15px",
                                                    }}
                                                >
                                                    {/* ID */}

                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",
                                                            alignItems:
                                                                "center",
                                                            flex: 1,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "21px",
                                                                marginRight:
                                                                    "8px",
                                                            }}
                                                        >
                                                            🏢
                                                        </span>

                                                        <div
                                                            style={{
                                                                minWidth:
                                                                    0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "10px",
                                                                    color: "#999",
                                                                    marginBottom:
                                                                        "2px",
                                                                }}
                                                            >
                                                                ID
                                                            </div>

                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "12px",
                                                                    color: "#333",
                                                                    fontWeight:
                                                                        "500",
                                                                }}
                                                            >
                                                                {
                                                                    organizacao.id_pessoa
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* DOCUMENTO */}

                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",
                                                            alignItems:
                                                                "center",
                                                            flex: 1,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "21px",
                                                                marginRight:
                                                                    "8px",
                                                            }}
                                                        >
                                                            📄
                                                        </span>

                                                        <div
                                                            style={{
                                                                minWidth:
                                                                    0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "10px",
                                                                    color: "#999",
                                                                    marginBottom:
                                                                        "2px",
                                                                }}
                                                            >
                                                                Documento
                                                            </div>

                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "12px",
                                                                    color: "#333",
                                                                    fontWeight:
                                                                        "500",
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                    overflow:
                                                                        "hidden",
                                                                    textOverflow:
                                                                        "ellipsis",
                                                                }}
                                                            >
                                                                {organizacao.cnpj ||
                                                                    organizacao.cpf ||
                                                                    "Não informado"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* BOTÃO */}

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "17px",
                                                        backgroundColor:
                                                            "#ACCCB1",
                                                        borderRadius:
                                                            "18px",
                                                        minHeight:
                                                            "45px",
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize:
                                                                "14px",
                                                            fontWeight:
                                                                "700",
                                                            color: "#111",
                                                        }}
                                                    >
                                                        Ver perfil
                                                    </span>

                                                    <span
                                                        style={{
                                                            fontSize:
                                                                "20px",
                                                            color: "#111",
                                                            marginLeft:
                                                                "8px",
                                                        }}
                                                    >
                                                        →
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </>
                        )}
                </section>
            </div>

            {/* ANIMAÇÃO DO LOADING */}

            <style>
                {`
                    @keyframes spin {
                        from {
                            transform: rotate(0deg);
                        }

                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}
            </style>
        </main>
    );
};
