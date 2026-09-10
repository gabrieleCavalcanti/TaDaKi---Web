const BASE_URL = "http://localhost:8000";
// const BASE_URL = "http://192.168.0.109:3000";

// Essa é uma função "generica" nós vamos enviar o tipo na hora da requisição, caso não seja informado o tipo ela vai utilizar qualquer um.
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // envia e recebe cookies HTTP-Only
  });

  if (
    response.status === 401 &&
    endpoint !== "/auth/login" &&
    endpoint !== "/auth/refresh" &&
    endpoint !== "/auth/me"
  ) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (refreshRes.ok) {
        const retryRes = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });

        if (!retryRes.ok) {
          const errData = await retryRes.json().catch(() => ({}));
          throw new Error(
            errData.error || errData.message || "Erro na requisição",
          );
        }
        return retryRes.json();
      }
    } catch (error) {
      console.error(error);
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "Erro na requisição");
  }

  return data;
}

// CADASTRO DE PESSOA (Cliente ou Organização)
export async function cadastrarPessoa(dados: any) {

    return apiFetch("/pessoas", {
        method: "POST",
        body: JSON.stringify(dados),
    });
}