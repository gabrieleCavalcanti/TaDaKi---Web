import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Home,
  Package,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if(!user) return null

  return (
    <nav
      style={{
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "0 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1, #10b981)",
              padding: "8px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <span
            style={{ fontWeight: 700, fontSize: "1.15rem", color: "#f8fafc" }}
          >
            SecureAuth{" "}
            <span
              style={{
                fontSize: "0.75rem",
                color: "#10b981",
                fontWeight: 600,
                padding: "2px 8px",
                background: "rgba(16,185,129,0.15)",
                borderRadius: "12px",
              }}
            >
              HTTP-Only
            </span>
          </span>
        </div>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: isActive ? "#818cf8" : "#94a3b8",
              background: isActive ? "rgba(99, 102, 241, 0.12)" : "transparent",
              transition: "all 0.2s ease",
            })}
          >
            <Home size={18} />
            Home
          </NavLink>

          <NavLink
            to="/products"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: isActive ? "#818cf8" : "#94a3b8",
              background: isActive ? "rgba(99, 102, 241, 0.12)" : "transparent",
              transition: "all 0.2s ease",
            })}
          >
            <Package size={18} />
            Produtos
          </NavLink>
        </div>

        {/* User Info & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <UserIcon size={16} color="#94a3b8" />
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#f8fafc",
              }}
            >
              {user.nome || user.email}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ padding: "8px 14px", fontSize: "0.85rem" }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
};
