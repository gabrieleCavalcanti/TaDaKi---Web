import React, { useEffect, useState } from "react";

import {
    CircleUser,
    Mail,
    CalendarDays,
    CreditCard,
    Eye,
    EyeOff,
    Building2,
    Phone,
    MapPin,
    House,
} from "lucide-react";

import "../App.css";

import {
    cadastrarPessoa,
    apiFetch,
} from "../services/api";


export const Cadastro: React.FC = () => {

    // =========================================================
    // TIPO DE USUÁRIO
    // =========================================================

    const [tipoUsuario, setTipoUsuario] = useState<
        "cliente" | "organizacao"
    >("cliente");

    const organizacao =
        tipoUsuario === "organizacao";


    // =========================================================
    // SENHAS - CLIENTE
    // =========================================================

    const [mostrarSenhaCliente, setMostrarSenhaCliente] =
        useState(false);

    const [mostrarConfirmacaoCliente, setMostrarConfirmacaoCliente] =
        useState(false);


    // =========================================================
    // SENHAS - ORGANIZAÇÃO
    // =========================================================

    const [mostrarSenhaOrganizacao, setMostrarSenhaOrganizacao] =
        useState(false);

    const [mostrarConfirmacaoOrganizacao, setMostrarConfirmacaoOrganizacao] =
        useState(false);


    // =========================================================
    // CPF / CNPJ
    // =========================================================

    const [tipoDocumento, setTipoDocumento] = useState<
        "cpf" | "cnpj"
    >("cnpj");


    // =========================================================
    // ÁREA DE ATUAÇÃO
    // =========================================================

    const [areasAtuacao, setAreasAtuacao] =
        useState<any[]>([]);

    const [areaAtuacao, setAreaAtuacao] =
        useState("");




    // =========================================================
    // MENSAGENS
    // =========================================================

    const [loadingSubmit, setLoadingSubmit] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);


    // =========================================================
    // CARREGAR ÁREAS DE ATUAÇÃO
    // =========================================================

    useEffect(() => {
        async function carregarAreas() {
            try {
                const resposta = await apiFetch("/AreaAtuacao");

                console.log("RESPOSTA COMPLETA:", resposta);
                console.log(
                    "RESULTADO:",
                    resposta?.resultadoSelecionaTodos
                );

                if (Array.isArray(resposta?.resultadoSelecionaTodos)) {
                    setAreasAtuacao(
                        resposta.resultadoSelecionaTodos
                    );
                } else {
                    console.error(
                        "A resposta não possui resultadoSelecionaTodos como array:",
                        resposta
                    );

                    setAreasAtuacao([]);
                }
            } catch (error) {
                console.error(
                    "Erro ao carregar áreas de atuação:",
                    error
                );

                setAreasAtuacao([]);
            }
        }

        carregarAreas();
    }, []);

    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        setErrorMessage(null);
        setSuccessMessage(null);
        setLoadingSubmit(true);


        try {

            const formData =
                new FormData(e.currentTarget);


            // =================================================
            // CLIENTE
            // =================================================

            if (tipoUsuario === "cliente") {

                const nome = String(
                    formData.get("nome") || ""
                ).trim();

                const usuario = String(
                    formData.get("usuario") || ""
                ).trim();

                const email = String(
                    formData.get("email") || ""
                ).trim();

                const senha = String(
                    formData.get("senha") || ""
                );

                const confirmarSenha = String(
                    formData.get("confirmarSenha") || ""
                );

                const dataNascimento = String(
                    formData.get("dataNascimento") || ""
                );


                // ---------------------------------------------
                // VALIDAÇÃO
                // ---------------------------------------------

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


                // ---------------------------------------------
                // DADOS
                // ---------------------------------------------

                const dados = {

                    nome,

                    tipo: "CLIENTE",

                    username: usuario,

                    password: senha,

                    email,

                    data_nascimento:
                        dataNascimento,

                };


                console.log(
                    "Dados enviados para o backend:",
                    dados
                );


                await cadastrarPessoa(dados);

            }


            // =================================================
            // ORGANIZAÇÃO
            // =================================================

            else {

                const nomeOrganizacao =
                    String(
                        formData.get(
                            "nomeOrganizacao"
                        ) || ""
                    ).trim();


                const usuario =
                    String(
                        formData.get(
                            "usuario"
                        ) || ""
                    ).trim();


                const email =
                    String(
                        formData.get(
                            "email"
                        ) || ""
                    ).trim();


                const telefone =
                    String(
                        formData.get(
                            "telefone"
                        ) || ""
                    ).trim();


                const cep =
                    String(
                        formData.get(
                            "cep"
                        ) || ""
                    ).trim();


                const numero =
                    String(
                        formData.get(
                            "numero"
                        ) || ""
                    ).trim();


                const senha =
                    String(
                        formData.get(
                            "senha"
                        ) || ""
                    );


                const confirmarSenha =
                    String(
                        formData.get(
                            "confirmarSenha"
                        ) || ""
                    );


                const documento =
                    String(
                        formData.get(
                            tipoDocumento
                        ) || ""
                    ).trim();


                const dataCriacao =
                    String(
                        formData.get(
                            "data_criacao"
                        ) || ""
                    );


                const idAreaAtuacao = areaAtuacao;


                // ---------------------------------------------
                // VALIDAÇÃO
                // ---------------------------------------------

                if (
                    !nomeOrganizacao ||
                    !usuario ||
                    !email ||
                    !telefone ||
                    !cep ||
                    !numero ||
                    !senha ||
                    !confirmarSenha ||
                    !documento ||
                    !dataCriacao ||
                    !idAreaAtuacao
                ) {

                    setErrorMessage(
                        "Preencha todos os campos."
                    );

                    return;

                }


                if (
                    senha !== confirmarSenha
                ) {

                    setErrorMessage(
                        "As senhas não coincidem."
                    );

                    return;

                }


                // ---------------------------------------------
                // DADOS PARA O BACKEND
                // ---------------------------------------------

                const dados: any = {
                    nome: nomeOrganizacao,
                    tipo: "ORGANIZACAO",

                    username: usuario,
                    password: senha,

                    email,
                    telefone,

                    cep,
                    numero,

                    // Envia sempre os dois campos.
                    // O documento que não foi escolhido vai como null.
                    cpf: tipoDocumento === "cpf" ? documento : null,
                    cnpj: tipoDocumento === "cnpj" ? documento : null,


                    data_criacao: dataCriacao,

                    id_area_atuacao: Number(areaAtuacao),
                };

                console.log(
                    "Dados enviados para o backend:",
                    dados
                );


                await cadastrarPessoa(
                    dados
                );

            }


            // =================================================
            // SUCESSO
            // =================================================

            setSuccessMessage(
                "Cadastro realizado com sucesso!"
            );


        } catch (error) {

            console.error(
                "Erro ao realizar cadastro:",
                error
            );


            setErrorMessage(

                error instanceof Error
                    ? error.message
                    : "Não foi possível realizar o cadastro."

            );

        } finally {

            setLoadingSubmit(false);

        }

    };


    // =========================================================
    // JSX
    // =========================================================

    return (

        <main className="cadastro-page">

            <div
                className={
                    `cadastro-container ${organizacao
                        ? "active"
                        : ""
                    }`
                }
            >


                {/* =================================================
                    CLIENTE
                ================================================= */}

                <div className="form-box cliente">

                    <form onSubmit={handleSubmit}>

                        <h1>
                            Cadastro de Cliente
                        </h1>


                        {/* NOME */}

                        <div className="input-box">

                            <input
                                type="text"
                                id="nomeCliente"
                                name="nome"
                                placeholder="Nome completo"
                            />

                            <CircleUser size={20} />

                        </div>


                        {/* USUÁRIO */}

                        <div className="input-box">

                            <input
                                type="text"
                                id="usuarioCliente"
                                name="usuario"
                                placeholder="Usuário"
                            />

                            <CircleUser size={20} />

                        </div>


                        {/* EMAIL */}

                        <div className="input-box">

                            <input
                                type="email"
                                id="emailCliente"
                                name="email"
                                placeholder="E-mail"
                            />

                            <Mail size={20} />

                        </div>


                        {/* SENHA */}

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


                        {/* CONFIRMAR SENHA */}

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


                        {/* DATA NASCIMENTO */}

                        <div className="input-box">

                            <input
                                type="date"
                                id="dataNascimento"
                                name="dataNascimento"
                                aria-label="Data de nascimento"
                            />

                            <CalendarDays size={20} />

                        </div>


                        {/* MENSAGENS */}

                        {errorMessage &&
                            !organizacao && (

                                <p className="error-message">
                                    {errorMessage}
                                </p>

                            )}


                        {successMessage &&
                            !organizacao && (

                                <p className="success-message">
                                    {successMessage}
                                </p>

                            )}


                        {/* BOTÃO */}

                        <button
                            type="submit"
                            className="cadastro-btn"
                            disabled={
                                loadingSubmit
                            }
                        >

                            {loadingSubmit
                                ? "Cadastrando..."
                                : "Cadastrar"}

                        </button>

                    </form>

                </div>



                {/* =================================================
                    ORGANIZAÇÃO
                ================================================= */}

                <div className="form-box organizacao">

                    <form onSubmit={handleSubmit}>

                        <h1>
                            Cadastro de Organização
                        </h1>


                        {/* NOME ORGANIZAÇÃO */}

                        <div className="input-box">

                            <input
                                type="text"
                                id="nomeOrganizacao"
                                name="nomeOrganizacao"
                                placeholder="Nome da organização"
                            />

                            <Building2 size={20} />

                        </div>


                        {/* USUÁRIO */}

                        <div className="input-box">

                            <input
                                type="text"
                                id="usuarioOrganizacao"
                                name="usuario"
                                placeholder="Usuário"
                            />

                            <CircleUser size={20} />

                        </div>


                        {/* EMAIL */}

                        <div className="input-box">

                            <input
                                type="email"
                                id="emailOrganizacao"
                                name="email"
                                placeholder="E-mail"
                            />

                            <Mail size={20} />

                        </div>


                        {/* TELEFONE */}

                        <div className="input-box">

                            <input
                                type="text"
                                id="telefone"
                                name="telefone"
                                placeholder="Telefone"
                            />

                            <Phone size={20} />

                        </div>


                        {/* CEP */}

                        <div className="input-box">

                            <input
                                type="text"
                                id="cep"
                                name="cep"
                                placeholder="CEP"
                            />
                            <MapPin size={20} />
                        </div>


                        {/* NÚMERO */}

                        <div className="input-box">

                            <input
                                type="text"
                                id="numero"
                                name="numero"
                                placeholder="Número"
                            />
                            <House size={20} />
                        </div>


                        {/* SENHA */}

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


                        {/* CONFIRMAR SENHA */}

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


                        {/* =================================================
                            CPF / CNPJ
                        ================================================= */}

                        <div className="documento-toggle">


                            {/* CPF */}

                            <button
                                type="button"
                                className={
                                    `documento-card ${tipoDocumento === "cpf"
                                        ? "ativo"
                                        : ""
                                    }`
                                }
                                onClick={() =>
                                    setTipoDocumento(
                                        "cpf"
                                    )
                                }
                            >

                                <div className="documento-icone">

                                    <CircleUser
                                        size={19}
                                    />

                                </div>


                                <div className="documento-info">

                                    <strong>
                                        CPF
                                    </strong>

                                    <span>
                                        Pessoa Física
                                    </span>

                                </div>


                                <div className="documento-check">

                                    {tipoDocumento === "cpf"
                                        ? "✓"
                                        : ""}

                                </div>

                            </button>



                            {/* CNPJ */}

                            <button
                                type="button"
                                className={
                                    `documento-card ${tipoDocumento === "cnpj"
                                        ? "ativo"
                                        : ""
                                    }`
                                }
                                onClick={() =>
                                    setTipoDocumento(
                                        "cnpj"
                                    )
                                }
                            >

                                <div className="documento-icone">

                                    <Building2
                                        size={19}
                                    />

                                </div>


                                <div className="documento-info">

                                    <strong>
                                        CNPJ
                                    </strong>

                                    <span>
                                        Empresa
                                    </span>

                                </div>


                                <div className="documento-check">

                                    {tipoDocumento === "cnpj"
                                        ? "✓"
                                        : ""}

                                </div>

                            </button>

                        </div>


                        {/* LABEL */}

                        <label
                            className="documento-label"
                            htmlFor="documentoOrganizacao"
                        >

                            {tipoDocumento.toUpperCase()}

                        </label>


                        {/* DOCUMENTO */}

                        <div className="input-box documento-input">

                            <input
                                type="text"
                                id="documentoOrganizacao"
                                name={tipoDocumento}
                                placeholder={
                                    tipoDocumento === "cnpj"
                                        ? "00.000.000/0000-00"
                                        : "000.000.000-00"
                                }
                            />

                            <CreditCard
                                size={20}
                            />

                        </div>


                        {/* AJUDA */}

                        <p className="documento-ajuda">

                            Informe seu{" "}
                            {tipoDocumento.toUpperCase()}{" "}
                            (apenas números).

                        </p>


                        <div className="area-data-container">

                            <div className="area-atuacao-box">
                                <select
                                    id="id_area_atuacao"
                                    name="id_area_atuacao"
                                    value={areaAtuacao}
                                    onChange={(e) => setAreaAtuacao(e.target.value)}
                                    required
                                >
                                    <option value="">Área de atuação</option>

                                    {areasAtuacao.map((area) => (
                                        <option
                                            key={area.id_area_atuacao}
                                            value={area.id_area_atuacao}
                                        >
                                            {area.descricao}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="data-criacao-box">
                                <input
                                    type="date"
                                    id="data_criacao"
                                    name="data_criacao"
                                    required
                                />
                            </div>

                        </div>


                        {/* MENSAGENS */}

                        {errorMessage &&
                            organizacao && (

                                <p className="error-message">
                                    {errorMessage}
                                </p>

                            )}


                        {successMessage &&
                            organizacao && (

                                <p className="success-message">
                                    {successMessage}
                                </p>

                            )}


                        {/* BOTÃO */}

                        <button
                            type="submit"
                            className="cadastro-btn"
                            disabled={
                                loadingSubmit
                            }
                        >

                            {loadingSubmit
                                ? "Cadastrando..."
                                : "Cadastrar"}

                        </button>

                    </form>

                </div>



                {/* =================================================
                    TOGGLE
                ================================================= */}

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
                                setTipoUsuario(
                                    "organizacao"
                                )
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
                                setTipoUsuario(
                                    "cliente"
                                )
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