import { useCallback, useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../services/api";
import { rows, userType } from "./model";
import type { Person } from "./model";

export function OrganizationFavoriteButton({ personId }: { personId: number }) {
  const { user } = useAuth();
  const canFavorite = userType(user) === "CLIENTE";
  const [orgId, setOrgId] = useState(0);
  const [favoriteId, setFavoriteId] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const run = ++generation.current;
    setBusy(true); setError(""); setOrgId(0); setFavoriteId(0);
    try {
      const [organizations, favorites] = await Promise.all([
        apiFetch("/pessoas?tipo=ORGANIZACAO"), apiFetch("/Favoritos"),
      ]);
      if (run !== generation.current) return;
      const id = Number(rows<Person>(organizations, ["funcionarios", "pessoas", "data"]).find(p => Number(p.id_pessoa) === personId)?.id_organizacao);
      if (!id) throw new Error("Não foi possível identificar a organização.");
      setOrgId(id);
      const entry = rows<{ id_organizacao: number; id_favorito: number }>(favorites, ["resultadoSelecionaTodos", "favoritos"]).find(f => Number(f.id_organizacao) === id);
      setFavoriteId(Number(entry?.id_favorito) || 0);
    } catch (cause) {
      if (run === generation.current) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os favoritos.");
    } finally { if (run === generation.current) setBusy(false); }
  }, [personId]);
  useEffect(() => {
    if (canFavorite) void load();
    return () => { generation.current++; };
  }, [canFavorite, user?.id_pessoa, load]);
  const toggle = async () => {
    if (lock.current || !orgId) return;
    lock.current = true; setBusy(true); setError("");
    const run = generation.current;
    try {
      let next = 0;
      if (favoriteId) await apiFetch(`/Favoritos/${favoriteId}`, { method: "DELETE" });
      else {
        const result = await apiFetch<{ novoRegistro?: { insertId?: number }; id_favorito?: number }>("/Favoritos", { method: "POST", body: JSON.stringify({ id_organizacao: orgId }) });
        next = Number(result.novoRegistro?.insertId ?? result.id_favorito);
        if (!next) throw new Error("Atualize os favoritos antes de tentar novamente.");
      }
      if (run === generation.current) setFavoriteId(next);
    } catch (cause) { if (run === generation.current) setError(cause instanceof Error ? cause.message : "Não foi possível atualizar os favoritos."); }
    finally { lock.current = false; if (run === generation.current) setBusy(false); }
  };
  if (!canFavorite) return null;
  return <div className="organization-favorite">
    <button type="button" aria-pressed={Boolean(favoriteId)} disabled={busy} onClick={() => void (orgId ? toggle() : load())}>
      <Star size={19} fill={favoriteId ? "currentColor" : "none"} />
      {busy ? "Carregando…" : !orgId && error ? "Tentar novamente" : favoriteId ? "Organização favorita" : "Favoritar organização"}
    </button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
