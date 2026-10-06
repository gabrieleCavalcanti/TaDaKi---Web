export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


export function getBaseUrl() {
  return BASE_URL;
}

export function getImageUrl(image?: string | null) {
  if (!image) return "";

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${BASE_URL}${image}`;
  }

  if (image.startsWith("images/")) {
    return `${BASE_URL}/${image}`;
  }

  return `${BASE_URL}/images/${image}`;
}

// export function saveAuthTokens(
//   accessToken?: string | null,
//   refreshToken?: string | null,
// ) {
//   if (accessToken) {
//     localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
//   }

//   if (refreshToken) {
//     localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
//   }
// }

// export function clearAuthTokens() {
//   localStorage.removeItem(ACCESS_TOKEN_KEY);
//   localStorage.removeItem(REFRESH_TOKEN_KEY);
// }

// function getAccessToken() {
//   return localStorage.getItem(ACCESS_TOKEN_KEY);
// }

// function getRefreshToken() {
//   return localStorage.getItem(REFRESH_TOKEN_KEY);
// }

async function parseResponse(response: Response) {
  return response.json().catch(() => ({}));
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});

  if (
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Se o accessToken expirou, tenta renovar
  if (
    response.status === 401 &&
    endpoint !== "/auth/login" &&
    endpoint !== "/auth/refresh"
  ) {
    const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshResponse.ok) {
      // O backend criou um novo accessToken no cookie.
      // O navegador já recebeu esse cookie automaticamente.

      const retryHeaders = new Headers(options.headers || {});

      if (
        !(options.body instanceof FormData) &&
        !retryHeaders.has("Content-Type")
      ) {
        retryHeaders.set("Content-Type", "application/json");
      }

      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Erro ${response.status} na requisição`,
    );
  }

  return data as T;
}

export async function cadastrarPessoa(dados: any) {
  return apiFetch("/pessoas", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}
