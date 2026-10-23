import React, { useEffect, useState, useRef } from "react";

import {
  CircleUser,
  Mail,
  CalendarDays,
  CreditCard,
  Eye,
  EyeOff,
  Building2,
  Phone,
  // MapPin,
  // House,
} from "lucide-react";

import "../css/Cadastro.css";

import { cadastrarPessoa, apiFetch } from "../services/api";

import { Link } from "react-router-dom";

const formatarTelefone = (valor: string) => {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 2) {
    return numeros.length > 0 ? `(${numeros}` : "";
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}${numeros.length > 6 ? `-${numeros.slice(6, 10)}` : ""
      }`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
};

const formatarDocumento = (valor: string, tipo: "cpf" | "cnpj") => {
  const numeros = valor.replace(/\D/g, "");

  if (tipo === "cpf") {
    return numeros
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return numeros
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const validarSenha = (senha: string): string | null => {
  if (senha.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  const senhasBloqueadas = [
    "12345678",
    "87654321",
    "abcdefgh",
    "password",
    "senha123",
    "qwerty123",
  ];

  if (senhasBloqueadas.includes(senha.toLowerCase())) {
    return "Essa senha é muito fácil de adivinhar. Escolha outra.";
  }

  if (/^(\d)\1+$/.test(senha)) {
    return "A senha não pode conter apenas números repetidos.";
  }

  if (/^\d+$/.test(senha)) {
    return "A senha não pode conter apenas números.";
  }

  return null;
};

const validarEmailGmail = (email: string): boolean => {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim());
};

export const Cadastro: React.FC = () => {
  // TIPO DE USUÁRIO

  const [tipoUsuario, setTipoUsuario] = useState<"cliente" | "organizacao">(
    "cliente",
  );

  const organizacao = tipoUsuario === "organizacao";

  // SENHAS - CLIENTE

  const [mostrarSenhaCliente, setMostrarSenhaCliente] = useState(false);

  const [mostrarConfirmacaoCliente, setMostrarConfirmacaoCliente] =
    useState(false);

  // SENHAS - ORGANIZAÇÃO
  const [mostrarSenhaOrganizacao, setMostrarSenhaOrganizacao] = useState(false);

  const [mostrarConfirmacaoOrganizacao, setMostrarConfirmacaoOrganizacao] =
    useState(false);

  // CPF / CNPJ
  const [tipoDocumento, setTipoDocumento] = useState<"cpf" | "cnpj">("cnpj");

  const [documento, setDocumento] = useState("");

  // Telefone
  const [telefone, setTelefone] = useState("");

  // ÁREA DE ATUAÇÃO

  const [areasAtuacao, setAreasAtuacao] = useState<any[]>([]);

  const [areaAtuacao, setAreaAtuacao] = useState("");

  // data de criação

  const dataCriacaoRef = useRef<HTMLInputElement>(null);

  // data de nascimento
  const dataNascimentoRef = useRef<HTMLInputElement>(null);

  // NOVO: referência do card, usada no efeito de inclinação 3D
  const cardRef = useRef<HTMLDivElement>(null);

  // MENSAGENS

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // CARREGAR ÁREAS DE ATUAÇÃO

  useEffect(() => {
    async function carregarAreas() {
      try {
        const resposta = await apiFetch("/AreaAtuacao");

        console.log("RESPOSTA COMPLETA:", resposta);
        console.log("RESULTADO:", resposta?.resultadoSelecionaTodos);

        if (Array.isArray(resposta?.resultadoSelecionaTodos)) {
          setAreasAtuacao(resposta.resultadoSelecionaTodos);
        } else {
          console.error(
            "A resposta não possui resultadoSelecionaTodos como array:",
            resposta,
          );

          setAreasAtuacao([]);
        }
      } catch (error) {
        console.error("Erro ao carregar áreas de atuação:", error);

        setAreasAtuacao([]);
      }
    }

    carregarAreas();
  }, []);

  // SUBMIT

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Guarda a referência do formulário antes do await
    const formulario = e.currentTarget;

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoadingSubmit(true);

    try {
      const formData = new FormData(formulario);

      // CLIENTE

      if (tipoUsuario === "cliente") {
        const nome = String(formData.get("nome") || "").trim();

        const usuario = String(formData.get("usuario") || "").trim();

        const email = String(formData.get("email") || "").trim();

        const senha = String(formData.get("senha") || "");

        const confirmarSenha = String(formData.get("confirmarSenha") || "");

        const dataNascimento = String(formData.get("data_nascimento") || "");

        // VALIDAÇÃO

        if (
          !nome ||
          !usuario ||
          !email ||
          !senha ||
          !confirmarSenha ||
          !dataNascimento
        ) {
          setErrorMessage("Preencha todos os campos.");

          return;
        }

        if (nome.length < 3) {
          setErrorMessage("O nome deve ter pelo menos 3 caracteres.");
          return;
        }

        if (usuario.length === 0) {
          setErrorMessage("O username é obrigatório.");
          return;
        }
        
        if (!validarEmailGmail(email)) {
          setErrorMessage("Digite um e-mail válido do Gmail (exemplo@gmail.com).");
          return;
        }

        const erroSenha = validarSenha(senha);

        if (erroSenha) {
          setErrorMessage(erroSenha);
          return;
        }

        if (senha !== confirmarSenha) {
          setErrorMessage("As senhas não coincidem.");

          return;
        }

        // DADOS

        const dados = {
          nome,

          tipo: "CLIENTE",

          username: usuario,

          password: senha,

          email,

          data_nascimento: dataNascimento,
        };

        console.log("Dados enviados para o backend:", dados);

        await cadastrarPessoa(dados);
      }

      // ORGANIZAÇÃO
      else {
        const nomeOrganizacao = String(
          formData.get("nomeOrganizacao") || "",
        ).trim();

        const usuario = String(formData.get("usuario") || "").trim();

        const email = String(formData.get("email") || "").trim();

        // const telefone =
        //     String(
        //         formData.get(
        //             "telefone"
        //         ) || ""
        //     ).trim();

        const telefoneFormatado = telefone.trim();

        const telefoneSemPontuacao = telefoneFormatado.replace(/\D/g, "");

        const cep = String(formData.get("cep") || "").trim();

        const numero = String(formData.get("numero") || "").trim();

        const senha = String(formData.get("senha") || "");

        const confirmarSenha = String(formData.get("confirmarSenha") || "");

        // const documento =
        //     String(
        //         formData.get(
        //             tipoDocumento
        //         ) || ""
        //     ).trim();
        const documentoSemPontuacao = documento.replace(/\D/g, "");

        const dataCriacao = String(formData.get("data_criacao") || "");

        const idAreaAtuacao = areaAtuacao;

        // VALIDAÇÃO

        if (
          !nomeOrganizacao ||
          !usuario ||
          !email ||
          !telefone ||
          // !cep ||
          // !numero ||
          !senha ||
          !confirmarSenha ||
          !documento ||
          !dataCriacao ||
          !idAreaAtuacao
        ) {
          setErrorMessage("Preencha todos os campos.");

          return;
        }

        if (nomeOrganizacao.length < 3) {
          setErrorMessage("O nome da organização deve ter pelo menos 3 caracteres.");
          return;
        }

        if (!validarEmailGmail(email)) {
          setErrorMessage("Digite um e-mail válido do Gmail (exemplo@gmail.com).");
          return;
        }

        const erroSenha = validarSenha(senha);

        if (erroSenha) {
          setErrorMessage(erroSenha);
          return;
        }

        if (senha !== confirmarSenha) {
          setErrorMessage("As senhas não coincidem.");

          return;
        }


        // DADOS PARA O BACKEND

        const dados: any = {
          nome: nomeOrganizacao,
          tipo: "ORGANIZACAO",

          username: usuario,
          password: senha,

          email,
          telefone: telefoneSemPontuacao,

          cep,
          numero,

          // Envia sempre os dois campos.
          // O documento que não foi escolhido vai como null.
          cpf: tipoDocumento === "cpf" ? documentoSemPontuacao : null,

          cnpj: tipoDocumento === "cnpj" ? documentoSemPontuacao : null,

          data_criacao: dataCriacao,

          id_area_atuacao: Number(areaAtuacao),
        };

        console.log("Dados enviados para o backend:", dados);

        await cadastrarPessoa(dados);
      }

      // SUCESSO
      setSuccessMessage("Cadastro realizado com sucesso!");

      // Limpa os campos do formulário enviado
      formulario.reset();

      // Limpa os campos controlados pelo useState
      setTelefone("");
      setDocumento("");
      setAreaAtuacao("");

      // Restaura a seleção padrão de documento
      setTipoDocumento("cnpj");

      // Oculta os textos das senhas
      setMostrarSenhaCliente(false);
      setMostrarConfirmacaoCliente(false);
      setMostrarSenhaOrganizacao(false);
      setMostrarConfirmacaoOrganizacao(false);
    } catch (error) {
      console.error("Erro ao realizar cadastro:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o cadastro.",
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  // NOVO: INCLINAÇÃO DO CARD COM O MOUSE

  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;

    // mede o wrapper (que não inclina), pra o card não "tremer" na borda
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;

    el.style.setProperty("--ry", `${(x * 3.5).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 3.5).toFixed(2)}deg`);
  };

  const resetTilt = () => {
    const el = cardRef.current;
    if (!el) return;

    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };

  // JSX

  return (
    <main className="cadastro-page">
      {/* NOVO: wrapper */}
      <div
        className="cadastro-wrap"
        onMouseMove={handleTilt}
        onMouseLeave={resetTilt}
      >
        <div
          ref={cardRef}
          className={`cadastro-container ${organizacao ? "active" : ""}`}
        >
          {/* =================================================
                    CLIENTE
                ================================================= */}

          <div className="form-box cliente">
            <form onSubmit={handleSubmit}>
              <h1>Cadastro de Cliente</h1>

              {/* NOME */}

              <div className="input-box">
                <div className="input">
                  <input
                    type="text"
                    id="nomeCliente"
                    name="nome"
                    placeholder="Nome completo"
                  />

                  <CircleUser size={20} />
                </div>
              </div>

              {/* USUÁRIO */}

              <div className="input-box">
                <div className="input">
                  <input
                    type="text"
                    id="usuarioCliente"
                    name="usuario"
                    placeholder="Usuário"
                  />

                  <CircleUser size={20} />
                </div>
              </div>

              {/* EMAIL */}

              <div className="input-box">
                <div className="input">
                  <input
                    type="email"
                    id="emailCliente"
                    name="email"
                    placeholder="E-mail"
                  />

                  <Mail size={20} />
                </div>
              </div>

              {/* SENHA */}

              <div className="input-box">
                <div className="input">
                  <input
                    type={mostrarSenhaCliente ? "text" : "password"}
                    id="senhaCliente"
                    name="senha"
                    placeholder="Senha"
                  />

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setMostrarSenhaCliente(!mostrarSenhaCliente)}
                  >
                    {mostrarSenhaCliente ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRMAR SENHA */}

              <div className="input-box">
                <div className="input">
                  <input
                    type={mostrarConfirmacaoCliente ? "text" : "password"}
                    id="confirmarSenhaCliente"
                    name="confirmarSenha"
                    placeholder="Confirmar senha"
                  />

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      setMostrarConfirmacaoCliente(!mostrarConfirmacaoCliente)
                    }
                  >
                    {mostrarConfirmacaoCliente ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* DATA NASCIMENTO */}

              <div
                className="input-box-nascimento"
                onClick={() => dataNascimentoRef.current?.showPicker()}
              >
                <input
                  ref={dataNascimentoRef}
                  type="date"
                  id="data_nascimento"
                  name="data_nascimento"
                  required
                />

                <CalendarDays size={20} />
              </div>

              {/* MENSAGENS */}

              {errorMessage && !organizacao && (
                <p className="error-message">{errorMessage}</p>
              )}

              {successMessage && !organizacao && (
                <p className="success-message">{successMessage}</p>
              )}

              {/* BOTÃO */}

              <button
                type="submit"
                className="cadastro-btn"
                disabled={loadingSubmit}
              >
                {loadingSubmit ? "Cadastrando..." : "Cadastrar"}
              </button>
              <p className="login-link">
                Já possui uma conta? <Link to="/login">Entrar</Link>
              </p>
            </form>
          </div>

          {/* =================================================
                    ORGANIZAÇÃO
                ================================================= */}

          <div className="form-box organizacao">
            <form onSubmit={handleSubmit}>
              <h1>Cadastro de Organização</h1>

              {/* NOME ORGANIZAÇÃO */}

              <div className="input-box">
                <div className="input">
                  <input
                    type="text"
                    id="nomeOrganizacao"
                    name="nomeOrganizacao"
                    placeholder="Nome da organização"
                  />

                  <Building2 size={20} />
                </div>

                <div className="input">
                  <input
                    type="text"
                    id="usuarioOrganizacao"
                    name="usuario"
                    placeholder="Usuário"
                  />

                  <CircleUser size={20} />
                </div>
              </div>

              {/* EMAIL */}
              <div className="input-box">
                <div className="input">
                  <input
                    type="email"
                    id="emailOrganizacao"
                    name="email"
                    placeholder="E-mail"
                  />

                  <Mail size={20} />
                </div>

                <div className="input">
                  <input
                    type="text"
                    id="telefone"
                    name="telefone"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => {
                      setTelefone(formatarTelefone(e.target.value));
                    }}
                    maxLength={15}
                  />

                  <Phone size={20} />
                </div>
              </div>

              {/* CEP */}

              {/* <div className="input-box">

                            <div className="input">
                                <input
                                    type="text"
                                    id="cep"
                                    name="cep"
                                    placeholder="CEP"
                                />
                                <MapPin size={20} />
                            </div>
                            <div className="input">
                                <input
                                    type="text"
                                    id="numero"
                                    name="numero"
                                    placeholder="Número"
                                />
                                <House size={20} />
                            </div>
                        </div> */}

              {/* SENHAS */}
              <div className="input-box senha-container">
                <div className="input">
                  <input
                    type={mostrarSenhaOrganizacao ? "text" : "password"}
                    id="senhaOrganizacao"
                    name="senha"
                    placeholder="Senha"
                  />

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      setMostrarSenhaOrganizacao(!mostrarSenhaOrganizacao)
                    }
                  >
                    {mostrarSenhaOrganizacao ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>

                <div className="input">
                  <input
                    type={mostrarConfirmacaoOrganizacao ? "text" : "password"}
                    id="confirmarSenhaOrganizacao"
                    name="confirmarSenha"
                    placeholder="Confirmar senha"
                  />

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      setMostrarConfirmacaoOrganizacao(
                        !mostrarConfirmacaoOrganizacao,
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
              </div>

              {/* =================================================
                            CPF / CNPJ
                        ================================================= */}

              <div className="documento-toggle">
                {/* CPF */}

                <button
                  type="button"
                  className={`documento-card ${tipoDocumento === "cpf" ? "ativo" : ""
                    }`}
                  onClick={() => setTipoDocumento("cpf")}
                >
                  <div className="documento-icone">
                    <CircleUser size={19} />
                  </div>

                  <div className="documento-info">
                    <strong>CPF</strong>

                    <span>Pessoa Física</span>
                  </div>

                  <div className="documento-check">
                    {tipoDocumento === "cpf" ? "✓" : ""}
                  </div>
                </button>

                {/* CNPJ */}

                <button
                  type="button"
                  className={`documento-card ${tipoDocumento === "cnpj" ? "ativo" : ""
                    }`}
                  onClick={() => setTipoDocumento("cnpj")}
                >
                  <div className="documento-icone">
                    <Building2 size={19} />
                  </div>

                  <div className="documento-info">
                    <strong>CNPJ</strong>

                    <span>Empresa</span>
                  </div>

                  <div className="documento-check">
                    {tipoDocumento === "cnpj" ? "✓" : ""}
                  </div>
                </button>
              </div>

              {/* DOCUMENTO */}

              <div className="input-box documento-input">
                <input
                  type="text"
                  id="documentoOrganizacao"
                  name={tipoDocumento}
                  value={documento}
                  onChange={(e) => {
                    setDocumento(
                      formatarDocumento(e.target.value, tipoDocumento),
                    );
                  }}
                  placeholder={
                    tipoDocumento === "cnpj"
                      ? "00.000.000/0000-00"
                      : "000.000.000-00"
                  }
                />

                <CreditCard size={20} />
              </div>

              {/* AJUDA */}

              <p className="documento-ajuda">
                Informe seu {tipoDocumento.toUpperCase()} (apenas números).
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

                <div
                  className="data-criacao-box"
                  onClick={() => dataCriacaoRef.current?.showPicker()}
                >
                  <input
                    ref={dataCriacaoRef}
                    type="date"
                    id="data_criacao"
                    name="data_criacao"
                    required
                  />

                  <CalendarDays size={20} />
                </div>
                {/* AJUDA */}

                <p className="documento-ajuda">
                  Selecione a data de criação da organização
                </p>
              </div>

              {/* MENSAGENS */}

              {errorMessage && organizacao && (
                <p className="error-message">{errorMessage}</p>
              )}

              {successMessage && organizacao && (
                <p className="success-message">{successMessage}</p>
              )}

              {/* BOTÃO */}

              <button
                type="submit"
                className="cadastro-btn"
                disabled={loadingSubmit}
              >
                {loadingSubmit ? "Cadastrando..." : "Cadastrar"}
              </button>

              <p className="login-link">
                Já possui uma conta? <Link to="/login">Entrar</Link>
              </p>
            </form>
          </div>

          {/* =================================================
                    TOGGLE
                ================================================= */}

          <div className="toggle-box">
            <div className="toggle-panel toggle-left">
              <h1>Olá, seja bem-vindo!</h1>

              <p>Você está se cadastrando como cliente</p>

              <button
                type="button"
                className="toggle-btn"
                onClick={() => setTipoUsuario("organizacao")}
              >
                Organização
              </button>
            </div>

            <div className="toggle-panel toggle-right">
              <h1>Olá, seja bem-vindo!</h1>

              <p>Você está se cadastrando como organização</p>

              <button
                type="button"
                className="toggle-btn"
                onClick={() => setTipoUsuario("cliente")}
              >
                Cliente
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* NOVO: fim do wrapper */}
    </main>
  );
};
