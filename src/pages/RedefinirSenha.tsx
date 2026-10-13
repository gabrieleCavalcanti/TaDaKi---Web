import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import logo from "../assets/Logo.png";

import "../css/RedefinirSenha.css";

export const RedefinirSenha: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Link de recuperação inválido. Solicite um novo e-mail.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            novaSenha,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível redefinir a senha.");
      }

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Senha redefinida com sucesso! Faça login com sua nova senha.",
        },
      });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir a senha. Tente novamente.",
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
          <h2>Crie uma nova senha</h2>

          <p>
            Falta pouco!
            <br />
            Defina uma nova senha para
            <br />
            voltar a aproveitar o TaDaKi.
          </p>
        </div>
      </div>

      {/* CARD */}
      <div className="recovery-card">
        {/* LOGO */}
        <div className="recovery-logo-container">
          <img src={logo} alt="Logo TaDaKi" className="recovery-logo" />
        </div>

        {/* TÍTULO */}
        <div className="recovery-heading">
          <h1>Redefinir senha</h1>

          <p>
            Escolha uma nova senha e confirme para recuperar o acesso à sua
            conta.
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit}>
          {/* NOVA SENHA */}
          <div className="recovery-form-group">
            <label htmlFor="novaSenha">Nova senha</label>

            <div className="reset-input-container">
              <LockKeyhole
                size={18}
                color="#64748b"
                className="reset-input-icon"
              />

              <input
                id="novaSenha"
                type={showPassword ? "text" : "password"}
                className="reset-input"
                placeholder="Digite sua nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* CONFIRMAR SENHA */}
          <div className="reset-form-group">
            <label htmlFor="confirmarSenha">Confirmar senha</label>

            <div className="reset-input-container">
              <LockKeyhole
                size={18}
                color="#64748b"
                className="reset-input-icon"
              />

              <input
                id="confirmarSenha"
                type={showConfirmPassword ? "text" : "password"}
                className="reset-input"
                placeholder="Confirme sua nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* ERRO */}
          {errorMessage && (
            <p className="recovery-error" role="alert">
              {errorMessage}
            </p>
          )}

          {/* BOTÃO */}
          <button type="submit" className="recovery-button" disabled={loading}>
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </button>
        </form>

        {/* VOLTAR */}
        <div className="recovery-footer">
          <Link to="/login" className="recovery-link">
            Voltar para o login
          </Link>
        </div>
      </div>
    </section>
  );
};
