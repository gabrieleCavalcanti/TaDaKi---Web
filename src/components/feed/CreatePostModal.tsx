import { Check, ImagePlus, Upload, X, Image, FileText, Send, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../services/api";
import { validateImage } from "./model";
import type { Category, Person } from "./model";
import { useDialog } from "./useDialog";

type Frame = "original" | "square" | "portrait";
async function prepareImage(file: File, frame: Frame) {
  if (frame === "original") return file;
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = frame === "square" ? 1 : 4 / 5;
    const cropWidth = Math.min(bitmap.width, bitmap.height * ratio);
    const cropHeight = cropWidth / ratio;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(Math.min(cropWidth, 1600));
    canvas.height = Math.round(canvas.width / ratio);
    canvas
      .getContext("2d")!
      .drawImage(
        bitmap,
        (bitmap.width - cropWidth) / 2,
        (bitmap.height - cropHeight) / 2,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("Não foi possível preparar a foto.")),
        "image/jpeg",
        0.92,
      ),
    );
    return new File([blob], "produto.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
export function CreatePostModal({
  open,
  onClose,
  onPublished,
  person,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onPublished: () => Promise<void>;
  person: Person | null;
  categories: Category[];
}) {
  const [step, setStep] = useState(0);
  const [restoredKey, setRestoredKey] = useState("");
  const publishLock = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(0);
  const [frame, setFrame] = useState<Frame>("original");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const draftKey = `tadaki:draft:${person?.id_organizacao ?? person?.id_pessoa ?? 0}`;
  const close = useCallback(() => {
    if (!busy) {
      if (step === 2) setStep(0);
      onClose();
    }
  }, [busy, onClose, step]);
  useDialog(open, dialog, close);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "{}");
      setTitle(saved.title || "");
      setDescription(saved.description || "");
      setCategory(Number(saved.category) || 0);
    } catch {
      /* ignore corrupt draft */
    }
    setRestoredKey(draftKey);
  }, [draftKey]);
  useEffect(() => {
    if (restoredKey === draftKey && step !== 2)
      localStorage.setItem(
        draftKey,
        JSON.stringify({ title, description, category }),
      );
  }, [draftKey, restoredKey, step, title, description, category]);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const selectFile = (value?: File) => {
    if (!value) return;
    const issue = validateImage(value.type, value.size);
    setError(issue);
    if (!issue) {
      setFile(value);
      setFrame("original");
    }
  };
  const publish = async () => {
    if (publishLock.current) return;
    setError("");
    if (!file) return setError("Selecione uma foto do produto ou serviço.");
    if (!title.trim()) return setError("Dê um nome ao produto ou serviço.");
    if (!categories.some((item) => Number(item.id_categoria) === category))
      return setError("Selecione uma categoria válida.");
    if (!person?.id_organizacao)
      return setError(
        "Não foi possível identificar sua organização. Atualize o feed e tente novamente.",
      );
    publishLock.current = true;
    setBusy(true);
    try {
      const upload = await prepareImage(file, frame);
      const data = new FormData();
      data.append("titulo", title.trim());
      data.append("descricao", description.trim());
      data.append("id_categoria", String(category));
      data.append("id_organizacao", String(person.id_organizacao));
      data.append("image", upload);
      await apiFetch("/posts", { method: "POST", body: data });
      localStorage.removeItem(draftKey);
      setTitle("");
      setDescription("");
      setCategory(0);
      setStep(2);
      setFile(null);
      try { await onPublished(); } catch {
        setError("Seu post foi publicado. Atualize o feed para visualizá-lo.");
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível publicar. Seu rascunho foi mantido.",
      );
    } finally {
      setBusy(false);
      publishLock.current = false;
    }
  };
  if (!open) return null;
  return (
    <div
      className="create-post-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        className="create-post-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-title"
        ref={dialog}
      >
        <header className="composer-header composer-header--editor">
          <div>
            <span className="composer-eyebrow">SUA ORGANIZAÇÃO</span>
            <h2 id="composer-title">{step === 2 ? "Publicação concluída" : "Criar publicação"}</h2>
          </div>
          <button type="button" className="feed-action" aria-label="Fechar criação de publicação" disabled={busy} onClick={close}><X size={22} /></button>
        </header>
        {step === 2 ? (
          <div className="publish-success">
            <span className="success-icon"><Check size={36} /></span>
            <h3>Seu negócio está no feed</h3>
            <p>Sua publicação já pode ser descoberta pela comunidade.</p>
            {error && <p role="status">{error}</p>}
            <button type="button" className="primary-button" onClick={close}>Voltar para o feed</button>
          </div>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); void publish(); }} aria-busy={busy}>
            <div className="composer-intro">
              <p>Apresente seu produto ou serviço com uma boa foto e os detalhes que fazem a diferença.</p>
              <span><Check size={14} /> Texto salvo como rascunho</span>
            </div>
            <div className="composer-body has-details composer-editor">
              <section className="composer-media" aria-label="Imagem e prévia da publicação">
                <div className="composer-section-title"><Image size={18} /><h3>Foto da publicação</h3><span>Obrigatória</span></div>
                {preview ? (
                  <>
                    <div className={`composer-preview frame-${frame}`}><img src={preview} alt="Prévia do produto" /></div>
                    <div className="frame-options" role="group" aria-label="Enquadramento da imagem">
                      {([["original", "Foto inteira"], ["square", "Quadrado"], ["portrait", "Vertical"]] as const).map(([value, label]) => (
                        <button type="button" key={value} className={frame === value ? "selected" : ""} aria-pressed={frame === value} onClick={() => setFrame(value)} disabled={busy}>{label}</button>
                      ))}
                      <button type="button" onClick={() => picker.current?.click()} disabled={busy}>Trocar foto</button>
                    </div>
                    {frame !== "original" && <p className="helper-text">O recorte central mostrado na prévia será aplicado à publicação.</p>}
                    <div className="composer-post-preview">
                      <span className="composer-preview-label">PRÉVIA DO TEXTO</span>
                      <strong>{title.trim() || "Nome do produto ou serviço"}</strong>
                      <p>{description.trim() || "A descrição da sua publicação aparecerá aqui."}</p>
                      <span className="category-badge">{categories.find(item => Number(item.id_categoria) === category)?.descricao || "Categoria"}</span>
                    </div>
                  </>
                ) : (
                  <button type="button" className={`upload-area ${dragging ? "is-dragging" : ""}`} disabled={busy} onClick={() => picker.current?.click()}
                    onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                    onDrop={(event) => { event.preventDefault(); setDragging(false); if (!busy) selectFile(event.dataTransfer.files[0]); }}>
                    <span className="upload-icon"><ImagePlus size={42} strokeWidth={1.5} /></span>
                    <h3>Mostre o que você faz</h3>
                    <p>Arraste sua foto para cá ou escolha uma imagem do computador.</p>
                    <span className="primary-button"><Upload size={16} /> Selecionar imagem</span>
                    <small>PNG ou JPEG · até 10 MB</small>
                  </button>
                )}
                <input ref={picker} type="file" hidden accept="image/png,image/jpeg" disabled={busy} onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
              </section>
              <section className="composer-details" aria-label="Informações da publicação">
                <div className="composer-section-title"><FileText size={18} /><h3>Informações</h3></div>
                <div className="composer-business">
                  <span className="org-avatar">{person?.nome?.charAt(0) || "T"}</span>
                  <div><strong>{person?.nome || person?.username || "Sua empresa"}</strong><small>Publicando como organização</small></div>
                </div>
                <label htmlFor="post-title">Produto ou serviço <span className="required-mark">*</span></label>
                <input id="post-title" maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Bolo de chocolate artesanal" disabled={busy} required />
                <span className="field-count">{title.length}/150</span>
                <label htmlFor="post-description">Descrição <span className="optional-mark">Opcional</span></label>
                <textarea id="post-description" maxLength={3000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Conte os diferenciais, opções disponíveis e como entrar em contato." rows={5} disabled={busy} />
                <span className="field-count">{description.length}/3000</span>
                <label htmlFor="post-category">Categoria <span className="required-mark">*</span></label>
                <select id="post-category" aria-label="Categoria" value={category} onChange={(event) => setCategory(Number(event.target.value))} disabled={busy || !categories.length}>
                  <option value={0}>Selecione a categoria</option>
                  {categories.map(item => <option value={item.id_categoria} key={item.id_categoria}>{item.descricao}</option>)}
                </select>
                {!categories.length && <p className="error-text">As categorias não carregaram. Feche o modal e atualize o feed.</p>}
                <p className="helper-text">Escolha a categoria que melhor representa seu produto ou serviço. Ao recarregar a página, selecione a foto novamente.</p>
              </section>
            </div>
            {error && <p className="composer-error" role="alert">{error}</p>}
            <footer className="composer-footer">
              <span className="composer-checklist">{file ? "Foto selecionada" : "Selecione uma foto"} · {title.trim() && category ? "Informações preenchidas" : "Preencha nome e categoria"}</span>
              <div><button type="button" className="composer-cancel" disabled={busy} onClick={close}>Cancelar</button>
                <button type="submit" className="primary-button composer-submit" disabled={busy || !categories.length}>
                  {busy ? <LoaderCircle size={18} className="composer-spinner" /> : <Send size={18} />}{busy ? "Publicando…" : "Publicar post"}
                </button>
              </div>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
