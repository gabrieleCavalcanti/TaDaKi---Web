import React from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Cadastro } from "./pages/Cadastro";
import Perfil from "./pages/Perfil";

import { PrivateRoute } from "./components/PrivateRoute";

export const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>

                {/* =========================
                    ROTAS PÚBLICAS
                ========================= */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/cadastro"
                    element={<Cadastro />}
                />

                {/* PERFIL - SEM AUTENTICAÇÃO */}
                <Route
                    path="/perfil"
                    element={<Perfil />}
                />

                {/* Perfil com ID - caso queira testar depois */}
                <Route
                    path="/perfil/:id_pessoa"
                    element={<Perfil />}
                />


                {/* =========================
                    ROTAS PRIVADAS
                ========================= */}

                <Route element={<PrivateRoute />}>
                    <Route
                        path="/"
                        element={<Home />}
                    />
                </Route>


                {/* =========================
                    FALLBACK
                ========================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/perfil"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
};

export default App;
