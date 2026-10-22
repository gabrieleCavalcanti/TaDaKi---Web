import React, { useState, useRef } from "react";

import {
  CircleUser,
  Eye,
  EyeOff,
  MapPin,
  Lock,
  ArrowRight,
  Store,
  Coffee,
  Scissors,
} from "lucide-react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { loginComGoogle } from "../services/api";

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

  // referência do card, usada no efeito de inclinação 3D
  const cardRef = useRef<HTMLDivElement>(null);

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

      setErrorMessage("Falha na autenticação. Verifique seus dados.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleGoogleSuccess = async (res: CredentialResponse) => {
    if (!res.credential) return;

    setErrorMessage(null);
    setLoadingSubmit(true);

    try {
      await loginComGoogle(res.credential);

      // Recarrega a página inicial para o AuthProvider ler a sessão nova
      window.location.href = "/";
    } catch (error) {
      console.error("ERRO LOGIN GOOGLE:", error);
      setErrorMessage("Não foi possível entrar com o Google. Tente novamente.");
      setLoadingSubmit(false);
    }
  };

  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;

    el.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
  };

  const resetTilt = () => {
    const el = cardRef.current;
    if (!el) return;

    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };

  return (
    <section className="login-page">
      {/* TEXTO + MARCADORES */}
      <div className="login-red-background">
        <div className="login-store-icon">
          <span className="login-eyebrow">
            <MapPin size={14} />
            Vitrine local
          </span>

          <h2>
            Conectando pessoas
            <br />
            a microempresas
            <br />
            <span className="hl">perto de você.</span>
          </h2>

          <p>
            Encontre negócios locais,
            <br />
            valorize quem está pertinho
            <br />e faça a diferença na sua região.
          </p>
        </div>

        {/* MARCADORES DE LOJA */}
        <div className="login-markers" aria-hidden="true">
          <span className="marker mk-one">
            <Store size={22} />
          </span>
          <span className="marker mk-two">
            <Coffee size={20} />
          </span>
          <span className="marker mk-three">
            <Scissors size={18} />
          </span>
        </div>
      </div>

      {/* CARD + ONDAS */}
      <div
        className="login-card-wrap"
        onMouseMove={handleTilt}
        onMouseLeave={resetTilt}
      >
        <div className="login-radar" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="login-card" ref={cardRef}>
          <div className="login-logo-container">
            <img src={logo} alt="Logo" className="login-logo" />
          </div>

          <div className="login-card-header">
            <h1>Bem-vindo de volta</h1>
            <p>Entre para descobrir negócios perto de você</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* USUÁRIO */}
            <div className="form-group">
              <label htmlFor="username">Usuário</label>

              <div className="login-input-container">
                <CircleUser size={18} className="username-icon" />

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

            {/* SENHA */}
            <div className="form-group password-group">
              <label htmlFor="password">Senha</label>

              <div className="login-input-container">
                <Lock size={18} className="password-icon" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && <p className="login-error">{errorMessage}</p>}

            <div className="login-options">
              <label className="remember-label">
                <input type="checkbox" />
                Lembre-me
              </label>

              <Link to="/esqueceuSenha" className="forgot-password">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loadingSubmit}
            >
              {loadingSubmit ? (
                "Entrando..."
              ) : (
                <>
                  Entrar <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">ou</span>
            <div className="login-divider-line" />
          </div>

          {/* BOTÃO GOOGLE */}
          <div className="login-google"
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMessage("Falha no login com Google.")}
              text="continue_with"
              shape="pill"
              size="large"
              width="280"
            />
          </div>
          <div className="login-register">
            <span className="login-register-text">Não tem uma conta?</span>

            <Link to="/cadastro" className="login-register-link">
              Registre-se
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
