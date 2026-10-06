export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ACCESS_TOKEN_KEY = "tadaki_access_token";
const REFRESH_TOKEN_KEY = "tadaki_refresh_token";

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

export function saveAuthTokens(
  accessToken?: string | null,
  refreshToken?: string | null,
) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

async function parseResponse(response: Response) {
  return response.json().catch(() => ({}));
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = getAccessToken();

  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (
    response.status === 401 &&
    endpoint !== "/auth/login" &&
    endpoint !== "/auth/refresh"
  ) {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          refreshToken,
        }),
      });

      // if (refreshResponse.ok) {
      //   const refreshData = await parseResponse(refreshResponse);

      //   if (refreshData?.token_acesso) {
      //     saveAuthTokens(refreshData.token_acesso, null);
      //   }

      //   const novoToken = getAccessToken();
      //   const retryHeaders = new Headers(options.headers || {});

      //   if (!(options.body instanceof FormData) && !retryHeaders.has("Content-Type")) {
      //     retryHeaders.set("Content-Type", "application/json");
      //   }

      //   if (novoToken) {
      //     retryHeaders.set("Authorization", `Bearer ${novoToken}`);
      //   }

      //   response = await fetch(url, {
      //     ...options,
      //     headers: retryHeaders,
      //     credentials: "include",
      //   });
      // }
      if (refreshResponse.ok) {
        const retryHeaders = new Headers(options.headers || {});

        if (
          !(options.body instanceof FormData) &&
          !retryHeaders.has("Content-Type")
        ) {
          retryHeaders.set("Content-Type", "application/json");
        }

        // O novo Access Token está no cookie httpOnly.
        // O navegador envia esse cookie automaticamente.
        retryHeaders.delete("Authorization");

        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: "include",
        });
      }
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || `Erro ${response.status} na requisição`,
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
