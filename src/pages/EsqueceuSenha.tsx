import React, { useState } from "react";

import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import logo from "../assets/Logo.png";

import "../css/EsqueceuSenha.css";

export const EsqueceuSenha: React.FC = () => {
    const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Não foi possível enviar o e-mail.",
        );
      }

      setSuccessMessage(
        "E-mail enviado! Confira sua caixa de entrada e a pasta de spam.",
      );

      setEmail("");
    } catch (error) {
      console.error("Erro ao solicitar recuperação:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o e-mail. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="recovery-page">
      {/* LATERAL VERMELHA */}
      <div className="recovery-red-background">
        <div className="recovery-side-content">
          <h2>
            Esqueceu sua senha?
          </h2>

          <p>
            Não se preocupe!
            <br />
            Vamos ajudar você a recuperar
            <br />
            o acesso à sua conta TaDaKi.
          </p>
        </div>
      </div>

      {/* CARD */}
      <div className="recovery-card">
        {/* LOGO */}
        <div className="recovery-logo-container">
          <img src={logo} alt="Logo TaDaKi" className="recovery-logo" />
        </div>

        {/* CONTEÚDO */}
        <div className="recovery-heading">
          <h1>Recuperar senha</h1>

          <p>
            Informe o e-mail cadastrado e enviaremos
            um link para você criar uma nova senha.
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit}>
          <div className="recovery-form-group">
            <label htmlFor="email">E-mail</label>

            <div className="recovery-input-container">
              <input
                id="email"
                type="email"
                className="recovery-input"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <Mail
                size={18}
                color="#64748b"
                className="recovery-input-icon"
              />
            </div>
          </div>

          {/* MENSAGENS */}
          {errorMessage && (
            <p className="recovery-error" role="alert">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="recovery-success" role="status">
              {successMessage}
            </p>
          )}

          {/* BOTÃO */}
          <button
            type="submit"
            className="recovery-button"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        {/* VOLTAR AO LOGIN */}
        <div className="recovery-footer">
          <Link to="/login" className="recovery-link">
            Voltar para o login
          </Link>
        </div>
      </div>
    </section>
  );
}