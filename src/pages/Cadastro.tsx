import React, { useState } from "react";

import {
    CircleUser,
    Mail,
    CalendarDays,
    CreditCard,
    Eye,
    EyeOff,
    Building2,
} from "lucide-react";

import "../App.css";

export const Cadastro: React.FC = () => {

    const [tipoUsuario, setTipoUsuario] = useState<
        "cliente" | "organizacao"
    >("cliente");

    const organizacao = tipoUsuario === "organizacao";

    const [mostrarSenhaCliente, setMostrarSenhaCliente] =
        useState(false);

    const [mostrarConfirmacaoCliente, setMostrarConfirmacaoCliente] =
        useState(false);


    const [mostrarSenhaOrganizacao, setMostrarSenhaOrganizacao] =
        useState(false);

    const [mostrarConfirmacaoOrganizacao, setMostrarConfirmacaoOrganizacao] =
        useState(false);


    const [tipoDocumento, setTipoDocumento] = useState<
        "cpf" | "cnpj"
    >("cnpj");

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setErrorMessage(null);
        setSuccessMessage(null);
        setLoadingSubmit(true);

        try {
            const formData = new FormData(e.currentTarget);

            if (tipoUsuario === "cliente") {
                const nome = formData.get("nome") as string;
                const usuario = formData.get("usuario") as string;
                const email = formData.get("email") as string;
                const senha = formData.get("senha") as string;
                const confirmarSenha = formData.get(
                    "confirmarSenha"
                ) as string;
                const dataNascimento = formData.get(
                    "dataNascimento"
                ) as string;

                if (
                    !nome ||
                    !usuario ||
                    !email ||
                    !senha ||
                    !confirmarSenha ||
                    !dataNascimento
                ) {
                    setErrorMessage(
                        "Preencha todos os campos."
                    );
                    return;
                }

                if (senha !== confirmarSenha) {
                    setErrorMessage(
                        "As senhas não coincidem."
                    );
                    return;
                }

                // Aqui você chama sua função/API de cadastro
                await cadastrarCliente({
                    nome,
                    usuario,
                    email,
                    senha,
                    dataNascimento,
                });

            } else {
                const nomeOrganizacao = formData.get(
                    "nomeOrganizacao"
                ) as string;

                const nomeFantasia = formData.get(
                    "nomeFantasia"
                ) as string;

                const usuario = formData.get(
                    "usuario"
                ) as string;

                const email = formData.get(
                    "email"
                ) as string;

                const senha = formData.get(
                    "senha"
                ) as string;

                const confirmarSenha = formData.get(
                    "confirmarSenha"
                ) as string;

                const documento = formData.get(
                    tipoDocumento
                ) as string;

                if (
                    !nomeOrganizacao ||
                    !nomeFantasia ||
                    !usuario ||
                    !email ||
                    !senha ||
                    !confirmarSenha ||
                    !documento
                ) {
                    setErrorMessage(
                        "Preencha todos os campos."
                    );
                    return;
                }

                if (senha !== confirmarSenha) {
                    setErrorMessage(
                        "As senhas não coincidem."
                    );
                    return;
                }

                // Aqui você chama sua função/API
                await cadastrarOrganizacao({
                    nomeOrganizacao,
                    nomeFantasia,
                    usuario,
                    email,
                    senha,
                    tipoDocumento,
                    documento,
                });
            }

            setSuccessMessage(
                "Cadastro realizado com sucesso!"
            );

        } catch (error) {
            console.error(error);

            setErrorMessage(
                "Não foi possível realizar o cadastro."
            );

        } finally {
            setLoadingSubmit(false);
        }
    };
    return (
        <main className="cadastro-page">

            <div
                className={`cadastro-container ${organizacao ? "active" : ""
                    }`}
            >

                {/* ================================================= */}
                {/* FORMULÁRIO CLIENTE */}
                {/* ================================================= */}

                <div className="form-box cliente">

                    <form>

                        <h1>Cadastro de Cliente</h1>

                        <div className="input-box">

                            <input
                                type="text"
                                id="nomeCliente"
                                name="nome"
                                placeholder="Nome completo"
                            />

                            <CircleUser size={20} />

                        </div>

                        <div className="input-box">

                            <input
                                type="text"
                                id="usuarioCliente"
                                name="usuario"
                                placeholder="Usuário"
                            />

                            <CircleUser size={20} />

                        </div>

                        <div className="input-box">

                            <input
                                type="email"
                                id="emailCliente"
                                name="email"
                                placeholder="E-mail"
                            />

                            <Mail size={20} />

                        </div>

                        <div className="input-box">

                            <input
                                type={
                                    mostrarSenhaCliente
                                        ? "text"
                                        : "password"
                                }
                                id="senhaCliente"
                                name="senha"
                                placeholder="Senha"
                            />

                            <button
                                type="button"
                                className="icon-button"
                                onClick={() =>
                                    setMostrarSenhaCliente(
                                        !mostrarSenhaCliente
                                    )
                                }
                            >

                                {mostrarSenhaCliente ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}

                            </button>

                        </div>

                        <div className="input-box">

                            <input
                                type={
                                    mostrarConfirmacaoCliente
                                        ? "text"
                                        : "password"
                                }
                                id="confirmarSenhaCliente"
                                name="confirmarSenha"
                                placeholder="Confirmar senha"
                            />

                            <button
                                type="button"
                                className="icon-button"
                                onClick={() =>
                                    setMostrarConfirmacaoCliente(
                                        !mostrarConfirmacaoCliente
                                    )
                                }
                            >

                                {mostrarConfirmacaoCliente ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}

                            </button>

                        </div>

                        <div className="input-box">

                            <input
                                type="date"
                                id="dataNascimento"
                                name="dataNascimento"
                                aria-label="Data de nascimento"
                            />

                            <CalendarDays size={20} />

                        </div>


                        {/* BOTÃO */}

                        <button
                            type="button"
                            className="cadastro-btn"
                        >
                            Cadastrar
                        </button>

                    </form>

                </div>


                {/* ================================================= */}
                {/* FORMULÁRIO ORGANIZAÇÃO */}
                {/* ================================================= */}

                <div className="form-box organizacao">

                    <form>

                        <h1>Cadastro de Organização</h1>

                        <div className="input-box">

                            <input
                                type="text"
                                id="nomeOrganizacao"
                                name="nomeOrganizacao"
                                placeholder="Nome da organização"
                            />

                            <Building2 size={20} />

                        </div>


                        <div className="input-box">

                            <input
                                type="text"
                                id="nomeFantasia"
                                name="nomeFantasia"
                                placeholder="Nome fantasia"
                            />

                            <Building2 size={20} />

                        </div>

                        <div className="input-box">

                            <input
                                type="text"
                                id="usuarioOrganizacao"
                                name="usuario"
                                placeholder="Usuário"
                            />

                            <CircleUser size={20} />

                        </div>

                        <div className="input-box">

                            <input
                                type="email"
                                id="emailOrganizacao"
                                name="email"
                                placeholder="E-mail"
                            />

                            <Mail size={20} />

                        </div>

                        <div className="input-box">

                            <input
                                type={
                                    mostrarSenhaOrganizacao
                                        ? "text"
                                        : "password"
                                }
                                id="senhaOrganizacao"
                                name="senha"
                                placeholder="Senha"
                            />

                            <button
                                type="button"
                                className="icon-button"
                                onClick={() =>
                                    setMostrarSenhaOrganizacao(
                                        !mostrarSenhaOrganizacao
                                    )
                                }
                            >

                                {mostrarSenhaOrganizacao ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}

                            </button>

                        </div>

                        <div className="input-box">

                            <input
                                type={
                                    mostrarConfirmacaoOrganizacao
                                        ? "text"
                                        : "password"
                                }
                                id="confirmarSenhaOrganizacao"
                                name="confirmarSenha"
                                placeholder="Confirmar senha"
                            />

                            <button
                                type="button"
                                className="icon-button"
                                onClick={() =>
                                    setMostrarConfirmacaoOrganizacao(
                                        !mostrarConfirmacaoOrganizacao
                                    )
                                }
                            >

                                {mostrarConfirmacaoOrganizacao ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}

                            </button>

                        </div>

                        {/* ESCOLHA CPF / CNPJ */}
                     

                        <div className="documento-tipo">

                            <label>

                                <input
                                    type="radio"
                                    name="tipoDocumento"
                                    value="cnpj"
                                    checked={
                                        tipoDocumento === "cnpj"
                                    }
                                    onChange={() =>
                                        setTipoDocumento("cnpj")
                                    }
                                />

                                CNPJ

                            </label>


                            <label>

                                <input
                                    type="radio"
                                    name="tipoDocumento"
                                    value="cpf"
                                    checked={
                                        tipoDocumento === "cpf"
                                    }
                                    onChange={() =>
                                        setTipoDocumento("cpf")
                                    }
                                />

                                CPF

                            </label>

                        </div>


                        <div className="input-box">

                            <input
                                type="text"
                                id="documentoOrganizacao"
                                name={tipoDocumento}
                                placeholder={
                                    tipoDocumento === "cnpj"
                                        ? "CNPJ"
                                        : "CPF"
                                }
                            />

                            <CreditCard size={20} />

                        </div>


                        {/* BOTÃO */}

                        <button
                            type="button"
                            className="cadastro-btn"
                        >
                            Cadastrar
                        </button>

                    </form>

                </div>


                {/* ================================================= */}
                {/* ÁREA DE TRANSIÇÃO */}
                {/* ================================================= */}

                <div className="toggle-box">

                    <div className="toggle-panel toggle-left">

                        <h1>
                            Olá, seja bem-vindo!
                        </h1>

                        <p>
                            Você está se cadastrando como cliente
                        </p>

                        <button
                            type="button"
                            className="toggle-btn"
                            onClick={() =>
                                setTipoUsuario("organizacao")
                            }
                        >
                            Organização
                        </button>

                    </div>

                    <div className="toggle-panel toggle-right">

                        <h1>
                            Olá, seja bem-vindo!
                        </h1>

                        <p>
                            Você está se cadastrando como organização
                        </p>

                        <button
                            type="button"
                            className="toggle-btn"
                            onClick={() =>
                                setTipoUsuario("cliente")
                            }
                        >
                            Cliente
                        </button>

                    </div>

                </div>

            </div>

        </main>
    );
};