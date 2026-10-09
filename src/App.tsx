import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute } from "./components/PrivateRoute";
import { Cadastro } from "./pages/Cadastro";
import { Home } from "./pages/Home";
import { Likes } from "./pages/Likes";
import { Login } from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import PerfilPessoal from "./pages/PerfilPessoal";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/likes" element={<Likes />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil/:id_pessoa" element={<Perfil />} />
          <Route path="/perfil-pessoal" element={<PerfilPessoal />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;