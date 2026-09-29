export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getImageUrl(image?: string | null): string {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;

  const normalized = image.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.startsWith("images/")) {
    return `${BASE_URL}/${normalized}`;
  }

  return `${BASE_URL}/images/${normalized}`;
}

export function getProfilePhoto(person: any): string {
  const value =
    person?.foto ??
    person?.foto_perfil ??
    person?.imagem_perfil ??
    person?.imagem ??
    person?.avatar ??
    person?.url_foto ??
    null;

  return getImageUrl(value);
}

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
    credentials: "include",
  });

  if (
    response.status === 401 &&
    endpoint !== "/auth/login" &&
    endpoint !== "/auth/refresh" &&
    endpoint !== "/auth/me"
  ) {
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

      const retryData = await retryRes.json().catch(() => ({}));

      if (!retryRes.ok) {
        throw new Error(
          retryData.error || retryData.message || "Erro na requisição",
        );
      }

      return retryData;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "Erro na requisição");
  }

  return data;
}

export async function cadastrarPessoa(dados: any) {
  return apiFetch("/pessoas", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}
