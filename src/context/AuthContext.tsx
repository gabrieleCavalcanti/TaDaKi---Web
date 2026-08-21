import { createContext, useState, useEffect } from "react";
import { apiFetch } from "../services/api";

export interface User {
    id: number;
    nome?: string;
    email: string;
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

export interface CadastroCliente {
    nome: string;
    usuario: string;
    email: string;
    senha: string;
    dataNascimento: string;
}

export interface CadastroOrganizacao {
    nomeOrganizacao: string;
    nomeFantasia: string;
    usuario: string;
    email: string;
    senha: string;
    tipoDocumento: "cpf" | "cnpj";
    documento: string;
}

export const AuthProvider = ({ children }: { children: any }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await apiFetch<{ user: User }>("/auth/me");

                if (response && response.user) {
                    setUser(response.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                try {
                    const refreshRes = await fetch(
                        "http://localhost:8000/auth/refresh",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            credentials: "include",
                        }
                    );

                    if (refreshRes.ok) {
                        const meRes = await apiFetch<{ user: User }>(
                            "/auth/me"
                        );

                        setUser(meRes.user);
                    } else {
                        setUser(null);
                    }
                } catch (error) {
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await apiFetch<{
                message: string;
                user: User;
            }>("/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });

            if (response.user) {
                setUser(response.user);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Erro ao realizar login!");
            }

            throw error;
        }
    };

    const cadastrarCliente = async (
        dados: CadastroCliente
    ) => {

        try {

            await apiFetch(
                "/auth/registro/cliente",
                {
                    method: "POST",

                    body: JSON.stringify({
                        nome: dados.nome,

                        usuario: dados.usuario,

                        email: dados.email,

                        senha: dados.senha,

                        dataNascimento:
                            dados.dataNascimento,
                    }),
                }
            );

        } catch (error: unknown) {

            if (error instanceof Error) {

                setError(error.message);

            } else {

                setError(
                    "Erro ao cadastrar cliente!"
                );

            }

            throw error;
        }
    };

    const cadastrarOrganizacao = async (
        dados: CadastroOrganizacao
    ) => {

        try {

            await apiFetch(
                "/registro/organizacao",
                {
                    method: "POST",

                    body: JSON.stringify({

                        nomeOrganizacao:
                            dados.nomeOrganizacao,

                        nomeFantasia:
                            dados.nomeFantasia,

                        usuario:
                            dados.usuario,

                        email:
                            dados.email,

                        senha:
                            dados.senha,

                        tipoDocumento:
                            dados.tipoDocumento,

                        documento:
                            dados.documento,
                    }),
                }
            );

        } catch (error: unknown) {

            if (error instanceof Error) {

                setError(error.message);

            } else {

                setError(
                    "Erro ao cadastrar organização!"
                );

            }

            throw error;
        }
    };

    const logout = async () => {
        try {
            await apiFetch("/auth/logout", {
                method: "POST",
            });
        } catch (error) {
            console.error("Erro ao fazer logout no servidor", error);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user, loading, error, login, cadastrarCliente,
                cadastrarOrganizacao, logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );

};



// import { createContext, useState, useEffect } from "react";
// import { apiFecth } from "../services/api";

// export interface User{
//     id: number,
//     nome?: string,
//     email: string,
//     role?: string,
//     status?: number;
// }

// export interface AuthContextType {
//     user: User | null;
//     loading: boolean;
//     error: string | null;
//     login: (email: string, senha: string) => Promise<void>;
//     logout: () => Promise<void>;
// }

// export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState< User | null > (null);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);

//     useEffect(() => {
//         const checkAuthStatus = async () => {
//             try {
//                 const response = await apiFecth<{user: User}> ('/auth/me');

//                 if (response && response.user) {
//                     setUser(response.user);
//                 } else {
//                     setUser(null);
//                 }
//             } catch (error) {
//                 try {
//                     const refreshRes = await fetch(`http://localhost:3000/auth/refresh`, {
//                         method: 'POST',
//                         headers: { "Content-Type": "application/json"},
//                         credentials: "include",
//                     });

//                     if (refreshRes.ok) {
//                         // Refresh bem-sucedido: tentar buscar o usuario novamente
//                         const meRes = await apiFecth<{user: User}>('/auth/me');
//                         setUser(meRes.user);
//                     } else {
//                         //refreshToken tambem expirou ou invalido, devemos desligar o usuario
//                         setUser(null);
//                     }
//                 } catch (error) {
//                     setUser(null);
//                 }
//             } finally {
//                 setLoading(false);
//             }
//         };

//         checkAuthStatus();
//     }, []);

//     const login = async (email: string, senha: string) => {
//         try {
//             const response = await apiFecth<{ message: string; user: User}>(
//                 "/auth/login",
//                 {
//                     method: "POST",
//                     body: JSON.stringify({ email, senha}),
//                 },
//             );

//             if (response.user) {
//                 setUser(response.user);
//             }
//         } catch (error) {
//             setError(error.message || "Erro ao realizar login!");
//             throw error;
//         }
//     };

//     const logout = async () => {
//         try {
//             await apiFecth("/auth/logout", {method: "POST"});
//         } catch (error) {
//             console.error("Erro ao fazer logout no servidor", error);
//         } finally {
//             setUser(null)
//         }
//     };

//     return (
//         <AuthContext.Provider value={{user, loading, error, login, logout}}>
//             {children}
//         </AuthContext.Provider>
//     )
// };