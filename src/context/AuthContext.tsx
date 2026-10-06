import { createContext, useEffect, useState } from "react";
import {
    apiFetch,
} from "../services/api";

export interface User {
    id?: number;
    id_pessoa?: number;
    id_pessoa_login?: number;
    nome?: string;
    username?: string;
    email?: string;
    tipo?: string;
    role?: string;
    status?: number;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

export const AuthProvider = ({ children }: { children: any }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await apiFetch<{ user: User }>(
                    "/auth/me"
                );

                setUser(response?.user ?? null);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = async (username: string, password: string) => {
        setError(null);

        try {
            const response = await apiFetch<{
                message: string;
                user: User;
                token_acesso?: string;
                refresh_token?: string;
            }>("/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });

            // saveAuthTokens(
            //     response.token_acesso,
            //     response.refresh_token
            // );

            // O login da API não traz "tipo"; /auth/me traz.
            const me = await apiFetch<{ user: User }>("/auth/me");

            setUser(me.user);
        } catch (error: unknown) {
            const mensagem =
                error instanceof Error
                    ? error.message
                    : "Erro ao realizar login!";

            setError(mensagem);
            // clearAuthTokens();
            throw error;
        }
    };

    const logout = async () => {
        try {
            await apiFetch("/auth/logout", {
                method: "POST",
            });
        } catch (error) {
            console.error(
                "Erro ao fazer logout no servidor",
                error
            );
        } finally {
            // clearAuthTokens();
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
