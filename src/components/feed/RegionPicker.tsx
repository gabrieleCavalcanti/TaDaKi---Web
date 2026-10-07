import { useEffect, useState } from "react";
import { validUF } from "./recommendations";
import type { Address } from "./recommendations";
export function RegionPicker({initial, save}: {initial?: Address; save: (address: Address) => Promise<void>}) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState<Address>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {if(open) {setAddress(initial ?? {}); setError("");}}, [open, initial]);
  return <div className="region-picker">
    <button className="back-button" aria-expanded={open} onClick={() => setOpen(!open)}>Definir minha região</button>
    {open && <form className="region-form" onSubmit={async event => {
      event.preventDefault(); if(busy) return;
      const uf = String(address.uf ?? "").trim().toUpperCase();
      if (!String(address.municipio ?? "").trim() || !validUF(uf)) {setError("Informe a cidade e a sigla do estado, por exemplo SP."); return;}
      setBusy(true); setError("");
      try {await save({...address, municipio: address.municipio!.trim(), uf}); setOpen(false);} catch {setError("Não foi possível salvar a região neste dispositivo.");} finally {setBusy(false);}
    }}>
      <p>Escolha onde deseja descobrir negócios. A região fica salva para sua conta neste dispositivo.</p>
      {([["municipio","Cidade"],["uf","Estado (UF)"],["bairro","Bairro (opcional)"],["rua","Rua (opcional)"]] as const).map(([key,label]) => <label key={key}>{label}<input value={address[key] ?? ""} maxLength={key === "uf" ? 2 : 120} required={key === "uf" || key === "municipio"} disabled={busy} onChange={e=>setAddress({...address,[key]:e.target.value})}/></label>)}
      {error && <p role="alert">{error}</p>}
      <button className="primary-button" disabled={busy}>{busy ? "Salvando…" : "Salvar região"}</button>
    </form>}
  </div>;
}
