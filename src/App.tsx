import React from "react";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// import { Navbar } from "./components/Navbar";

import { Login } from "./pages/Login";

import { Home } from "./pages/Home";

import { Cadastro } from "./pages/Cadastro";

import { EsqueceuSenha } from "./pages/EsqueceuSenha";

import { RedefinirSenha } from "./pages/RedefinirSenha";

// import { AuthProvider } from "./context/AuthContext";

import { PrivateRoute } from "./components/PrivateRoute";

export const App: React.FC = () => {
    return (
        <BrowserRouter>

            {/* <AuthProvider> */}

            {/* <Navbar /> */}

            <Routes>

                {/* Rota Pública */}
                <Route path="/login" element={<Login />} />

                <Route path="/cadastro" element={<Cadastro />} />

                <Route path="/esqueceuSenha" element={<EsqueceuSenha />} />

                <Route path="/redefinirSenha" element={<RedefinirSenha />} />


                {/* Rotas Privadas */}
                <Route element={<PrivateRoute />}>
                    <Route path="/" element={<Home />} />
                </Route>


                {/* Rota Fallback */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>

            {/* </AuthProvider> */}

        </BrowserRouter>
    );
};

export default App;