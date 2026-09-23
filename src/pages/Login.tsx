
import React, { useState } from "react";

import { CircleUser, Eye, EyeOff } from "lucide-react";
import { IoStorefront } from "react-icons/io5";

import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import logo from "../assets/Logo.png";

import "../css/Login.css";

export const Login: React.FC = () => {
  const { user, login } = useAuth();

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Se já estiver logado, vai para a página inicial
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);
    setLoadingSubmit(true);

    try {
      await login(username, password);

      navigate("/");
    } catch (error) {
      console.error("ERRO REAL DO LOGIN:", error);

      setErrorMessage(
        "Falha na autenticação. Verifique seus dados."
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <section className="login-page">

      {/* FUNDO VERMELHO */}
      <div className="login-red-background">

        <IoStorefront
          size={390}
          color="#8f1725"
          strokeWidth={1}
          className="login-store-icon"
        />

      </div>

      {/* CARD */}
      <div className="login-card">

        {/* LOGO */}
        <div className="login-logo-container">

          <img
            src={logo}
            alt="Logo"
            className="login-logo"
          />

        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit}>

          {/* USERNAME */}
          <div className="form-group">

            <label htmlFor="username">
              Username
            </label>

            <div className="login-input-container">

              <CircleUser
                size={18}
                color="#64748b"
                className="username-icon"
              />

              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="seu.nome"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

            </div>

          </div>


          {/* PASSWORD */}
          <div className="form-group password-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="login-input-container">

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* ÍCONE DE MOSTRAR/OCULTAR */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>


          {/* ERRO */}
          {errorMessage && (
            <p className="login-error">
              {errorMessage}
            </p>
          )}


          {/* LEMBRE-ME / ESQUECEU A SENHA */}
          <div className="login-options">

            <label className="remember-label">

              <input type="checkbox" />

              Lembre-me

            </label>

            <a
              href="#"
              className="forgot-password"
            >
              Esqueceu a senha?
            </a>

          </div>


          {/* BOTÃO */}
          <button
            type="submit"
            className="login-button"
            disabled={loadingSubmit}
          >
            {loadingSubmit ? "Entrando..." : "Entrar"}
          </button>

        </form>


        {/* DIVISOR */}
        <div className="login-divider">

          <div className="login-divider-line" />

          <span className="login-divider-text">
            ou
          </span>

          <div className="login-divider-line" />

        </div>


        {/* CADASTRO */}
        <div className="login-register">

          <span className="login-register-text">
            Não tem uma conta?
          </span>

          <Link
            to="/cadastro"
            className="login-register-link"
          >
            Registre-se
          </Link>

        </div>

      </div>

    </section>
  );
};