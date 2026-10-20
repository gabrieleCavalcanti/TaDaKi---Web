import { useEffect, useState } from "react";
import { validUF } from "./recommendations";
import type { Address } from "./recommendations";

type ViaCep = { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
export function RegionPicker({ initial, save }: { initial?: Address; save: (address: Address) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<Address>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  useEffect(() => { if (open) { setAddress(initial ?? {}); setCep(""); setError(""); } }, [open, initial]);
  const lookup = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) { setError("Digite um CEP válido com 8 números."); return; }
    setLookingUp(true); setError("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) throw new Error("Serviço indisponível");
      const data = await response.json() as ViaCep;
      if (data.erro || !data.localidade || !validUF(data.uf ?? "")) { setError("CEP não encontrado. Confira os números ou informe a região manualmente."); return; }
      setAddress({ municipio: data.localidade, uf: data.uf, bairro: data.bairro || "", rua: data.logradouro || "" });
    } catch { setError("Não foi possível consultar o CEP. Tente novamente ou preencha a região manualmente."); }
    finally { setLookingUp(false); }
  };
  return <div className="region-picker">
    <button type="button" className="back-button" aria-expanded={open} onClick={() => setOpen(value => !value)}>Definir minha região pelo CEP</button>
    {open && <form className="region-form" onSubmit={async event => {
      event.preventDefault(); if (busy || lookingUp) return;
      const uf = String(address.uf ?? "").trim().toUpperCase();
      if (!String(address.municipio ?? "").trim() || !validUF(uf)) { setError("Consulte um CEP ou informe cidade e UF."); return; }
      setBusy(true); setError("");
      try { await save({ ...address, municipio: address.municipio!.trim(), uf }); setOpen(false); }
      catch { setError("Não foi possível salvar a região neste dispositivo."); }
      finally { setBusy(false); }
    }}>
      <p>Digite seu CEP para preencher rua, bairro, cidade e estado. Você pode corrigir os campos antes de salvar.</p>
      <label>CEP
        <input inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" maxLength={9} value={cep}
          onChange={event => { const value = event.target.value.replace(/\D/g, "").slice(0, 8); setCep(value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5)}` : value); }} disabled={busy || lookingUp} />
      </label>
      <button type="button" className="back-button" disabled={busy || lookingUp} onClick={() => void lookup()}>{lookingUp ? "Consultando CEP…" : "Buscar endereço pelo CEP"}</button>
      {([ ["rua", "Rua"], ["bairro", "Bairro"], ["municipio", "Cidade"], ["uf", "Estado (UF)"] ] as const).map(([key, label]) =>
        <label key={key}>{label}<input value={address[key] ?? ""} maxLength={key === "uf" ? 2 : 120} required={key === "uf" || key === "municipio"} disabled={busy || lookingUp} onChange={event => setAddress(prev => ({ ...prev, [key]: event.target.value }))}/></label>
      )}
      {error && <p role="alert">{error}</p>}
      <button className="primary-button" disabled={busy || lookingUp}>{busy ? "Salvando…" : "Usar esta região"}</button>
    </form>}
  </div>;
}
