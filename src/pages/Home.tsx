import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/Logo.png";

export const Home: React.FC = () => {

    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    const handleSair = async () => {
        await logout();
        navigate("/login");
    };

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
                height: "100vh",
                backgroundColor: "#dbe5f3",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: "Georgia, 'Times New Roman', serif",
                padding: "20px",
            }}
        >
            <section
                style={{
                    width: "485px",
                    minHeight: "355px",
                    backgroundColor: "#f4f7fb",
                    borderRadius: "5px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "30px 40px",
                    boxSizing: "border-box",
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

                {/* NOME DO USUÁRIO LOGADO */}
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
                    }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            console.log("Entrar");
                        }}
                        style={{
                            width: "115px",
                            height: "36px",
                            border: "none",
                            borderRadius: "6px",
                            backgroundColor: "#acd5b7",
                            color: "#ffffff",
                            fontSize: "20px",
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            cursor: "pointer",
                        }}
                    >
                        Entrar
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
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            cursor: "pointer",
                        }}
                    >
                        Sair
                    </button>
                </div>
            </section>
        </main>
    );
};