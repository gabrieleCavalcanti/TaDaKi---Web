export const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "tadaki_access_token";
const REFRESH_TOKEN_KEY = "tadaki_refresh_token";
export function getBaseUrl() {
  return BASE_URL;
}
export function getImageUrl(image?: string | null) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return `${BASE_URL}${image}`;
  return `${BASE_URL}/${image.startsWith("images/") ? image : `images/${image}`}`;
}
export function saveAuthTokens(
  accessToken?: string | null,
  refreshToken?: string | null,
) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}
export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
async function parseResponse(response: Response) {
  return response.json().catch(() => ({}));
}
let refreshing: Promise<void> | null = null;
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const request = () =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  let response = await request();
  if (
    response.status === 401 &&
    !/^\/auth\/(login|google|refresh|logout)\/?(?:\?.*)?$/.test(path)
  ) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    // A API aceita o refresh token no cookie httpOnly ou no corpo.
    // Não depende de existir uma cópia no localStorage.
    if (!refreshing) {
      refreshing = fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      })
        .then(async (result) => {
          const data = await parseResponse(result);
          if (!result.ok) {
            if (result.status === 401 || result.status === 403) {
              clearAuthTokens();
              throw new Error("Sua sessão expirou. Entre novamente para continuar.");
            }
            throw new Error("Não foi possível renovar sua sessão. Tente novamente.");
          }
          if (data.token_acesso) {
            saveAuthTokens(data.token_acesso, data.refresh_token);
          } else {
            // O acesso renovado está no cookie. Remove o Bearer expirado.
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            if (data.refresh_token) saveAuthTokens(null, data.refresh_token);
          }
        })
        .finally(() => {
          refreshing = null;
        });
    }
    await refreshing;
    const refreshedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (refreshedToken) headers.set("Authorization", `Bearer ${refreshedToken}`);
    else headers.delete("Authorization");
    response = await request();
  }
  const data = await parseResponse(response);
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Sua sessão expirou. Entre novamente para continuar."
        : data?.error ||
            data?.message ||
            `Erro ${response.status} na requisição`,
    );
  return data as T;
}
export async function cadastrarPessoa(dados: any) {
  return apiFetch("/pessoas", { method: "POST", body: JSON.stringify(dados) });
}
export async function loginComGoogle(credential: string) {
  const data = await apiFetch<any>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ token: credential }),
  });
  saveAuthTokens(data.token_acesso, data.refresh_token);
  return data;
}
