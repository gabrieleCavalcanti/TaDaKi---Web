import React, { useState } from "react";
import { CircleUser, KeyRound } from "lucide-react";

// importar o icone da loja\
import { IoStorefront } from "react-icons/io5";

import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Olhinhos para ocultar a senha e visualizar a senha
import { Eye, EyeOff } from "lucide-react";

// importação a logo
import logo from "../assets/Logo.png"

// Importação do background do lado direito
import bkMapa from "../assets/imagem_fundo.jpg"

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
    <section
      className="login-page"
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "40%",
          height: "100%",
          background: "rgba(117, 8, 10, 1)",
        }}>
        <IoStorefront
          size={390}
          color="#8f1725"
          strokeWidth={1}
          style={{
            position: "absolute",
            left: "-30px",
            bottom: "10px",
            opacity: 0.45,
          }}
        />
      </div>


      <div
        style={{
          backgroundImage: `url(${bkMapa})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "absolute",
          top: 0,
          right: 0,
          width: "60%",
          height: "100%",
          objectFit: 'cover', // Mantém a proporção da imagem sem distorcer
          objectPosition: 'center', // Foca no centro da imagem
        }}
      />

      <div
        className="card"
        style={{
          width: "38%",
          height: "65%",
          minWidth: "350px",
          minHeight: "450px",
          background: "#fff",
          padding: "36px",
          position: "relative",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          borderRadius: "10px"
        }}
      >
        {/* LOGO */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "30px",
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{
              width: "150px",
              height: "auto",
              transform: "translateY(-30px)",
            }}
          />
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit}>

          {/* USERNAME */}
          <div className="form-group">

            <label htmlFor="username">
              Username
            </label>

            <div style={{ position: "relative" }}>

              <CircleUser
                size={18}
                color="#64748b"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />

              <input
                id="username"
                type="text"
                className="form-input"
                style={{
                  paddingLeft: "38px",
                  width: "100%",
                  height: "30px",
                  boxSizing: "border-box",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px"
                }}
                placeholder="seu.nome"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

            </div>
          </div>

          {/* PASSWORD */}
          <div
            className="form-group"
            style={{
              marginTop: "20px",
            }}
          >

            <label htmlFor="password">
              Password
            </label>

            <div style={{ position: "relative" }}>

              {/* Ícone da chave */}
              <KeyRound
                size={18}
                color="#64748b"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{
                  paddingLeft: "38px",
                  paddingRight: "40px",
                  width: "100%",
                  height: "30px",
                  boxSizing: "border-box",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px"
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Ícone de mostrar/ocultar */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "53%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "#64748b",
                }}
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
            <p
              style={{
                color: "red",
                marginTop: "15px",
              }}
            >
              {errorMessage}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              marginTop: "10px"
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              <input type="checkbox" />
              Lembre-me
            </label>

            <a
              href="#"
              style={{
                fontSize: "14px",
                color: "#d2272a",
                textDecoration: "none",
              }}
            >
              Esqueceu a senha?
            </a>
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "12px",
              borderRadius: "5px",
              backgroundColor: "rgb(210, 39, 42)",
              color: "white",
              fontWeight: "bold",
              border: "1px solid rgba(255, 255, 255, 0.25)",
            }}
            disabled={loadingSubmit}
          >
            {loadingSubmit ? "Entrando..." : "Entrar"}
          </button>

        </form>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            marginTop: "15px",
          }}
        >
          <div style={{ flex: 1, borderTop: "1px solid #d1d5db" }} />

          <span
            style={{
              fontSize: "13px",
              color: "#374151",
            }}
          >
            ou
          </span>

          <div style={{ flex: 1, borderTop: "1px solid #d1d5db" }} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginTop: "10px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              color: "#374151",
            }}
          >
            Não tem uma conta?
          </span>

          <Link
            to="/cadastro"
            style={{
              fontSize: "14px",
              color: "rgb(210, 39, 42)",
              textDecoration: "none",
            }}
          >
            Registre-se
          </Link>
        </div>

      </div>
    </section>
  );
};