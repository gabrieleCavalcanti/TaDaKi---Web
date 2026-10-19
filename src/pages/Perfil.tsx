import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Heart, User, ArrowLeft, ImageOff, Store, Archive, MoreVertical, Star, RefreshCw, Inbox, Plus, ImagePlus, X, Search } from "lucide-react";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import {

    buscarAvaliacoesPorOrganizacao,

    calcularMediaAvaliacoes,

    criarAvaliacao as criarAvaliacaoApi,

} from "../pages/Avaliacao";

import type { IAvaliacao } from "../pages/Avaliacao";

import { BASE_URL, apiFetch } from "../services/api";

// Adaptador local: usa a renovação de sessão do apiFetch existente,
// mantendo o formato Response esperado pelas rotinas desta página.
async function apiFetchResponse(endpoint: string, options: RequestInit = {}): Promise<Response> {
    try {
        const dados = await apiFetch<any>(endpoint, options);
        return new Response(JSON.stringify(dados ?? {}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        const codigo = mensagem.match(/Erro\s+(\d{3})\s+na requisição/i);
        const status = codigo ? Number(codigo[1]) : /sessão expirou/i.test(mensagem) ? 401 : 400;
        return new Response(JSON.stringify({ message: mensagem, error: mensagem }), {
            status,
            headers: { "Content-Type": "application/json" },
        });
    }
}


import "../css/Feed.css";
import "../css/VisualizarPost.css";
import "../css/Perfil.css";
import { CreatePostModal } from "../components/feed/CreatePostModal";
import type { Category } from "../components/feed/model";

const NA = "N/A";

interface IPessoa {

    id_pessoa?: number;

    id_organizacao?: number;

    id_cliente?: number;

    nome?: string;

    tipo?: string;
    email?: string;
    telefone?: string;

}

interface IOrganizacao extends IPessoa {

    cpf?: string;

    cnpj?: string;
    email?: string;
    telefone?: string;

    data_criacao?: string;

    id_area_atuacao?: number;

}

interface ICliente {

    id_cliente?: number;

    id_pessoa?: number;

    data_nascimento?: string;

}

interface IPost {

    id_post?: number;

    vincularImagem?: string;

    titulo?: string;

    descricao?: string;

    id_categoria?: number;

    status?: string;

    id_organizacao?: number;

}

type Aba = "inicio" | "arquivados" | "posts" | "avaliacoes";

interface ILoadingProps {

    texto: string;

}

interface ISemPostsProps {

    grande?: boolean;

}

interface IPostCardProps {
    post: IPost;
    onAbrirPosts: () => void;
}

interface IInfoLinhaProps {

    icon?: string;

    texto: string;

}

interface IEstatisticaProps {

    numero: string;

    texto: string;

}

function Loading({ texto }: ILoadingProps) {

    return (

        <div className="carregando">

            <div className="spinner" />

            <span className="carregandoTexto">{texto}</span>

        </div>

    );

}

function SemPosts({ grande = false }: ISemPostsProps) {

    return (

        <div className={grande ? "semPostsGrande" : "semPosts"}>

            <span className="semPostsTexto">

                Nenhum post publicado.

            </span>

        </div>

    );

}

function InfoLinha({ icon = "", texto }: IInfoLinhaProps) {

    return (

        <div className="infoLinha">

            <span>{icon}</span>

            <span className="infoTexto">{texto}</span>

        </div>

    );

}

function Estatistica({ numero, texto }: IEstatisticaProps) {

    return (

        <div className="estatistica">

            <span className="numero">{numero}</span>

            <span className="label">{texto}</span>

        </div>

    );

}

function obterUrlImagem(nome?: string): string {

    if (!nome) return "";

    if (/^https?:\/\//i.test(nome)) {

        return nome;

    }

    const nomeArquivo = nome.replace(/\\/g, "/").split("/").pop();

    return nomeArquivo

        ? `${BASE_URL}/images/${nomeArquivo}`

        : "";

}

function PostCard({
    post,
    onAbrirPosts,
}: IPostCardProps) {

    const imagem = obterUrlImagem(post.vincularImagem);
    const [imagemFalhou, setImagemFalhou] = useState(false);

    useEffect(() => { setImagemFalhou(false); }, [imagem]);

    return (

        <button

            type="button"

            className="cardPost"

            onClick={onAbrirPosts}

        >

            <div className="tdkDestaqueImagem">
                {imagem && !imagemFalhou ? <img src={imagem} alt={post.titulo ? `Imagem da publicação ${post.titulo}` : "Imagem da publicação"} loading="lazy" onError={() => setImagemFalhou(true)} /> : <div className="tdkDestaqueSemImagem"><ImageOff size={24} /><span>Publicação</span></div>}
            </div>
            <div className="tdkDestaqueTextoTopo">
                <span className="tdkDestaqueMarcador">Publicação</span>
                <span className="tdkDestaqueSeta" aria-hidden="true">↗</span>
            </div>
            <h3 className="tdkDestaqueTitulo">{post.titulo || NA}</h3>
            <p className="tdkDestaqueDescricao">
                {post.descricao?.trim() || "Clique para visualizar esta publicação."}
            </p>
            <div className="tdkDestaqueRodape">
                <Store size={16} aria-hidden="true" />
                <span>Ver publicação completa</span>
            </div>
        </button>

    );

}

interface ConfirmarPublicacaoProps {
    acao: "arquivar" | "desarquivar";
    titulo?: string;
    ocupado: boolean;
    aoCancelar: () => void;
    aoConfirmar: () => void;
}

function ConfirmarPublicacao({ acao, titulo, ocupado, aoCancelar, aoConfirmar }: ConfirmarPublicacaoProps) {
    const arquivar = acao === "arquivar";
    useEffect(() => {
        const aoTeclar = (evento: KeyboardEvent) => {
            if (evento.key === "Escape" && !ocupado) aoCancelar();
        };
        document.addEventListener("keydown", aoTeclar);
        return () => document.removeEventListener("keydown", aoTeclar);
    }, [ocupado, aoCancelar]);
    return createPortal(
        <div className="tdkConfirmOverlay" onMouseDown={e => {
            if (e.target === e.currentTarget && !ocupado) aoCancelar();
        }}>
            <section className="tdkConfirmModal" role="dialog" aria-modal="true" aria-labelledby="tdkConfirmTitulo">
                <div className="tdkConfirmIcone"><Archive size={24} /></div>
                <h2 id="tdkConfirmTitulo">{arquivar ? "Arquivar publicação?" : "Desarquivar publicação?"}</h2>
                {titulo && <p className="tdkConfirmPost">{titulo}</p>}
                <p className="tdkConfirmDescricao">{arquivar
                    ? "Ela deixará de aparecer no perfil público. Você poderá restaurá-la depois."
                    : "Esta publicação voltará a aparecer no perfil público da organização."}</p>
                <div className="tdkConfirmAcoes">
                    <button type="button" className="tdkConfirmCancelar" disabled={ocupado} onClick={aoCancelar}>Cancelar</button>
                    <button type="button" className="tdkConfirmAceitar" disabled={ocupado} onClick={aoConfirmar}>
                        {ocupado ? "Aguarde..." : arquivar ? "Arquivar publicação" : "Desarquivar"}
                    </button>
                </div>
            </section>
        </div>, document.body
    );
}

type ContatoPerfil = { id_contato: number; email: string | null; telefone: string | null; principal?: number };
type EnderecoPerfil = { principal?: number; id_endereco: number; rua: string; numero: string; bairro: string; municipio: string; cep: string; uf: string };
const chaveEnderecoPreferido = (pessoaId: number) => `tadaki:endereco-preferido:${pessoaId}`;
const lerEnderecoPreferido = (pessoaId: number): number | null => {
    try { const id = Number(localStorage.getItem(chaveEnderecoPreferido(pessoaId))); return id > 0 ? id : null; }
    catch { return null; }
};
const enderecoVazio = { rua: "", numero: "", bairro: "", municipio: "", cep: "", uf: "SP" };

function EditarPerfilModal({ organizacao, aoFechar, aoSalvar }: {
    organizacao: IOrganizacao;
    aoFechar: () => void;
    aoSalvar: (nome: string, email: string, telefone: string) => void;
}) {
    const pessoaId = Number(organizacao.id_pessoa);
    const [nome, setNome] = useState(organizacao.nome ?? "");
    const [contatos, setContatos] = useState<ContatoPerfil[]>([]);
    const [enderecos, setEnderecos] = useState<EnderecoPerfil[]>([]);
    const [enderecoPreferidoLocal, setEnderecoPreferidoLocal] = useState<number | null>(() => lerEnderecoPreferido(pessoaId));
    const [tipoContato, setTipoContato] = useState<"email" | "telefone">("email");
    const [contatoId, setContatoId] = useState<number | null>(null);
    const [valorContato, setValorContato] = useState("");
    const [tornarContatoPrincipal, setTornarContatoPrincipal] = useState(true);
    const [tornarEnderecoPrincipal, setTornarEnderecoPrincipal] = useState(true);
    const [enderecoId, setEnderecoId] = useState<number | null>(null);
    const [endereco, setEndereco] = useState(enderecoVazio);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [aba, setAba] = useState<"dados" | "contatos" | "enderecos">("dados");
    const [buscandoCep, setBuscandoCep] = useState(false);
    const consultaCepAtual = useRef(0);

    async function carregarDados() {
        const [resContatos, resEnderecos] = await Promise.all([
            apiFetch<any>(`/contatos?id_pessoa=${pessoaId}`).catch((e: Error) => {
                if (e.message.includes("Nenhum contato")) return { contatoPessoa: [] };
                throw e;
            }),
            apiFetch<any>(`/enderecos?id_pessoa=${pessoaId}`).catch((e: Error) => {
                if (e.message.includes("Nenhum endereço")) return { enderecoPessoa: [] };
                throw e;
            })
        ]);
        setContatos(resContatos.contatoPessoa ?? []);
        const listaEnderecos: EnderecoPerfil[] = resEnderecos.enderecoPessoa ?? [];
        setEnderecos(listaEnderecos);
        const preferido = lerEnderecoPreferido(pessoaId);
        if (listaEnderecos.length && !listaEnderecos.some(e => e.id_endereco === preferido)) {
            localStorage.setItem(chaveEnderecoPreferido(pessoaId), String(listaEnderecos[0].id_endereco));
            setEnderecoPreferidoLocal(listaEnderecos[0].id_endereco);
        }
    }
    useEffect(() => {
        let ativo = true;
        carregarDados().catch(e => { if (ativo) setErro(e.message || "Não foi possível carregar os dados."); })
            .finally(() => { if (ativo) setCarregando(false); });
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !salvando) aoFechar(); };
        window.addEventListener("keydown", esc);
        return () => { ativo = false; window.removeEventListener("keydown", esc); };
    }, [pessoaId]);

    async function executar(acao: () => Promise<any>, sucesso: string) {
        setErro(""); setMensagem(""); setSalvando(true);
        try { await acao(); await carregarDados(); setMensagem(sucesso); }
        catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível salvar."); }
        finally { setSalvando(false); }
    }
    function selecionarContato(contato?: ContatoPerfil, tipo?: "email" | "telefone") {
        setContatoId(contato?.id_contato ?? null);
        setTipoContato(tipo ?? (contato?.email != null ? "email" : "telefone"));
        setValorContato(contato?.email ?? contato?.telefone ?? "");
        setTornarContatoPrincipal(Boolean(contato?.principal) || !contato);
        setErro(""); setMensagem("");
    }
    function salvarContato() {
        const valor = valorContato.trim();
        if (tipoContato === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) { setErro("Informe um e-mail válido."); return; }
        if (tipoContato === "telefone" && valor.replace(/\D/g, "").length < 10) { setErro("Informe um telefone com DDD."); return; }
        executar(async () => {
            const resultadoContato: any = await apiFetch(`/contatos${contatoId ? `?id=${contatoId}` : ""}`, {
                method: contatoId ? "PUT" : "POST",
                body: JSON.stringify({ id_pessoa: pessoaId, email: tipoContato === "email" ? valor : null, telefone: tipoContato === "telefone" ? valor : null })
            });
            const novoId = contatoId ?? Number(resultadoContato?.novo?.insertId ?? resultadoContato?.novo?.id_contato);
            const jaExistePrincipal = contatos.some(c => (tipoContato === "email" ? !!c.email : !!c.telefone) && !!c.principal);
            if ((tornarContatoPrincipal || !jaExistePrincipal) && novoId > 0) {
                await apiFetch(`/contatos/principal?id=${novoId}`, { method: "PUT", body: JSON.stringify({ id_pessoa: pessoaId }) });
            }
            setContatoId(null); setValorContato("");
        }, "Contato salvo com sucesso.");
    }
    async function consultarCep(cepInformado: string) {
        const cep = cepInformado.replace(/\D/g, "");
        const numeroConsulta = ++consultaCepAtual.current;
        if (cep.length !== 8) { setBuscandoCep(false); return; }
        setBuscandoCep(true);
        setErro("");
        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!resposta.ok) throw new Error("Serviço de CEP indisponível. Preencha manualmente.");
            const dados: { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string } = await resposta.json();
            if (numeroConsulta !== consultaCepAtual.current) return;
            if (dados.erro) { setErro("CEP não encontrado. Confira os números ou preencha manualmente."); return; }
            setEndereco(atual => ({
                ...atual,
                rua: dados.logradouro || atual.rua,
                bairro: dados.bairro || atual.bairro,
                municipio: dados.localidade || atual.municipio,
                uf: dados.uf || atual.uf
            }));
        } catch (e) {
            if (numeroConsulta === consultaCepAtual.current) setErro(e instanceof Error ? e.message : "Falha na consulta do CEP.");
        } finally {
            if (numeroConsulta === consultaCepAtual.current) setBuscandoCep(false);
        }
    }
    function preferirEndereco(id: number) {
        localStorage.setItem(chaveEnderecoPreferido(pessoaId), String(id));
        setEnderecoPreferidoLocal(id);
        setMensagem("Endereço preferido definido.");
        setErro("");
        window.dispatchEvent(new Event("tdk-endereco-preferido"));
    }
    function salvarEndereco() {
        if (!endereco.rua.trim() || !endereco.numero.trim() || !endereco.bairro.trim() || !endereco.municipio.trim() || !/^\d{8}$/.test(endereco.cep.replace(/\D/g, "")) || !/^[A-Za-z]{2}$/.test(endereco.uf.trim())) {
            setErro("Preencha rua, número, bairro, cidade, UF e CEP válido."); return;
        }
        executar(async () => {
            const resultadoEndereco: any = await apiFetch(`/enderecos${enderecoId ? `?id=${enderecoId}` : ""}`, {
                method: enderecoId ? "PUT" : "POST",
                body: JSON.stringify({ ...endereco, cep: endereco.cep.replace(/\D/g, ""), uf: endereco.uf.toUpperCase(), id_pessoa: pessoaId })
            });
            const novoId = enderecoId ?? Number(resultadoEndereco?.novo?.insertId ?? resultadoEndereco?.novo?.id_endereco);
            if (novoId > 0 && (tornarEnderecoPrincipal || !enderecos.length)) preferirEndereco(novoId);
            setEnderecoId(null); setEndereco(enderecoVazio);
        }, "Endereço salvo com sucesso.");
    }
    const emailPrincipal = contatos.find(c => c.email && c.principal)?.email ?? contatos.find(c => c.email)?.email ?? organizacao.email ?? "";
    const telefonePrincipal = contatos.find(c => c.telefone && c.principal)?.telefone ?? contatos.find(c => c.telefone)?.telefone ?? organizacao.telefone ?? "";
    return createPortal(
        <div className="tdkEditOverlay" onMouseDown={e => { if (e.target === e.currentTarget && !salvando) aoFechar(); }}>
            <section className="tdkEditModal" role="dialog" aria-modal="true" aria-labelledby="tdkEditTitle">
                <header className="tdkEditHeader">
                    <div className="tdkEditAvatar">{(organizacao.nome || "T").slice(0, 1).toUpperCase()}</div>
                    <div><span className="tdkEditEyebrow">CONFIGURAÇÕES DA CONTA</span><h2 id="tdkEditTitle">Editar perfil</h2><p>Atualize seus dados e mantenha seu perfil completo.</p></div>
                    <button className="tdkEditClose" type="button" aria-label="Fechar" onClick={aoFechar} disabled={salvando}><X size={21} /></button>
                </header>
                <nav className="tdkEditTabs" aria-label="Seções de edição">
                    <button type="button" className={aba === "dados" ? "ativo" : ""} onClick={() => { setAba("dados"); setErro(""); }}>Dados básicos</button>
                    <button type="button" className={aba === "contatos" ? "ativo" : ""} onClick={() => { setAba("contatos"); setErro(""); }}>Contatos</button>
                    <button type="button" className={aba === "enderecos" ? "ativo" : ""} onClick={() => { setAba("enderecos"); setErro(""); }}>Endereços</button>
                </nav>
                <div className="tdkEditBody">
                    {carregando && <p>Carregando informações...</p>}
                    {aba === "dados" && <div className="tdkEditSection">
                        <h3>Informações da organização</h3><p>Este nome aparece publicamente no seu perfil.</p>
                        <label>Nome da organização<input value={nome} maxLength={100} onChange={e => setNome(e.target.value)} placeholder="Nome da organização" /></label>
                        <button className="tdkEditPrimary" disabled={salvando || !nome.trim()} type="button" onClick={() => executar(async () => {
                            await apiFetch(`/pessoas?id=${pessoaId}`, { method: "PATCH", body: JSON.stringify({ nome: nome.trim(), cpf: organizacao.cpf, cnpj: organizacao.cnpj, data_criacao: organizacao.data_criacao, id_area_atuacao: organizacao.id_area_atuacao }) });
                            aoSalvar(nome.trim(), emailPrincipal, telefonePrincipal);
                        }, "Nome atualizado com sucesso.")}>{salvando ? "Salvando..." : "Salvar nome"}</button>
                    </div>}
                    {aba === "contatos" && <div className="tdkEditSection">
                        <h3>E-mails e telefones</h3><p>Edite seus contatos existentes ou cadastre novos.</p>
                        <div className="tdkEditRecords">{contatos.map(c => <div className="tdkEditRecord" key={c.id_contato}>
                            <span className="tdkEditRecordIcon">{c.email ? "✉" : "☎"}</span><span className="tdkEditRecordText"><strong>{c.email ? "E-mail" : "Telefone"}{Boolean(c.principal) ? " · Principal" : ""}</strong><small>{c.email || c.telefone}</small></span>
                            <button type="button" onClick={() => selecionarContato(c)}>Editar</button>
                            {!c.principal && <button type="button" disabled={salvando} onClick={() => executar(async () => { await apiFetch(`/contatos/principal?id=${c.id_contato}`, { method: "PUT", body: JSON.stringify({ id_pessoa: pessoaId }) }); }, "Contato preferido atualizado.")}>☆ Preferir</button>}
                        </div>)}</div>
                        <div className="tdkEditFormPanel">
                            <h4>{contatoId ? "Editar contato" : "Adicionar contato"}</h4>
                            <div className="tdkEditTypeButtons"><button type="button" className={tipoContato === "email" ? "ativo" : ""} onClick={() => { setTipoContato("email"); setContatoId(null); setValorContato(""); }}>E-mail</button><button type="button" className={tipoContato === "telefone" ? "ativo" : ""} onClick={() => { setTipoContato("telefone"); setContatoId(null); setValorContato(""); }}>Telefone</button></div>
                            <label>{tipoContato === "email" ? "Endereço de e-mail" : "Número com DDD"}<input type={tipoContato === "email" ? "email" : "tel"} value={valorContato} onChange={e => setValorContato(e.target.value)} placeholder={tipoContato === "email" ? "contato@empresa.com.br" : "(19) 99999-9999"} /></label>
                            <label className="tdkEditPreferencia"><input type="checkbox" checked={tornarContatoPrincipal} onChange={e => setTornarContatoPrincipal(e.target.checked)} /> Usar como {tipoContato === "email" ? "e-mail" : "telefone"} preferido no perfil</label>
                            <div className="tdkEditFormActions"><button className="tdkEditPrimary" type="button" disabled={salvando || !valorContato.trim()} onClick={salvarContato}>{salvando ? "Salvando..." : contatoId ? "Salvar alterações" : "Cadastrar contato"}</button>{contatoId && <button className="tdkEditSecondary" type="button" onClick={() => selecionarContato(undefined, tipoContato)}>Cancelar edição</button>}</div>
                        </div>
                    </div>}
                    {aba === "enderecos" && <div className="tdkEditSection">
                        <h3>Endereços cadastrados</h3><p>Cadastre um endereço ou atualize as informações existentes.</p>
                        <div className="tdkEditRecords">{enderecos.map(e => <div className="tdkEditRecord" key={e.id_endereco}><span className="tdkEditRecordIcon">⌖</span><span className="tdkEditRecordText"><strong>{e.rua}, {e.numero}{e.id_endereco === enderecoPreferidoLocal ? " · Preferido ★" : ""}</strong><small>{e.bairro} · {e.municipio}/{e.uf} · {e.cep}</small></span><button type="button" onClick={() => { setEnderecoId(e.id_endereco); setEndereco({ rua: e.rua, numero: e.numero, bairro: e.bairro, municipio: e.municipio, cep: e.cep, uf: e.uf }); setTornarEnderecoPrincipal(e.id_endereco === enderecoPreferidoLocal); setErro(""); }}>Editar</button>{e.id_endereco !== enderecoPreferidoLocal && <button type="button" disabled={salvando} onClick={() => preferirEndereco(e.id_endereco)}>☆ Preferir</button>}</div>)}</div>
                        <div className="tdkEditFormPanel"><h4>{enderecoId ? "Editar endereço" : "Adicionar endereço"}</h4>
                            <div className="tdkEditCepBox"><span className="tdkEditCepIcon">⌖</span><div><strong>Encontre seu endereço pelo CEP</strong><p>Digite os 8 números e preenchemos os dados automaticamente.</p></div></div>
                            <div className="tdkEditFields">
                                <label className="wide tdkEditCepFirst">CEP<input value={endereco.cep} inputMode="numeric" maxLength={9} onChange={e => {
                                    const digitos = e.target.value.replace(/\D/g, "").slice(0, 8);
                                    const formatado = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
                                    setEndereco(p => ({ ...p, cep: formatado }));
                                    if (digitos.length === 8) void consultarCep(digitos);
                                    else { consultaCepAtual.current++; setBuscandoCep(false); }
                                }} placeholder="Ex.: 13183-000" />{buscandoCep ? <small className="tdkCepStatus">Consultando CEP...</small> : <small>Busca automática via ViaCEP</small>}</label>
                                <label className="wide">Rua<input value={endereco.rua} onChange={e => setEndereco(p => ({ ...p, rua: e.target.value }))} placeholder="Rua ou avenida" /></label>
                                <label>Número<input value={endereco.numero} onChange={e => setEndereco(p => ({ ...p, numero: e.target.value }))} placeholder="Número" /></label>
                                <label>Bairro<input value={endereco.bairro} onChange={e => setEndereco(p => ({ ...p, bairro: e.target.value }))} placeholder="Bairro" /></label>
                                <label>Cidade<input value={endereco.municipio} onChange={e => setEndereco(p => ({ ...p, municipio: e.target.value }))} placeholder="Município" /></label>
                                <label>Estado (UF)<input value={endereco.uf} maxLength={2} onChange={e => setEndereco(p => ({ ...p, uf: e.target.value.toUpperCase() }))} placeholder="SP" /></label>

                            </div>
                            <label className="tdkEditPreferencia"><input type="checkbox" checked={tornarEnderecoPrincipal} onChange={e => setTornarEnderecoPrincipal(e.target.checked)} /> Usar como endereço preferido no perfil</label>
                            <div className="tdkEditFormActions"><button className="tdkEditPrimary" type="button" disabled={salvando} onClick={salvarEndereco}>{salvando ? "Salvando..." : enderecoId ? "Salvar alterações" : "Cadastrar endereço"}</button>{enderecoId && <button type="button" className="tdkEditSecondary" onClick={() => { setEnderecoId(null); setEndereco(enderecoVazio); }}>Cancelar edição</button>}</div>
                        </div>
                    </div>}
                    {erro && <p className="tdkEditError" role="alert">{erro}</p>}
                    {mensagem && <p className="tdkEditNotice" role="status">✓ {mensagem}</p>}
                </div>
                <footer className="tdkEditFooter"><span>As alterações são salvas diretamente no TaDaKi.</span><button type="button" onClick={() => { aoSalvar(nome, emailPrincipal, telefonePrincipal); }} disabled={salvando}>Concluir</button></footer>
            </section>
        </div>, document.body
    );
}

export default function PerfilScreen() {

    const navigate = useNavigate();

    const { user } = useAuth();

    const { id_pessoa } = useParams<{ id_pessoa: string }>();
    const [parametrosUrl] = useSearchParams();
    const avaliacaoDestacada = Number(parametrosUrl.get("avaliacao"));

    const idPessoa = Number(id_pessoa);

    const usuarioEhCliente =

        user?.tipo?.trim().toUpperCase() === "CLIENTE";

    const [organizacao, setOrganizacao] =

        useState<IOrganizacao | null>(null);

    const [editandoPerfil, setEditandoPerfil] = useState(false);
    const [contatosPublicos, setContatosPublicos] = useState<ContatoPerfil[]>([]);
    const [enderecosPublicos, setEnderecosPublicos] = useState<EnderecoPerfil[]>([]);
    const [enderecoPreferidoAtualizacao, setEnderecoPreferidoAtualizacao] = useState(0);
    useEffect(() => {
        const atualizar = () => setEnderecoPreferidoAtualizacao(v => v + 1);
        window.addEventListener("tdk-endereco-preferido", atualizar);
        window.addEventListener("storage", atualizar);
        return () => { window.removeEventListener("tdk-endereco-preferido", atualizar); window.removeEventListener("storage", atualizar); };
    }, []);
    const enderecoVisivel = useMemo(() => {
        void enderecoPreferidoAtualizacao;
        return enderecosPublicos.find(e => e.id_endereco === lerEnderecoPreferido(Number(organizacao?.id_pessoa))) ?? enderecosPublicos[0];
    }, [enderecosPublicos, organizacao?.id_pessoa, enderecoPreferidoAtualizacao]);
    const [atualizacaoContato, setAtualizacaoContato] = useState(0);
    useEffect(() => {
        if (!Number.isFinite(idPessoa) || idPessoa <= 0) return;
        let ativo = true;
        Promise.allSettled([
            apiFetch<any>(`/contatos?id_pessoa=${idPessoa}`),
            apiFetch<any>(`/enderecos?id_pessoa=${idPessoa}`)
        ]).then(([contatosResultado, enderecosResultado]) => {
            if (!ativo) return;
            setContatosPublicos(contatosResultado.status === "fulfilled" ? (contatosResultado.value.contatoPessoa ?? []) : []);
            setEnderecosPublicos(enderecosResultado.status === "fulfilled" ? (enderecosResultado.value.enderecoPessoa ?? []) : []);
        });
        return () => { ativo = false; };
    }, [idPessoa, atualizacaoContato]);
    const [avisoPerfil, setAvisoPerfil] = useState("");

    const [categoria, setCategoria] = useState(NA);

    const [posts, setPosts] = useState<IPost[]>([]);
    const [criarPostAberto, setCriarPostAberto] = useState(false);
    const [categoriasCriacao, setCategoriasCriacao] = useState<Category[]>([]);
    const [erroCategoriasCriacao, setErroCategoriasCriacao] = useState("");
    useEffect(() => {
        if (!criarPostAberto) return;
        let cancelado = false;
        (async () => {
            try {
                setErroCategoriasCriacao("");
                const resposta = await apiFetchResponse(`/categorias`, { credentials: "include" });
                if (!resposta.ok) throw new Error("Não foi possível carregar as categorias.");
                const dados = await resposta.json();
                const lista = dados?.categorias ?? dados?.resultadoSelecionaTodos ?? dados?.data ?? dados?.dados ?? dados;
                if (!Array.isArray(lista)) throw new Error("Formato inválido das categorias.");
                if (!cancelado) setCategoriasCriacao(lista);
            } catch (erro) {
                if (!cancelado) {
                    setCategoriasCriacao([]);
                    setErroCategoriasCriacao(erro instanceof Error ? erro.message : "Erro ao carregar categorias.");
                }
            }
        })();
        return () => { cancelado = true; };
    }, [criarPostAberto]);

    const [postsArquivados, setPostsArquivados] =
        useState<IPost[]>([]);

    const [loadingArquivados, setLoadingArquivados] =
        useState(false);

    const [erroArquivados, setErroArquivados] =
        useState("");

    const [menuArquivadoAberto, setMenuArquivadoAberto] = useState<number | null>(null);
    const [desarquivando, setDesarquivando] = useState<number | null>(null);
    const [confirmarDesarquivarId, setConfirmarDesarquivarId] = useState<number | null>(null);
    const [mensagemArquivados, setMensagemArquivados] = useState("");
    const [selecionandoArquivados, setSelecionandoArquivados] = useState(false);
    const [idsArquivadosSelecionados, setIdsArquivadosSelecionados] = useState<number[]>([]);
    const [confirmarDesarquivarLote, setConfirmarDesarquivarLote] = useState(false);
    const [processandoLote, setProcessandoLote] = useState(false);
    const [erroLote, setErroLote] = useState("");

    const organizacaoEhDonaDoPerfil =
        String(user?.tipo ?? "").trim().toUpperCase() === "ORGANIZACAO" &&
        Number(user?.id_pessoa_login) > 0 &&
        Number(user?.id_pessoa_login) === Number(organizacao?.id_pessoa);

    function nomeAutorAvaliacao(avaliacao: IAvaliacao): string {
        if (Number(avaliacao.anonimo) === 1) {
            return "Usuário anônimo";
        }

        // A API precisa retornar o nome de usuário do autor da avaliação.
        // Compatibilidade com possíveis aliases do SELECT/JOIN.
        const dados = avaliacao as IAvaliacao & {
            nome_usuario?: string;
            nomeUsuario?: string;
            usuario?: string;
            username?: string;
            nome_cliente?: string;
        };
        const nome = dados.nome_usuario ?? dados.nomeUsuario ??
            dados.usuario ?? dados.username ?? dados.nome_cliente;
        return typeof nome === "string" && nome.trim() ? nome.trim() : "Usuário";
    }

    const [avaliacoes, setAvaliacoes] = useState<IAvaliacao[]>([]);

    const [clienteLogado, setClienteLogado] =

        useState<ICliente | null>(null);

    const [favoritado, setFavoritado] = useState(false);

    const [carregandoFavorito, setCarregandoFavorito] =

        useState(false);

    const [loading, setLoading] = useState(true);

    const [loadingPosts, setLoadingPosts] = useState(false);

    const [erro, setErro] = useState("");

    const [abaSelecionada, setAbaSelecionada] =

        useState<Aba>(parametrosUrl.get("aba") === "avaliacoes" ? "avaliacoes" : "inicio");

    const [modalAvaliacaoAberto, setModalAvaliacaoAberto] =

        useState(false);

    const [notaSelecionada, setNotaSelecionada] = useState(0);

    const [tituloAvaliacao, setTituloAvaliacao] = useState("");

    const [comentarioAvaliacao, setComentarioAvaliacao] =

        useState("");

    const [avaliacaoAnonima, setAvaliacaoAnonima] =

        useState(false);

    const [enviandoAvaliacao, setEnviandoAvaliacao] =

        useState(false);

    const [erroAvaliacao, setErroAvaliacao] = useState("");

    const [sucessoAvaliacao, setSucessoAvaliacao] =

        useState("");

    const inicioRef = useRef<HTMLDivElement>(null);

    const arquivadosRef = useRef<HTMLDivElement>(null);
    const postsRef = useRef<HTMLDivElement>(null);

    const avaliacoesRef = useRef<HTMLDivElement>(null);

    const indicadoresAvaliacoes = useMemo(() => {
        const notas = avaliacoes
            .map((avaliacao) => Number(avaliacao.csat))
            .filter((nota) => Number.isFinite(nota) && nota >= 1 && nota <= 5);
        const total = notas.length;
        const mediaNumerica = total
            ? notas.reduce((soma, nota) => soma + nota, 0) / total
            : 0;
        const positivas = notas.filter((nota) => nota >= 4).length;
        const melhorar = notas.filter((nota) => nota <= 2).length;
        return {
            total,
            media: mediaNumerica.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            positivas: total ? Math.round((positivas / total) * 100) : 0,
            melhorar,
        };
    }, [avaliacoes]);

    const media = indicadoresAvaliacoes.media;

    const postsDestaques = useMemo(

        () => posts.slice(0, 3),

        [posts]

    );

    function limparDados() {

        setOrganizacao(null);

        setCategoria(NA);

        setPosts([]);

        setAvaliacoes([]);

        setFavoritado(false);

    }

    async function carregarPostsArquivados(
        idOrganizacao: number
    ) {
        setLoadingArquivados(true);
        setErroArquivados("");

        try {

            const resposta = await apiFetchResponse(`/posts/arquivados?id_organizacao=${idOrganizacao}`,
                {
                    credentials: "include"
                }
            );

            if (!resposta.ok) {
                throw new Error(
                    "Não foi possível carregar os posts arquivados."
                );
            }

            const dados = await resposta.json();
            console.log("RESPOSTA COMPLETA DA API:", dados);
            const lista =
                dados?.posts ??
                dados?.data ??
                dados?.dados ??
                dados;

            if (!Array.isArray(lista)) {
                throw new Error("Resposta de posts inválida.");
            }

            // Esta rota já deve retornar somente posts arquivados.
            // Evita ocultar registros caso a API omita o campo status.
            const arquivados = lista.filter(
                (post: IPost) =>
                    Number(post.id_organizacao) === idOrganizacao &&
                    (post.status == null ||
                        String(post.status).trim().toUpperCase() === "ARQUIVADO")
            );

            setPostsArquivados(arquivados);
        } catch (error) {
            console.error(error);
            setPostsArquivados([]);
            setErroArquivados(
                "Não foi possível carregar as publicações arquivadas."
            );
        } finally {
            setLoadingArquivados(false);
        }
    }

    function alternarSelecaoArquivado(idPost: number) {
        setIdsArquivadosSelecionados(anteriores =>
            anteriores.includes(idPost)
                ? anteriores.filter(id => id !== idPost)
                : [...anteriores, idPost]
        );
    }

    function cancelarSelecaoArquivados() {
        if (processandoLote) return;
        setSelecionandoArquivados(false);
        setIdsArquivadosSelecionados([]);
        setErroLote("");
    }

    async function executarDesarquivamentoEmLote() {
        const idOrganizacao = Number(organizacao?.id_organizacao);
        if (!organizacaoEhDonaDoPerfil || processandoLote ||
            !Number.isSafeInteger(idOrganizacao) || idOrganizacao <= 0) return;

        const idsValidos = idsArquivadosSelecionados.filter(id =>
            Number.isSafeInteger(id) && id > 0 &&
            postsArquivados.some(post =>
                Number(post.id_post) === id &&
                Number(post.id_organizacao) === idOrganizacao
            )
        );
        if (!idsValidos.length) return;

        setConfirmarDesarquivarLote(false);
        setProcessandoLote(true);
        setErroLote("");
        setMensagemArquivados("");
        const concluidos: number[] = [];
        const falharam: number[] = [];

        // A API existente recebe um post por requisição.
        for (const idPost of idsValidos) {
            try {
                const resposta = await apiFetchResponse(`/posts/desarquivar?id_post=${idPost}&id_organizacao=${idOrganizacao}`,
                    { method: "PATCH", credentials: "include" }
                );
                if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
                concluidos.push(idPost);
                setPostsArquivados(anteriores =>
                    anteriores.filter(post => Number(post.id_post) !== idPost)
                );
            } catch {
                falharam.push(idPost);
            }
        }

        setIdsArquivadosSelecionados(falharam);
        if (concluidos.length) {
            setMensagemArquivados(
                `${concluidos.length} publicação(ões) desarquivada(s) com sucesso.`
            );
            try { await carregarPosts(idOrganizacao); } catch { /* lista arquivada já atualizada */ }
        }
        if (falharam.length) {
            setErroLote(
                `${falharam.length} publicação(ões) não puderam ser desarquivada(s). ` +
                "Elas continuam selecionadas para você tentar novamente."
            );
        } else {
            setSelecionandoArquivados(false);
        }
        setProcessandoLote(false);
    }

    function desarquivarPost(idPost: number) {
        setConfirmarDesarquivarId(idPost);
    }

    async function executarDesarquivamento(idPost: number) {
        const idOrganizacao = Number(organizacao?.id_organizacao);
        if (
            !organizacaoEhDonaDoPerfil ||
            desarquivando !== null ||
            !Number.isSafeInteger(idPost) || idPost <= 0 ||
            !Number.isSafeInteger(idOrganizacao) || idOrganizacao <= 0 ||
            !postsArquivados.some(post =>
                Number(post.id_post) === idPost &&
                Number(post.id_organizacao) === idOrganizacao
            )
        ) {
            setErroArquivados("Você não pode desarquivar esta publicação.");
            return;
        }

        setConfirmarDesarquivarId(null);

        setDesarquivando(idPost);
        setErroArquivados("");
        setMensagemArquivados("");

        try {
            const resposta = await apiFetchResponse(`/posts/desarquivar?id_post=${idPost}&id_organizacao=${idOrganizacao}`,
                { method: "PATCH", credentials: "include" }
            );
            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) {
                throw new Error(dados?.message || "Não foi possível desarquivar a publicação.");
            }

            setPostsArquivados(anteriores =>
                anteriores.filter(post => Number(post.id_post) !== idPost)
            );
            setMenuArquivadoAberto(null);
            setMensagemArquivados("Publicação desarquivada com sucesso!");
            await carregarPosts(idOrganizacao);
        } catch (error) {
            setErroArquivados(
                error instanceof Error ? error.message : "Erro ao desarquivar a publicação."
            );
        } finally {
            setDesarquivando(null);
        }
    }

    async function buscarPessoaPorId(): Promise<IPessoa | null> {
        if (!Number.isSafeInteger(idPessoa) || idPessoa <= 0) return null;

        // A API pode devolver uma pessoa diretamente, dentro de um objeto,
        // ou em uma lista. Não confundir ausência de resultado com falha HTTP.
        const extrairPessoas = (valor: any, profundidade = 0): IPessoa[] => {
            if (!valor || profundidade > 4) return [];
            if (Array.isArray(valor)) {
                return valor.flatMap(item => extrairPessoas(item, profundidade + 1));
            }
            if (typeof valor !== "object") return [];
            const resultado: IPessoa[] = [];
            if (valor.id_pessoa != null) resultado.push(valor as IPessoa);
            for (const chave of ["pessoa", "pessoaId", "pessoas", "organizacao", "organizacoes", "funcionarios", "dados", "data", "resultado"]) {
                if (valor[chave] != null) resultado.push(...extrairPessoas(valor[chave], profundidade + 1));
            }
            return resultado;
        };

        const caminhos = [
            `/pessoas?id=${idPessoa}`,
            `/pessoas/${idPessoa}`,
            `/pessoas?tipo=ORGANIZACAO`,
            `/pessoas`,
        ];
        let houveResposta = false;
        for (const caminho of caminhos) {
            try {
                const resposta = await apiFetchResponse(`${caminho}`, {
                    method: "GET",
                    credentials: "include",
                });
                if (!resposta.ok) {
                    if (resposta.status === 401 || resposta.status === 403) {
                        throw new Error("Sua sessão expirou ou você não tem permissão para visualizar este perfil.");
                    }
                    continue;
                }
                houveResposta = true;
                const dados = await resposta.json();
                const pessoa = extrairPessoas(dados).find(item =>
                    Number(item.id_pessoa) === idPessoa
                );
                if (pessoa) return pessoa;
            } catch (error) {
                if (error instanceof Error && error.message.includes("sessão expirou")) throw error;
                console.warn(`[Perfil] Falha ao consultar ${caminho}:`, error);
            }
        }
        if (!houveResposta) {
            throw new Error("Não foi possível consultar a API. Verifique sua conexão e tente novamente.");
        }
        return null;
    }

    async function carregarClienteLogado(): Promise<ICliente | null> {
        if (!usuarioEhCliente) {
            setClienteLogado(null);
            return null;
        }
        try {
            const respostaLogin = await apiFetch<any>("/auth/me");
            const dadosLogin = respostaLogin?.user ?? respostaLogin;
            const idPessoa = Number(dadosLogin?.id_pessoa ?? dadosLogin?.id_pessoa_login ?? user?.id_pessoa ?? user?.id_pessoa_login);
            if (!Number.isSafeInteger(idPessoa) || idPessoa <= 0) {
                throw new Error("Não foi possível identificar a pessoa autenticada.");
            }
            // Mesmo vínculo usado em AvaliacoesCliente: id_pessoa não é id_cliente.
            const respostaPessoa = await apiFetch<any>(`/pessoas?id=${idPessoa}`);
            const extrair = (valor: any, nivel = 0): any[] => {
                if (!valor || nivel > 4) return [];
                if (Array.isArray(valor)) return valor.flatMap(item => extrair(item, nivel + 1));
                if (typeof valor !== "object") return [];
                const resultado = valor.id_pessoa != null || valor.id_cliente != null ? [valor] : [];
                for (const chave of ["pessoaId", "pessoas", "pessoa", "dados", "data", "resultado", "cliente", "clientes"]) {
                    if (valor[chave] != null) resultado.push(...extrair(valor[chave], nivel + 1));
                }
                return resultado;
            };
            const pessoas = extrair(respostaPessoa);
            const pessoa = pessoas.find(item => Number(item?.id_pessoa) === idPessoa && Number(item?.id_cliente) > 0)
                ?? pessoas.find(item => String(item?.tipo ?? "").toUpperCase() === "CLIENTE" && Number(item?.id_cliente) > 0);
            const idCliente = Number(pessoa?.id_cliente ?? pessoa?.cliente?.id_cliente);
            if (!Number.isSafeInteger(idCliente) || idCliente <= 0) {
                throw new Error("Não foi possível localizar o cadastro de cliente vinculado à conta.");
            }
            const cliente: ICliente = { id_cliente: idCliente, id_pessoa: idPessoa };
            setClienteLogado(cliente);
            return cliente;
        } catch (error) {
            console.error("Erro ao identificar cliente autenticado:", error);
            setClienteLogado(null);
            return null;
        }
    }

    async function carregarCategoria(idArea: number) {

        try {

            const resposta = await apiFetchResponse(`/AreaAtuacao?id_area_atuacao=${idArea}`,

                { credentials: "include" }

            );

            if (!resposta.ok) {

                throw new Error("Erro ao buscar área de atuação.");

            }

            const data = await resposta.json();

            const lista =

                data?.resultadoSelecionaId ??

                data?.resultadoSelecionaTodos ??

                data?.dados ??

                data?.data ??

                [];

            setCategoria((Array.isArray(lista) ? lista[0]?.descricao : lista?.descricao) || NA);

        } catch (error) {

            console.error("Erro ao carregar categoria:", error);

            setCategoria(NA);

        }

    }

    async function carregarAvaliacoes(idOrganizacao: number) {

        try {

            if (!Number.isFinite(idOrganizacao) || idOrganizacao <= 0) {

                setAvaliacoes([]);

                return;

            }

            const resultado =

                await buscarAvaliacoesPorOrganizacao(idOrganizacao);

            setAvaliacoes(resultado);

        } catch (error) {

            console.error("Erro ao carregar avaliações:", error);

            setAvaliacoes([]);

        }

    }

    async function carregarPosts(idOrganizacao: number) {

        setLoadingPosts(true);

        try {

            if (!Number.isFinite(idOrganizacao) || idOrganizacao <= 0) {

                setPosts([]);

                return;

            }

            const resposta = await apiFetchResponse(`/posts/organizacao?id_organizacao=${idOrganizacao}`,

                { credentials: "include" }

            );

            if (!resposta.ok) {

                throw new Error("Não foi possível carregar os posts.");

            }

            const data = await resposta.json();

            const lista =

                data?.posts ??

                data?.data ??

                data?.dados ??

                data;

            console.log("Posts recebidos da API:", lista);

            if (!Array.isArray(lista)) {

                setPosts([]);

                return;

            }

            const postsDaOrganizacao = lista.filter(

                (post: IPost) =>

                    Number(post.id_organizacao) === idOrganizacao

            );

            setPosts(postsDaOrganizacao);

        } catch (error) {

            console.error("Erro ao carregar posts:", error);

            setPosts([]);

        } finally {

            setLoadingPosts(false);

        }

    }

    async function carregarOrganizacao(pessoa: IPessoa) {

        let encontrada = pessoa as IOrganizacao;

        if (!encontrada.id_organizacao || !encontrada.id_area_atuacao) {

            try {

                const resposta = await apiFetchResponse(`/pessoas?tipo=ORGANIZACAO`,

                    { credentials: "include" }

                );

                if (!resposta.ok) {

                    throw new Error("Erro ao buscar organizações.");

                }

                const data = await resposta.json();

                const listas = [data?.funcionarios, data?.pessoas, data?.organizacoes,
                data?.dados, data?.data, data?.pessoaId, data];
                const lista = listas.flatMap((valor: any) =>
                    Array.isArray(valor) ? valor : valor && typeof valor === "object" ? [valor] : []
                );

                const resultado = lista.find(

                    (item: IOrganizacao) =>

                        Number(item.id_pessoa) ===

                        Number(pessoa.id_pessoa)

                );

                if (!resultado) {

                    throw new Error(

                        "Não foi possível encontrar a organização na lista."

                    );

                }

                if (

                    !Number.isSafeInteger(Number(resultado.id_organizacao)) ||

                    Number(resultado.id_organizacao) <= 0

                ) {

                    throw new Error(

                        "A organização encontrada não possui id_organizacao válido."

                    );

                }

                encontrada = resultado;

            } catch (error) {

                console.error("Erro ao identificar organização:", error);

                setErro(

                    "Não foi possível identificar a organização."

                );

                return;

            }

        }

        const idOrganizacao = Number(encontrada.id_organizacao);

        if (!Number.isFinite(idOrganizacao) || idOrganizacao <= 0) {

            setErro("A organização não possui um ID válido.");

            return;

        }

        setOrganizacao(encontrada);

        if (encontrada.id_area_atuacao) {

            await carregarCategoria(encontrada.id_area_atuacao);

        } else {

            setCategoria(NA);

        }

        await Promise.all([

            carregarAvaliacoes(idOrganizacao),

            carregarPosts(idOrganizacao),

        ]);

    }

    async function carregarDados() {

        setLoading(true);

        setErro("");

        try {

            const pessoa = await buscarPessoaPorId();

            if (!pessoa) {

                limparDados();

                setErro("Organização não encontrada.");

                return;

            }

            if (

                pessoa.tipo?.trim().toUpperCase() !== "ORGANIZACAO"

            ) {

                limparDados();

                setErro("Esta pessoa não é uma organização.");

                return;

            }

            await carregarOrganizacao(pessoa);

        } catch (error) {

            console.error("Erro ao carregar perfil:", error);

            limparDados();

            setErro(error instanceof Error ? error.message :
                "Não foi possível carregar o perfil da organização.");

        } finally {

            setLoading(false);

        }

    }

    const obterFavoritosCliente = async (idCliente: number): Promise<Array<{ id_favorito: number; id_organizacao: number }>> => {
        const resposta = await apiFetch<any>(`/Favoritos?id_cliente=${idCliente}`, { method: "GET" });
        return Array.isArray(resposta?.favoritos) ? resposta.favoritos : [];
    };

    async function carregarStatusFavorito() {
        const idOrganizacao = Number(organizacao?.id_pessoa);
        const idCliente = Number(clienteLogado?.id_cliente);
        if (!usuarioEhCliente || !Number.isSafeInteger(idOrganizacao) || idOrganizacao <= 0 ||
            !Number.isSafeInteger(idCliente) || idCliente <= 0) {
            setFavoritado(false);
            return;
        }
        try {
            const lista = await obterFavoritosCliente(idCliente);
            setFavoritado(lista.some((item) => Number(item.id_organizacao) === idOrganizacao));
        } catch (error) {
            console.error("Erro ao verificar favorito:", error);
            setAvisoPerfil(error instanceof Error ? error.message : "Não foi possível carregar os favoritos.");
        }
    }

    async function alternarFavorito() {
        const idOrganizacao = Number(organizacao?.id_pessoa);
        const cliente = clienteLogado ?? await carregarClienteLogado();
        const idCliente = Number(cliente?.id_cliente);
        if (carregandoFavorito) return;
        if (!usuarioEhCliente || !Number.isSafeInteger(idOrganizacao) || idOrganizacao <= 0 ||
            !Number.isSafeInteger(idCliente) || idCliente <= 0) {
            setAvisoPerfil("Não foi possível identificar sua conta de cliente. Entre novamente e tente de novo.");
            return;
        }
        setCarregandoFavorito(true);
        try {
            const lista = await obterFavoritosCliente(idCliente);
            const existente = lista.find((item) => Number(item.id_organizacao) === idOrganizacao);
            if (existente) {
                await apiFetch(`/Favoritos/${existente.id_favorito}`, { method: "DELETE" });
                setFavoritado(false);
            } else {
                await apiFetch(`/Favoritos`, {
                    method: "POST",
                    body: JSON.stringify({ id_cliente: idCliente, id_organizacao: idOrganizacao }),
                });
                setFavoritado(true);
            }
            setAvisoPerfil("");
        } catch (error) {
            console.error("Erro ao atualizar favorito:", error);
            setAvisoPerfil(error instanceof Error ? error.message : "Não foi possível atualizar os favoritos.");
        } finally {
            setCarregandoFavorito(false);
        }
    }

    function abrirModalAvaliacao() {

        if (!usuarioEhCliente) return;

        setNotaSelecionada(0);

        setTituloAvaliacao("");

        setComentarioAvaliacao("");

        setAvaliacaoAnonima(false);

        setErroAvaliacao("");

        setSucessoAvaliacao("");

        setModalAvaliacaoAberto(true);

    }

    function fecharModalAvaliacao() {

        if (enviandoAvaliacao) return;

        setModalAvaliacaoAberto(false);

        setErroAvaliacao("");

        setSucessoAvaliacao("");

    }

    async function enviarAvaliacao(

        evento: React.FormEvent<HTMLFormElement>

    ) {

        evento.preventDefault();

        if (enviandoAvaliacao) return;

        setErroAvaliacao("");

        setSucessoAvaliacao("");

        if (!usuarioEhCliente) {

            setErroAvaliacao(

                "Somente clientes podem criar avaliações."

            );

            return;

        }

        if (notaSelecionada < 1 || notaSelecionada > 5) {

            setErroAvaliacao("Selecione uma nota de 1 a 5.");

            return;

        }

        const titulo = tituloAvaliacao.trim();

        const comentario = comentarioAvaliacao.trim();

        if (titulo.length < 5 || titulo.length > 25) {

            setErroAvaliacao(

                "O título deve ter entre 5 e 25 caracteres."

            );

            return;

        }

        if (comentario.length < 10 || comentario.length > 45) {

            setErroAvaliacao(

                "O comentário deve ter entre 10 e 45 caracteres."

            );

            return;

        }

        const idOrganizacao = Number(organizacao?.id_organizacao);

        if (

            !Number.isSafeInteger(idOrganizacao) ||

            idOrganizacao <= 0

        ) {

            setErroAvaliacao(

                "Não foi possível identificar a organização."

            );

            return;

        }

        setEnviandoAvaliacao(true);

        try {

            // Garante que o cliente esteja carregado antes de publicar.

            const cliente =

                clienteLogado ?? await carregarClienteLogado();

            const idCliente = Number(cliente?.id_cliente);

            if (

                !Number.isSafeInteger(idCliente) ||

                idCliente <= 0

            ) {

                throw new Error(

                    "Não foi possível identificar o cliente logado. Entre novamente na sua conta."

                );

            }

            await criarAvaliacaoApi({

                comentario,

                titulo,

                anonimo: avaliacaoAnonima ? 1 : 0,

                csat: notaSelecionada,

                id_cliente: idCliente,

                id_organizacao: idOrganizacao,

            });

            setSucessoAvaliacao(

                "Avaliação criada com sucesso!"

            );

            // Atualiza a lista após a confirmação da API.

            await carregarAvaliacoes(idOrganizacao);

            window.setTimeout(() => {

                setModalAvaliacaoAberto(false);

                setNotaSelecionada(0);

                setTituloAvaliacao("");

                setComentarioAvaliacao("");

                setAvaliacaoAnonima(false);

                setErroAvaliacao("");

                setSucessoAvaliacao("");

            }, 900);

        } catch (error) {

            console.error("Erro ao publicar avaliação:", error);

            setErroAvaliacao(

                error instanceof Error

                    ? error.message

                    : "Não foi possível criar a avaliação."

            );

        } finally {

            setEnviandoAvaliacao(false);

        }

    }

    useEffect(() => {
        if (abaSelecionada === "arquivados" && organizacao && !organizacaoEhDonaDoPerfil) {
            setAbaSelecionada("inicio");
        }
    }, [abaSelecionada, organizacao, organizacaoEhDonaDoPerfil]);

    useEffect(() => {
        if (abaSelecionada !== "arquivados" || !organizacaoEhDonaDoPerfil) return;

        const idOrganizacao = Number(
            organizacao?.id_organizacao
        );

        if (!Number.isSafeInteger(idOrganizacao) ||
            idOrganizacao <= 0) {
            return;
        }

        void carregarPostsArquivados(idOrganizacao);
    }, [abaSelecionada, organizacao?.id_organizacao, organizacaoEhDonaDoPerfil]);

    useEffect(() => {

        if (!usuarioEhCliente || !clienteLogado?.id_cliente) {

            setFavoritado(false);

            return;

        }

        if (organizacao?.id_pessoa) {

            carregarStatusFavorito();

        }

    }, [

        usuarioEhCliente,

        organizacao?.id_pessoa,

        clienteLogado?.id_cliente,

    ]);

    useEffect(() => {
        if (parametrosUrl.get("aba") === "avaliacoes") setAbaSelecionada("avaliacoes");
        if (parametrosUrl.get("aba") === "posts") setAbaSelecionada("posts");
    }, [parametrosUrl]);

    useEffect(() => {
        if (abaSelecionada !== "avaliacoes" || !Number.isSafeInteger(avaliacaoDestacada) || avaliacaoDestacada <= 0) return;
        if (!avaliacoes.some(a => Number(a.id_avaliacao) === avaliacaoDestacada)) return;
        const elemento = document.getElementById(`perfil-avaliacao-${avaliacaoDestacada}`);
        elemento?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [abaSelecionada, avaliacoes, avaliacaoDestacada]);

    // A troca de abas altera apenas o conteúdo, sem rolar a página automaticamente.

    useEffect(() => {

        function pressionouEsc(evento: KeyboardEvent) {

            if (

                evento.key === "Escape" &&

                modalAvaliacaoAberto &&

                !enviandoAvaliacao

            ) {

                fecharModalAvaliacao();

            }

        }

        document.addEventListener("keydown", pressionouEsc);

        return () => {

            document.removeEventListener("keydown", pressionouEsc);

        };

    }, [modalAvaliacaoAberto, enviandoAvaliacao]);

    useEffect(() => {

        if (

            !id_pessoa ||

            !Number.isSafeInteger(idPessoa) ||

            idPessoa <= 0

        ) {

            limparDados();

            setErro("ID da organização inválido.");

            setLoading(false);

            return;

        }

        void carregarDados();

    }, [id_pessoa]);

    useEffect(() => {

        void carregarClienteLogado();

    }, [

        user?.tipo,

        user?.id_pessoa_login,

    ]);

    function BotaoAba({ aba, icon }: { aba: Aba; icon: string }) {

        return (

            <button

                type="button"

                className={`iconeMenu ${abaSelecionada === aba

                    ? "iconeMenuSelecionado"

                    : ""

                    }`}

                onClick={() => setAbaSelecionada(aba)}

                aria-label={aba}

            >

                <span>{icon}</span>

            </button>

        );

    }

    function BotaoCriarAvaliacao() {

        if (!usuarioEhCliente) return null;

        return (

            <button

                type="button"

                className="botaoCriarAvaliacao"

                onClick={abrirModalAvaliacao}

            >

                <span className="iconeBotaoAvaliacao">＋</span>

                <span>Criar avaliação</span>

            </button>

        );

    }

    function BotaoFavoritar() {
        if (!usuarioEhCliente) return null;

        return (
            <button
                type="button"
                className={`botaoFavoritar ${favoritado ? "botaoFavoritado" : ""
                    }`}
                onClick={() => void alternarFavorito()}
                disabled={carregandoFavorito}
                aria-pressed={favoritado}
                aria-label={
                    favoritado
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                }
            >
                <Heart
                    size={21}
                    strokeWidth={2.2}
                    color="#8E0808"
                    fill={favoritado ? "#8E0808" : "none"}
                />

                <span>
                    {carregandoFavorito
                        ? "Aguarde..."
                        : favoritado
                            ? "Favoritado"
                            : "Favoritar"}
                </span>
            </button>
        );
    }

    function AbaInicio() {

        return (

            <div>

                <div className="estatisticas">

                    <Estatistica

                        numero={String(posts.length)}

                        texto="Publicações"

                    />

                    <div className="divisor" />

                    <Estatistica

                        numero={String(avaliacoes.length)}

                        texto="Avaliações recebidas"

                    />

                    <div className="divisor" />

                    <Estatistica

                        numero={String(media)}

                        texto="Nota média"

                    />

                </div>

                <section className="tdkDestaquesPainel">
                    <div className="tituloLinha">

                        <div className="tdkSecaoTexto"><h2 className="titulo">{organizacaoEhDonaDoPerfil ? "Suas publicações em destaque" : "Conheça nossas publicações"}</h2><p className="tdkSecaoDescricao">{organizacaoEhDonaDoPerfil ? "Veja como seus posts aparecem para quem visita sua página." : "Descubra novidades, produtos e conteúdos desta organização."}</p></div>
                        <button type="button" className="perfilVerMais" onClick={() => setAbaSelecionada("posts")}>Ver todos os posts <span aria-hidden="true">→</span></button>

                    </div>

                    {loadingPosts ? (

                        <Loading texto="Carregando posts..." />

                    ) : postsDestaques.length === 0 ? (

                        <SemPosts />

                    ) : (

                        <div className="destaques">

                            {postsDestaques.map((post, index) => (

                                <PostCard

                                    key={post.id_post ?? index}

                                    post={post}

                                    onAbrirPosts={() => {
                                        const id = Number(post.id_post);
                                        if (Number.isSafeInteger(id) && id > 0) {
                                            navigate(`?aba=posts&post=${id}`);
                                        } else {
                                            navigate("?aba=posts");
                                        }
                                        setAbaSelecionada("posts");
                                    }}

                                />

                            ))}

                        </div>

                    )}

                </section>

                <section className="tdkReviewsPreview" aria-labelledby="tdkReviewsPreviewTitulo">
                    <div className="tdkReviewsPreviewCabecalho">
                        <div className="tdkReviewsPreviewTituloGrupo">
                            <h2 id="tdkReviewsPreviewTitulo">{organizacaoEhDonaDoPerfil ? "O que estão dizendo sobre você" : "Avaliações de quem já conhece"}</h2>
                            <p>{organizacaoEhDonaDoPerfil ? "Acompanhe as experiências e opiniões de seus clientes." : "Veja o que outras pessoas acharam desta organização."}</p>
                        </div>
                        <div className="tdkReviewsPreviewAcoes"><BotaoCriarAvaliacao /><button type="button" className="perfilVerMais" onClick={() => setAbaSelecionada("avaliacoes")}>Ver todas as avaliações <span aria-hidden="true">→</span></button></div>
                    </div>

                    {avaliacoes.length === 0 ? (
                        <div className="tdkReviewsPreviewVazio">
                            <Star size={26} />
                            <strong>Esta organização ainda não recebeu avaliações.</strong>
                            <span>Compartilhe sua experiência e ajude outras pessoas.</span>
                        </div>
                    ) : (
                        <>
                            <div className="tdkReviewsPreviewGrade">
                                {avaliacoes.slice(0, 3).map((avaliacao, index) => {
                                    const nota = Math.max(0, Math.min(5, Number(avaliacao.csat) || 0));
                                    const idAvaliacao = Number(avaliacao.id_avaliacao);
                                    return (
                                        <button type="button" key={avaliacao.id_avaliacao ?? index}
                                            className="tdkReviewsPreviewCard"
                                            onClick={() => {
                                                if (Number.isSafeInteger(idAvaliacao) && idAvaliacao > 0) {
                                                    navigate(`?aba=avaliacoes&avaliacao=${idAvaliacao}`);
                                                }
                                                setAbaSelecionada("avaliacoes");
                                            }}
                                            aria-label={`Ler avaliação: ${avaliacao.titulo || "Sem título"}`}>
                                            <div className="tdkReviewsPreviewCardTopo">
                                                <span className="tdkReviewsPreviewAspas" aria-hidden="true">“</span>
                                                <div className="tdkReviewsPreviewEstrelas" aria-label={`${nota} de 5 estrelas`}>
                                                    {[1, 2, 3, 4, 5].map(estrela => (
                                                        <Star key={estrela} size={16} fill={estrela <= nota ? "currentColor" : "none"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <h3>{avaliacao.titulo || "Avaliação sem título"}</h3>
                                            <p className="tdkReviewsPreviewComentario">
                                                {avaliacao.comentario?.trim() || "Cliente compartilhou sua nota para esta organização."}
                                            </p>
                                            <div className="tdkReviewsPreviewRodape">
                                                <span className="tdkReviewsPreviewAvatar"><User size={17} /></span>
                                                <span className="tdkReviewsPreviewAutor">{nomeAutorAvaliacao(avaliacao)}</span>
                                                <span className="tdkReviewsPreviewAbrir" aria-hidden="true">↗</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

            </div>

        );

    }

    if (loading) {

        return (

            <div className="container">

                <div className="scrollContent">

                    <div className="perfilLoadingTela" role="status" aria-live="polite">
                        <div className="perfilLoadingSpinner" aria-hidden="true" />
                        <h2>Carregando perfil...</h2>
                        <p>Estamos preparando as informações.</p>
                    </div>

                </div>

            </div>

        );

    }

    if (erro || !organizacao) {
        return (
            <main className="perfilErroPagina">
                <section className="perfilErroCard" role="alert">
                    <div className="perfilErroIcone"><Store size={32} strokeWidth={1.8} /></div>
                    <span className="perfilErroEtiqueta">PERFIL INDISPONÍVEL</span>
                    <h1>Não conseguimos abrir este perfil</h1>
                    <p>"Não foi possível carregar este perfil. Tente novamente em instantes."</p>
                    <div className="perfilErroAcoes">
                        <button type="button" className="perfilErroPrimario" onClick={() => void carregarDados()}>
                            <RefreshCw size={17} /> Tentar novamente
                        </button>
                        <button type="button" className="perfilErroSecundario" onClick={() => navigate("/")}>
                            <ArrowLeft size={17} /> Voltar para Home
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return (

        <div className="container tdkPerfilRedesign">

            <div className="scrollContent">

                <header className="topo">

                    <button

                        type="button"

                        className="botaoVoltar"

                        onClick={() => navigate("/")}

                        aria-label="Voltar para a Home"

                    >

                        ←

                    </button>

                    <div className="perfil">

                        <div className="informacoes">
                            <div className="tdkIdentidadePerfil">
                                <div className="avatar" aria-hidden="true" />
                                <div className="tdkIdentidadeTexto">
                                    <div className="linhaNomeFavorito">
                                        <h1 className="nomeLoja">{organizacao.nome || "Organização"}</h1>
                                        <BotaoFavoritar />
                                    </div>
                                    <span className="categoria">{categoria}</span>
                                </div>
                            </div>
                            <div className="tdkPerfilDadosPublicos" aria-label="Informações de contato da organização">
                                {(contatosPublicos.find(c => c.email && c.principal)?.email ?? contatosPublicos.find(c => c.email)?.email ?? organizacao.email) && (
                                    <a className="tdkPerfilDado" href={`mailto:${contatosPublicos.find(c => c.email && c.principal)?.email ?? contatosPublicos.find(c => c.email)?.email ?? organizacao.email}`}>
                                        <span className="tdkPerfilDadoIcone">✉</span><span><small>E-mail</small><strong>{contatosPublicos.find(c => c.email && c.principal)?.email ?? contatosPublicos.find(c => c.email)?.email ?? organizacao.email}</strong></span>
                                    </a>
                                )}
                                {(contatosPublicos.find(c => c.telefone && c.principal)?.telefone ?? contatosPublicos.find(c => c.telefone)?.telefone ?? organizacao.telefone) && (
                                    <a className="tdkPerfilDado" href={`tel:${(contatosPublicos.find(c => c.telefone && c.principal)?.telefone ?? contatosPublicos.find(c => c.telefone)?.telefone ?? organizacao.telefone ?? "").replace(/[^\d+]/g, "")}`}>
                                        <span className="tdkPerfilDadoIcone">☎</span><span><small>Telefone</small><strong>{contatosPublicos.find(c => c.telefone && c.principal)?.telefone ?? contatosPublicos.find(c => c.telefone)?.telefone ?? organizacao.telefone}</strong></span>
                                    </a>
                                )}
                                {enderecoVisivel && <div className="tdkEnderecoCard">
                                    <div className="tdkEnderecoIcone"><Store size={22} /></div>
                                    <div className="tdkEnderecoConteudo">
                                        <span className="tdkEnderecoRotulo">LOCALIZAÇÃO DA ORGANIZAÇÃO</span>
                                        <strong className="tdkEnderecoRua">{enderecoVisivel.rua}, {enderecoVisivel.numero}</strong>
                                        <span className="tdkEnderecoBairro">{enderecoVisivel.bairro} · {enderecoVisivel.municipio}/{enderecoVisivel.uf}</span>
                                        <span className="tdkEnderecoCep">CEP {String(enderecoVisivel.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2")}</span>
                                    </div>
                                    <a className="tdkEnderecoMapa" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${enderecoVisivel.rua}, ${enderecoVisivel.numero}, ${enderecoVisivel.bairro}, ${enderecoVisivel.municipio}, ${enderecoVisivel.uf}`)}`} target="_blank" rel="noopener noreferrer">Ver no mapa ↗</a>
                                </div>}
                            </div>
                            {organizacaoEhDonaDoPerfil && (
                                <div className="tdkEditProfileEntry">
                                    <button type="button" className="tdkEditProfileOpen" onClick={() => { setAvisoPerfil(""); setEditandoPerfil(true); }}>
                                        <span>✎</span> Editar perfil
                                    </button>
                                    <span>Gerencie suas informações e formas de contato</span>
                                </div>
                            )}
                            {avisoPerfil && <p className="tdkEditProfileSuccess" role="status">{avisoPerfil}</p>}
                            {organizacaoEhDonaDoPerfil && editandoPerfil && (
                                <EditarPerfilModal
                                    organizacao={organizacao}
                                    aoFechar={() => setEditandoPerfil(false)}
                                    aoSalvar={(nome, email, telefone) => {
                                        setOrganizacao(atual => atual ? { ...atual, nome, email, telefone } : atual);
                                        setEditandoPerfil(false);
                                        setAtualizacaoContato(n => n + 1);
                                        setAvisoPerfil("Perfil atualizado com sucesso!");
                                    }}
                                />
                            )}
                        </div>

                    </div>

                </header>

                <main className="areaMenu">

                    <nav
                        className="menuNavegacao tdkNavegacaoAnimada"
                        data-aba-ativa={abaSelecionada}
                        data-total-abas={organizacaoEhDonaDoPerfil ? "4" : "3"}
                    >

                        <BotaoAba aba="inicio" icon="⌂" />

                        {organizacaoEhDonaDoPerfil && <BotaoAba aba="arquivados" icon="▤" />}

                        <BotaoAba aba="posts" icon="▣" />

                        <BotaoAba aba="avaliacoes" icon="☆" />

                    </nav>

                    <div className="linha" />

                    <div className="tdkAbaTransicao" key={abaSelecionada}>

                        {abaSelecionada === "inicio" && (

                            <div ref={inicioRef} className="abaRef">

                                <AbaInicio />

                            </div>

                        )}

                        {organizacaoEhDonaDoPerfil && abaSelecionada === "arquivados" && (
                            <section
                                ref={arquivadosRef}
                                className="abaConteudo abaRef tdkArquivadosPainel"
                            >
                                <h2 className="tituloAba">
                                    Publicações arquivadas
                                </h2>

                                <p className="subtituloAba">
                                    Publicações retiradas do perfil público. Você pode restaurá-las quando quiser.
                                </p>

                                {!loadingArquivados && !erroArquivados && postsArquivados.length > 0 && (
                                    <div className="perfilLoteBarra">
                                        {selecionandoArquivados ? (
                                            <>
                                                <span className="perfilLoteContagem">
                                                    {idsArquivadosSelecionados.length} de {postsArquivados.length} selecionadas
                                                </span>
                                                <button type="button" className="perfilLoteBotaoNeutro"
                                                    disabled={processandoLote}
                                                    onClick={() => setIdsArquivadosSelecionados(
                                                        idsArquivadosSelecionados.length === postsArquivados.length
                                                            ? []
                                                            : postsArquivados.map(p => Number(p.id_post)).filter(id => Number.isSafeInteger(id) && id > 0)
                                                    )}>
                                                    {idsArquivadosSelecionados.length === postsArquivados.length
                                                        ? "Desmarcar todas" : "Selecionar todas"}
                                                </button>
                                                <button type="button" className="perfilLoteBotaoPrincipal"
                                                    disabled={processandoLote || idsArquivadosSelecionados.length === 0}
                                                    onClick={() => setConfirmarDesarquivarLote(true)}>
                                                    <Archive size={16} />
                                                    {processandoLote ? "Processando..." : `Desarquivar (${idsArquivadosSelecionados.length})`}
                                                </button>
                                                <button type="button" className="perfilLoteBotaoNeutro"
                                                    disabled={processandoLote} onClick={cancelarSelecaoArquivados}>
                                                    Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <button type="button" className="perfilLoteBotaoNeutro"
                                                onClick={() => { setSelecionandoArquivados(true); setErroLote(""); }}>
                                                Selecionar publicações
                                            </button>
                                        )}
                                    </div>
                                )}
                                {erroLote && <p className="perfilLoteErro" role="alert">{erroLote}</p>}
                                {mensagemArquivados && !erroArquivados && (
                                    <div role="status" className="perfilAvisoSucesso">✓ {mensagemArquivados}</div>
                                )}
                                {loadingArquivados ? (
                                    <Loading texto="Carregando arquivados..." />
                                ) : erroArquivados ? (
                                    <div className="perfilEstadoVazio" role="alert">
                                        <Archive size={34} />
                                        <h3>Não foi possível consultar os arquivados</h3>
                                        <p>{erroArquivados}</p>
                                        <button type="button" className="perfilBotaoTentar" onClick={() => void carregarPostsArquivados(Number(organizacao.id_organizacao))}>
                                            <RefreshCw size={16} /> Tentar novamente
                                        </button>
                                    </div>
                                ) : postsArquivados.length === 0 ? (
                                    <div className="perfilEstadoVazio">
                                        <Inbox size={36} />
                                        <h3>Nenhuma publicação arquivada</h3>
                                        <p>As publicações arquivadas aparecerão aqui quando houver alguma.</p>
                                    </div>
                                ) : (
                                    <div className="abaPosts">
                                        {postsArquivados.map((post, index) => (
                                            <article
                                                key={post.id_post ?? index}
                                                className="cardPost"
                                                style={{ position: "relative" }}
                                            >
                                                {selecionandoArquivados && post.id_post != null && (
                                                    <label className="perfilLoteSelecao" title="Selecionar publicação">
                                                        <input type="checkbox"
                                                            checked={idsArquivadosSelecionados.includes(Number(post.id_post))}
                                                            disabled={processandoLote}
                                                            onChange={() => alternarSelecaoArquivado(Number(post.id_post))}
                                                            aria-label={`Selecionar ${post.titulo || "publicação"}`}
                                                        />
                                                    </label>
                                                )}
                                                {!selecionandoArquivados && organizacaoEhDonaDoPerfil && post.id_post != null && (
                                                    <div style={{ position: "absolute", right: 12, top: 12, zIndex: 5 }}>
                                                        <button
                                                            type="button"
                                                            aria-label="Opções da publicação arquivada"
                                                            aria-expanded={menuArquivadoAberto === Number(post.id_post)}
                                                            onClick={() => setMenuArquivadoAberto(atual =>
                                                                atual === Number(post.id_post) ? null : Number(post.id_post)
                                                            )}
                                                            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer" }}
                                                        >
                                                            <MoreVertical size={20} />
                                                        </button>
                                                        {menuArquivadoAberto === Number(post.id_post) && (
                                                            <div style={{ position: "absolute", top: "100%", right: 0, minWidth: 215, padding: 8, background: "white", border: "1px solid #ddd", borderRadius: 8, boxShadow: "0 4px 12px #0002", zIndex: 6 }}>
                                                                <button
                                                                    type="button"
                                                                    disabled={desarquivando !== null}
                                                                    onClick={() => void desarquivarPost(Number(post.id_post))}
                                                                    style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, width: "100%", border: 0, background: "white", cursor: desarquivando !== null ? "wait" : "pointer", textAlign: "left" }}
                                                                >
                                                                    <Archive size={18} />
                                                                    {desarquivando === Number(post.id_post) ? "Desarquivando..." : "Desarquivar publicação"}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {post.vincularImagem && (
                                                    <img
                                                        className="imagemPost"
                                                        src={obterUrlImagem(post.vincularImagem)}
                                                        alt={post.titulo || "Publicação arquivada"}
                                                    />
                                                )}

                                                <div className="conteudoPost">
                                                    <h3 className="tituloPost">
                                                        {post.titulo || "Sem título"}
                                                    </h3>

                                                    <p className="descricaoPost">
                                                        {post.descricao || "Sem descrição"}
                                                    </p>

                                                    <span className="etiquetaArquivado">
                                                        Arquivado
                                                    </span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {abaSelecionada === "posts" && (
                            <section ref={postsRef} className="abaRef tdkPublicacoesPainel">
                                <div className="perfilCriarPostCabecalho">
                                    <h2 className="tituloAba">Publicações da organização</h2>
                                    {organizacaoEhDonaDoPerfil && (
                                        <button type="button" className="perfilCriarPostBotao" onClick={() => setCriarPostAberto(true)}>
                                            <Plus size={19} strokeWidth={2.4} /> Criar publicação
                                        </button>
                                    )}
                                </div>
                                {organizacao.id_organizacao ? (
                                    <FeedPostsPerfil
                                        incorporado
                                        postsIniciais={posts}
                                        carregandoPostsIniciais={loadingPosts}
                                        idOrganizacaoPerfil={Number(organizacao.id_organizacao)}
                                        organizacaoDoPerfilIdPessoa={Number(organizacao.id_pessoa)}
                                        nomeOrganizacaoPerfil={organizacao.nome || ""}
                                        onPostArquivado={(idPost) =>
                                            setPosts((anteriores) =>
                                                anteriores.filter((post) => Number(post.id_post) !== idPost)
                                            )
                                        }
                                    />
                                ) : (
                                    <SemPosts grande />
                                )}
                            </section>
                        )}

                        {abaSelecionada === "avaliacoes" && (

                            <div

                                ref={avaliacoesRef}

                                className="abaAvaliacoes abaRef"

                            >

                                <div className="cabecalhoAvaliacoes">

                                    <div>

                                        <h2 className="tituloAba">

                                            Avaliações

                                        </h2>

                                        <p className="subtituloAba">

                                            O que os clientes estão dizendo

                                        </p>

                                    </div>

                                    <div className="mediaAvaliacao">

                                        <strong>{media}</strong>

                                    </div>

                                </div>

                                {organizacaoEhDonaDoPerfil && (
                                    <div className="tdkIndicadoresAvaliacoes" aria-label="Indicadores das avaliações da sua organização">
                                        <div><span>Total de avaliações</span><strong>{indicadoresAvaliacoes.total}</strong><small>Opiniões recebidas</small></div>
                                        <div><span>Nota média</span><strong>{indicadoresAvaliacoes.media} <Star size={18} fill="currentColor" /></strong><small>De 5 estrelas</small></div>
                                        <div><span>Avaliações positivas</span><strong>{indicadoresAvaliacoes.positivas}%</strong><small>Notas de 4 e 5 estrelas</small></div>
                                        <div><span>Avaliações a melhorar</span><strong>{indicadoresAvaliacoes.melhorar}</strong><small>Notas de 1 e 2 estrelas</small></div>
                                    </div>
                                )}
                                <div className="botaoAvaliacaoTopo">

                                    <BotaoCriarAvaliacao />

                                </div>

                                {avaliacoes.length === 0 ? (

                                    <div className="semAvaliacoesContainer">

                                        <span className="semAvaliacoes">

                                            Nenhuma avaliação encontrada.

                                        </span>

                                    </div>

                                ) : (

                                    <div className="perfilAvaliacoesLista">
                                        {avaliacoes.map((avaliacao, index) => (
                                            <article key={avaliacao.id_avaliacao ?? index}
                                                id={`perfil-avaliacao-${avaliacao.id_avaliacao}`}
                                                className="perfilAvaliacaoNova"
                                                style={Number(avaliacao.id_avaliacao) === avaliacaoDestacada
                                                    ? { outline: "3px solid #B01013", outlineOffset: 3, borderRadius: 12 }
                                                    : undefined}>
                                                <div className="perfilAvaliacaoTopo">
                                                    <div className="perfilAvaliacaoAvatar"><User size={20} /></div>
                                                    <div className="perfilAvaliacaoAutor">
                                                        <strong>{nomeAutorAvaliacao(avaliacao)}</strong>
                                                        <span>Avaliação de cliente</span>
                                                    </div>
                                                    <div className="perfilAvaliacaoEstrelas" aria-label={`Nota ${avaliacao.csat} de 5`}>
                                                        {[1, 2, 3, 4, 5].map(estrela => (
                                                            <Star key={estrela} size={15} fill={estrela <= Number(avaliacao.csat) ? "currentColor" : "none"} />
                                                        ))}
                                                        <strong>{avaliacao.csat}/5</strong>
                                                    </div>
                                                </div>
                                                <h3>{avaliacao.titulo || "Avaliação"}</h3>
                                                {avaliacao.comentario && <p className="perfilAvaliacaoComentario">{avaliacao.comentario}</p>}
                                            </article>
                                        ))}
                                    </div>

                                )}

                            </div>

                        )}

                    </div>

                </main>

            </div>

            {organizacaoEhDonaDoPerfil && (
                <>
                    {erroCategoriasCriacao && criarPostAberto && (
                        <p className="perfilCriarPostErro" role="alert">{erroCategoriasCriacao}</p>
                    )}
                    <CreatePostModal
                        open={criarPostAberto}
                        onClose={() => setCriarPostAberto(false)}
                        person={{
                            id_pessoa: Number(organizacao.id_pessoa),
                            id_organizacao: Number(organizacao.id_organizacao),
                            nome: organizacao.nome,
                            tipo: "ORGANIZACAO"
                        }}
                        categories={categoriasCriacao}
                        onPublished={async () => {
                            await carregarPosts(Number(organizacao.id_organizacao));
                        }}
                    />
                </>
            )}

            {confirmarDesarquivarLote && (
                <div className="perfilLoteOverlay" role="presentation"
                    onMouseDown={e => { if (e.target === e.currentTarget && !processandoLote) setConfirmarDesarquivarLote(false); }}>
                    <div className="perfilLoteModal" role="dialog" aria-modal="true"
                        aria-labelledby="tituloDesarquivarLote">
                        <div className="perfilLoteIcone"><Archive size={25} /></div>
                        <h2 id="tituloDesarquivarLote">Desarquivar publicações?</h2>
                        <p>
                            As {idsArquivadosSelecionados.length} publicações selecionadas
                            voltarão a aparecer no perfil público da organização.
                        </p>
                        <div className="perfilLoteAcoes">
                            <button type="button" className="perfilLoteBotaoNeutro"
                                disabled={processandoLote}
                                onClick={() => setConfirmarDesarquivarLote(false)}>Cancelar</button>
                            <button type="button" className="perfilLoteBotaoPrincipal"
                                disabled={processandoLote}
                                onClick={() => void executarDesarquivamentoEmLote()}>
                                Confirmar desarquivamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmarDesarquivarId !== null && (
                <ConfirmarPublicacao
                    acao="desarquivar"
                    titulo={postsArquivados.find(p => Number(p.id_post) === confirmarDesarquivarId)?.titulo}
                    ocupado={desarquivando !== null}
                    aoCancelar={() => setConfirmarDesarquivarId(null)}
                    aoConfirmar={() => void executarDesarquivamento(confirmarDesarquivarId)}
                />
            )}

            {modalAvaliacaoAberto && usuarioEhCliente && createPortal((

                <div

                    className="modalOverlay"

                    onMouseDown={(evento) => {

                        if (

                            evento.target === evento.currentTarget &&

                            !enviandoAvaliacao

                        ) {

                            fecharModalAvaliacao();

                        }

                    }}

                >

                    <div

                        className="modalAvaliacao"

                        role="dialog"

                        aria-modal="true"

                        aria-labelledby="tituloModalAvaliacao"

                    >

                        <div className="modalCabecalho">

                            <div>

                                <h2

                                    id="tituloModalAvaliacao"

                                    className="modalTitulo"

                                >

                                    Criar avaliação

                                </h2>

                                <p className="modalSubtitulo">

                                    Conte como foi sua experiência com

                                    esta organização.

                                </p>

                            </div>

                            <button

                                type="button"

                                className="modalFechar"

                                onClick={fecharModalAvaliacao}

                                disabled={enviandoAvaliacao}

                                aria-label="Fechar modal"

                            >

                                ×

                            </button>

                        </div>

                        <form

                            className="formAvaliacao"

                            onSubmit={enviarAvaliacao}

                        >

                            <div className="campoAvaliacao">

                                <label className="labelAvaliacao">

                                    Sua nota

                                </label>

                                <div

                                    className="estrelasAvaliacao"

                                    role="radiogroup"

                                    aria-label="Escolha uma nota"

                                >

                                    {[1, 2, 3, 4, 5].map((nota) => (

                                        <button

                                            key={nota}

                                            type="button"

                                            className={`estrelaBotao ${nota <= notaSelecionada

                                                ? "estrelaSelecionada"

                                                : ""

                                                }`}

                                            onClick={() =>

                                                setNotaSelecionada(nota)

                                            }

                                            disabled={enviandoAvaliacao}

                                            aria-label={`${nota} estrela${nota > 1 ? "s" : ""

                                                }`}

                                            aria-pressed={

                                                nota === notaSelecionada

                                            }

                                        >

                                            ★

                                        </button>

                                    ))}

                                </div>

                                {notaSelecionada > 0 && (

                                    <span className="textoNota">

                                        {

                                            {

                                                1: "Muito ruim",

                                                2: "Ruim",

                                                3: "Regular",

                                                4: "Boa",

                                                5: "Excelente",

                                            }[notaSelecionada]

                                        }

                                    </span>

                                )}

                            </div>

                            <div className="campoAvaliacao">

                                <label

                                    htmlFor="tituloAvaliacao"

                                    className="labelAvaliacao"

                                >

                                    Título

                                </label>

                                <input

                                    id="tituloAvaliacao"

                                    type="text"

                                    className="inputAvaliacao"

                                    placeholder="Ex.: Excelente atendimento"

                                    value={tituloAvaliacao}

                                    onChange={(evento) =>

                                        setTituloAvaliacao(

                                            evento.target.value

                                        )

                                    }

                                    minLength={5}

                                    maxLength={25}

                                    disabled={enviandoAvaliacao}

                                />

                            </div>

                            <div className="campoAvaliacao">

                                <label

                                    htmlFor="comentarioAvaliacao"

                                    className="labelAvaliacao"

                                >

                                    Comentário

                                </label>

                                <textarea

                                    id="comentarioAvaliacao"

                                    className="textareaAvaliacao"

                                    placeholder="Conte um pouco sobre sua experiência..."

                                    value={comentarioAvaliacao}

                                    onChange={(evento) =>

                                        setComentarioAvaliacao(

                                            evento.target.value

                                        )

                                    }

                                    minLength={10}

                                    maxLength={45}

                                    rows={5}

                                    disabled={enviandoAvaliacao}

                                />

                                <span className="contadorCaracteres">

                                    {comentarioAvaliacao.length}/45

                                </span>

                            </div>

                            <label className="checkboxAnonimo">

                                <input

                                    type="checkbox"

                                    checked={avaliacaoAnonima}

                                    onChange={(evento) =>

                                        setAvaliacaoAnonima(

                                            evento.target.checked

                                        )

                                    }

                                    disabled={enviandoAvaliacao}

                                />

                                <span className="checkmark" />

                                <span className="textoAnonimo">

                                    Publicar como anônimo

                                </span>

                            </label>

                            {erroAvaliacao && (

                                <div className="mensagemErroAvaliacao">

                                    {erroAvaliacao}

                                </div>

                            )}

                            {sucessoAvaliacao && (

                                <div className="mensagemSucessoAvaliacao">

                                    {sucessoAvaliacao}

                                </div>

                            )}

                            <div className="modalRodape">

                                <button

                                    type="button"

                                    className="botaoCancelarAvaliacao"

                                    onClick={fecharModalAvaliacao}

                                    disabled={enviandoAvaliacao}

                                >

                                    Cancelar

                                </button>

                                <button

                                    type="submit"

                                    className="botaoEnviarAvaliacao"

                                    disabled={enviandoAvaliacao}

                                >

                                    {enviandoAvaliacao ? (

                                        <>

                                            <span className="spinnerBotao" />

                                            Enviando...

                                        </>

                                    ) : (

                                        "Publicar avaliação"

                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            ), document.body)}

        </div>

    );

}

/* Publicações integradas diretamente ao perfil da organização. */
interface IPostFeed {

    id_post?: number;

    vincularImagem?: string;

    titulo?: string;

    descricao?: string;

    id_categoria?: number;

    status?: string;

    id_organizacao?: number;

    nome_organizacao?: string;

    nome?: string;

}

interface IOrganizacaoFeed {

    id_pessoa?: number;

    id_organizacao?: number;

    nome?: string;

}

interface ILikeState {

    curtiu: boolean;

    totalLikes: number;

}

interface VisualizarPostProps {
    incorporado?: boolean;
    idOrganizacaoPerfil?: number;
    organizacaoDoPerfilIdPessoa?: number;
    nomeOrganizacaoPerfil?: string;
    onPostArquivado?: (idPost: number) => void;
    postsIniciais?: IPost[];
    carregandoPostsIniciais?: boolean;
}

function FeedPostsPerfil({
    incorporado = true,
    idOrganizacaoPerfil,
    organizacaoDoPerfilIdPessoa,
    nomeOrganizacaoPerfil = "",
    onPostArquivado,
    postsIniciais,
    carregandoPostsIniciais = false,
}: VisualizarPostProps) {

    const { id_post } = useParams<{ id_post: string }>();

    const [searchParams] = useSearchParams();
    const postDestacado = Number(searchParams.get("post"));
    const temPostDestacado = incorporado && searchParams.has("post") && Number.isSafeInteger(postDestacado) && postDestacado > 0;

    const navigate = useNavigate();

    const idOrganizacao = incorporado
        ? String(idOrganizacaoPerfil ?? "")
        : searchParams.get("id_organizacao");

    const [posts, setPosts] = useState<IPostFeed[]>(postsIniciais ?? []);

    // Pesquisa local somente pelo título da publicação.
    const [pesquisaPosts, setPesquisaPosts] = useState("");
    const postsFiltrados = useMemo(() => {
        const normalizar = (valor: unknown) => String(valor ?? "")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("pt-BR").trim();
        const termo = normalizar(pesquisaPosts);
        return termo ? posts.filter(post => normalizar(post.titulo).includes(termo)) : posts;
    }, [posts, pesquisaPosts]);

    const postsExibidos = postsFiltrados;

    const [nomeEmpresa, setNomeEmpresa] = useState("");

    const [loading, setLoading] = useState(postsIniciais === undefined);

    const [erro, setErro] = useState("");
    const [tentativaPosts, setTentativaPosts] = useState(0);

    const [imagensIndisponiveis, setImagensIndisponiveis] =

        useState<number[]>([]);

    const [likes, setLikes] = useState<

        Record<number, ILikeState>

    >({});

    const [likesCarregando, setLikesCarregando] = useState<

        Record<number, boolean>

    >({});

    const [erroLike, setErroLike] = useState("");

    const [mensagemSucesso, setMensagemSucesso] = useState("");

    const [menuAberto, setMenuAberto] = useState<number | null>(null);

    const [arquivando, setArquivando] = useState<number | null>(null);
    const [confirmarArquivarId, setConfirmarArquivarId] = useState<number | null>(null);
    const [postEmEdicao, setPostEmEdicao] = useState<IPostFeed | null>(null);
    const [formPost, setFormPost] = useState({ titulo: "", descricao: "" });
    const [novaImagemPost, setNovaImagemPost] = useState<File | null>(null);
    const [previewNovaImagem, setPreviewNovaImagem] = useState("");
    useEffect(() => {
        if (!novaImagemPost) { setPreviewNovaImagem(""); return; }
        const url = URL.createObjectURL(novaImagemPost);
        setPreviewNovaImagem(url);
        return () => URL.revokeObjectURL(url);
    }, [novaImagemPost]);
    const [salvandoPost, setSalvandoPost] = useState(false);
    const [erroEditarPost, setErroEditarPost] = useState("");

    const [erroArquivar, setErroArquivar] = useState("");

    const usuarioPodeCurtir = true;

    const { user } = useAuth();

    const ehOrganizacao =
        String(user?.tipo ?? "").trim().toUpperCase() === "ORGANIZACAO";

    const idPessoaLogada = Number(user?.id_pessoa_login);

    const idOrganizacaoLogada =
        ehOrganizacao &&
            Number.isSafeInteger(idPessoaLogada) &&
            idPessoaLogada > 0 &&
            Number(organizacaoDoPerfilIdPessoa) === idPessoaLogada
            ? Number(idOrganizacaoPerfil)
            : null;

    const postSelecionadoRef = useRef<HTMLElement>(null);

    // A aba incorporada usa a mesma lista dos Destaques, sem uma segunda
    // chamada que pode retornar 401 enquanto a primeira já teve sucesso.
    useEffect(() => {
        if (postsIniciais === undefined) return;
        setPosts(postsIniciais);
        setErro("");
        setLoading(carregandoPostsIniciais);
    }, [postsIniciais, carregandoPostsIniciais]);

    useEffect(() => {
        if (postsIniciais !== undefined) return;

        let cancelado = false;

        async function carregarPosts() {

            try {

                setLoading(true);

                setErro("");

                if ((!incorporado && !id_post) || !idOrganizacao) {

                    throw new Error(

                        "Não foi possível identificar o post ou a empresa."

                    );

                }

                // Aguarda a API responder; tenta novamente em falhas transitórias.
                let lista: IPostFeed[] | null = null;
                let ultimoErro: Error | null = null;
                for (let tentativa = 0; tentativa < 3 && !cancelado; tentativa++) {
                    try {
                        const resposta = await apiFetchResponse(`/posts/organizacao?id_organizacao=${encodeURIComponent(idOrganizacao)}`,
                            { credentials: "include" }
                        );
                        if (!resposta.ok) {
                            const falha = new Error(`Não foi possível carregar os posts (HTTP ${resposta.status}).`);
                            // Erros de autenticação/permissão e 4xx comuns não se resolvem com retry.
                            if (resposta.status !== 429 && resposta.status < 500) throw falha;
                            ultimoErro = falha;
                        } else {
                            const data = await resposta.json();
                            const recebido = data?.posts ?? data?.data ?? data?.dados ?? data;
                            if (!Array.isArray(recebido)) throw new Error("A resposta de publicações é inválida.");
                            lista = recebido;
                            break;
                        }
                    } catch (falha) {
                        ultimoErro = falha instanceof Error ? falha : new Error("Falha na conexão com o servidor.");
                        if (/HTTP 4(?!29)/.test(ultimoErro.message)) break;
                    }
                    if (tentativa < 2 && !cancelado) {
                        await new Promise<void>(resolve => window.setTimeout(resolve, 650 * (tentativa + 1)));
                    }
                }
                if (cancelado) return;
                if (!lista) throw ultimoErro ?? new Error("Não foi possível carregar os posts.");

                const postsOrganizacao = lista.filter(

                    (post: IPostFeed) =>

                        Number(post.id_organizacao) ===

                        Number(idOrganizacao)

                );

                const selecionadoExiste = incorporado || postsOrganizacao.some(

                    (post: IPostFeed) =>

                        Number(post.id_post) === Number(id_post)

                );

                if (!selecionadoExiste) {

                    throw new Error(

                        "O post selecionado não foi encontrado."

                    );

                }

                if (!cancelado) {

                    setPosts(postsOrganizacao);

                    setImagensIndisponiveis([]);

                    setLikes({});

                    const postComNome = postsOrganizacao.find(

                        (post: IPostFeed) =>

                            post.nome_organizacao || post.nome

                    );

                    if (postComNome) {

                        setNomeEmpresa(

                            postComNome.nome_organizacao ||

                            postComNome.nome ||

                            ""

                        );

                    }

                }

                try {

                    const respostaEmpresa = await apiFetchResponse(`/pessoas?tipo=ORGANIZACAO`,

                        { credentials: "include" }

                    );

                    if (respostaEmpresa.ok) {

                        const dadosEmpresa =

                            await respostaEmpresa.json();

                        const listaPessoas =

                            dadosEmpresa?.funcionarios ??

                            dadosEmpresa?.pessoas ??

                            dadosEmpresa?.dados ??

                            dadosEmpresa?.data ??

                            [];

                        if (Array.isArray(listaPessoas)) {

                            const empresa = listaPessoas.find(

                                (pessoa: IOrganizacaoFeed) =>

                                    Number(pessoa.id_organizacao) ===

                                    Number(idOrganizacao)

                            );

                            if (!cancelado && empresa?.nome) {

                                setNomeEmpresa(empresa.nome);

                            }

                        }

                    }

                } catch (error) {

                    console.error(

                        "Não foi possível carregar o nome da empresa:",

                        error

                    );

                }

            } catch (error) {

                if (!cancelado) {

                    setErro(

                        error instanceof Error

                            ? error.message

                            : "Erro ao carregar os posts."

                    );

                }

            } finally {

                if (!cancelado) {

                    setLoading(false);

                }

            }

        }

        void carregarPosts();

        return () => {

            cancelado = true;

        };

    }, [id_post, idOrganizacao, incorporado, tentativaPosts, postsIniciais !== undefined]);

    useEffect(() => {

        if (loading || posts.length === 0) return;

        let cancelado = false;

        async function carregarLikes() {

            const resultados = await Promise.all(

                posts.map(async (post) => {

                    const id = Number(post.id_post);

                    if (!id || id <= 0) return null;

                    try {

                        const respostaContagem = await apiFetchResponse(`/likes/contar?id_post=${id}`,

                            { credentials: "include" }

                        );

                        if (!respostaContagem.ok) {

                            throw new Error(

                                "Não foi possível carregar as curtidas."

                            );

                        }

                        const dadosContagem =

                            await respostaContagem.json();

                        const totalLikes = Number(

                            dadosContagem?.total ?? 0

                        );

                        let curtiu = false;

                        if (usuarioPodeCurtir) {

                            const respostaVerificacao = await apiFetchResponse(`/likes/verificar?id_post=${id}`,

                                { credentials: "include" }

                            );

                            if (!respostaVerificacao.ok) {

                                throw new Error(

                                    "Não foi possível verificar sua curtida."

                                );

                            }

                            const dadosVerificacao =

                                await respostaVerificacao.json();

                            curtiu = Boolean(

                                dadosVerificacao?.curtiu

                            );

                        }

                        return {

                            id,

                            curtiu,

                            totalLikes,

                        };

                    } catch (error) {

                        console.error(

                            `Erro ao carregar curtidas do post ${id}:`,

                            error

                        );

                        return {

                            id,

                            curtiu: false,

                            totalLikes: 0,

                        };

                    }

                })

            );

            if (cancelado) return;

            const novoEstado: Record<number, ILikeState> = {};

            resultados.forEach((resultado) => {

                if (!resultado) return;

                novoEstado[resultado.id] = {

                    curtiu: resultado.curtiu,

                    totalLikes: resultado.totalLikes,

                };

            });

            setLikes(novoEstado);

        }

        void carregarLikes();

        return () => {

            cancelado = true;

        };

    }, [loading, posts, usuarioPodeCurtir]);

    // A publicação destacada recebe apenas o contorno visual; não move a rolagem.

    function obterUrlImagem(nome?: string): string {

        if (!nome) return "";

        if (/^https?:\/\//i.test(nome)) {

            return nome;

        }

        const nomeArquivo = nome

            .replace(/\\/g, "/")

            .split("/")

            .pop();

        return nomeArquivo

            ? `${BASE_URL}/images/${nomeArquivo}`

            : "";

    }

    function marcarImagemIndisponivel(id: number) {

        setImagensIndisponiveis((anteriores) =>

            anteriores.includes(id)

                ? anteriores

                : [...anteriores, id]

        );

    }

    function abrirEdicaoPost(post: IPostFeed) {
        if (idOrganizacaoLogada === null || Number(post.id_organizacao) !== idOrganizacaoLogada) return;
        setPostEmEdicao(post);
        setFormPost({
            titulo: post.titulo ?? "",
            descricao: post.descricao ?? "",
        });
        setNovaImagemPost(null);
        setErroEditarPost("");
        setMenuAberto(null);
    }

    async function salvarEdicaoPost(evento: React.FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        const id = Number(postEmEdicao?.id_post);
        if (!postEmEdicao || idOrganizacaoLogada === null ||
            Number(postEmEdicao.id_organizacao) !== idOrganizacaoLogada ||
            !Number.isSafeInteger(id) || id <= 0 || salvandoPost) return;
        if (!formPost.titulo.trim()) {
            setErroEditarPost("Informe o título da publicação.");
            return;
        }
        setSalvandoPost(true);
        setErroEditarPost("");
        try {
            const data = new FormData();
            data.append("titulo", formPost.titulo.trim());
            data.append("descricao", formPost.descricao.trim());
            data.append("id_categoria", String(postEmEdicao.id_categoria ?? ""));
            data.append("id_organizacao", String(idOrganizacaoLogada));
            if (novaImagemPost) data.append("image", novaImagemPost);
            const resposta = await apiFetchResponse(`/posts?id_post=${id}`, {
                method: "PUT",
                credentials: "include",
                body: data,
            });
            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) throw new Error(dados?.message || dados?.error || `Erro HTTP ${resposta.status} ao editar.`);
            const atualizacao = {
                titulo: formPost.titulo.trim(),
                descricao: formPost.descricao.trim(),
                vincularImagem: String(dados?.imagem ?? postEmEdicao.vincularImagem ?? ""),
            };
            setPosts(anteriores => anteriores.map(p => Number(p.id_post) === id ? { ...p, ...atualizacao } : p));
            setImagensIndisponiveis(anteriores => anteriores.filter(item => item !== id));
            setPostEmEdicao(null);
            setNovaImagemPost(null);
            setMensagemSucesso("Publicação atualizada com sucesso!");
        } catch (error) {
            setErroEditarPost(error instanceof Error ? error.message : "Não foi possível editar a publicação.");
        } finally {
            setSalvandoPost(false);
        }
    }

    function arquivarPost(id: number) {
        setConfirmarArquivarId(id);
    }

    async function executarArquivamento(id: number) {

        if (arquivando !== null) return;

        const organizacaoLogada = idOrganizacaoLogada;

        // Confere a organização dona da publicação.

        const post = posts.find(

            (item) => Number(item.id_post) === id

        );

        if (!organizacaoLogada || !post) {

            setErroArquivar(

                "Não foi possível confirmar a propriedade desta publicação."

            );

            setMenuAberto(null);

            return;

        }

        if (

            Number(post.id_organizacao) !== organizacaoLogada

        ) {

            setErroArquivar(

                "Você só pode arquivar publicações da sua organização."

            );

            setMenuAberto(null);

            return;

        }

        setConfirmarArquivarId(null);

        setArquivando(id);

        setErroArquivar("");

        setMensagemSucesso("");

        try {

            const resposta = await apiFetchResponse(`/posts?id_post=${id}`,

                {

                    method: "DELETE",

                    credentials: "include",

                }

            );

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {

                throw new Error(

                    dados?.message ||

                    dados?.error ||

                    "Não foi possível arquivar a publicação."

                );

            }

            setPosts((anteriores) =>

                anteriores.filter(

                    (item) => Number(item.id_post) !== id

                )

            );

            onPostArquivado?.(id);

            setMenuAberto(null);

            setMensagemSucesso(

                "Publicação arquivada com sucesso!"

            );

        } catch (error) {

            setErroArquivar(

                error instanceof Error

                    ? error.message

                    : "Ocorreu um erro ao arquivar a publicação."

            );

        } finally {

            setArquivando(null);

        }

    }

    async function alternarLike(id: number) {

        if (!usuarioPodeCurtir) {

            setErroLike(

                "Somente clientes podem curtir publicações."

            );

            return;

        }

        if (likesCarregando[id]) return;

        setErroLike("");

        setLikesCarregando((anterior) => ({

            ...anterior,

            [id]: true,

        }));

        try {

            const resposta = await apiFetchResponse(`/likes/toggle`,

                {

                    method: "POST",

                    credentials: "include",

                    headers: {

                        "Content-Type": "application/json",

                    },

                    body: JSON.stringify({

                        id_post: id,

                    }),

                }

            );

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {

                if (resposta.status === 401) {

                    throw new Error(

                        "Sua sessão expirou. Entre novamente para curtir."

                    );

                }

                throw new Error(

                    dados?.message ||

                    "Não foi possível registrar sua curtida."

                );

            }

            setLikes((anterior) => ({

                ...anterior,

                [id]: {

                    curtiu: Boolean(dados?.curtiu),

                    totalLikes: Number(dados?.totalLikes ?? 0),

                },

            }));

        } catch (error) {

            setErroLike(

                error instanceof Error

                    ? error.message

                    : "Erro ao curtir a publicação."

            );

        } finally {

            setLikesCarregando((anterior) => ({

                ...anterior,

                [id]: false,

            }));

        }

    }

    if (loading) {

        return (

            <main className={incorporado ? "visualizarPostPagina visualizarPostIncorporado" : "visualizarPostPagina"}>

                <div className="visualizarPostEstado">

                    <div className="visualizarPostSpinner" />

                    <p>Carregando publicações...</p>

                </div>

            </main>

        );

    }

    if (erro) {
        return (
            <main className={incorporado ? "visualizarPostPagina visualizarPostIncorporado" : "visualizarPostPagina"}>
                <div className="perfilEstadoVazio perfilEstadoPosts" role="alert">
                    <ImageOff size={36} />
                    <h3>Não foi possível carregar as publicações</h3>
                    <p>{erro}</p>
                    <button type="button" className="perfilBotaoTentar" onClick={() => setTentativaPosts(atual => atual + 1)}>
                        <RefreshCw size={16} /> Tentar novamente
                    </button>
                </div>
            </main>
        );
    }

    if (posts.length === 0) {
        return (
            <main className={incorporado ? "visualizarPostPagina visualizarPostIncorporado" : "visualizarPostPagina"}>
                <div className="perfilEstadoVazio perfilEstadoPosts">
                    <Inbox size={36} />
                    <h3>Nenhuma publicação por enquanto</h3>
                    <p>As publicações desta organização aparecerão aqui.</p>
                    <button type="button" className="perfilBotaoTentar" onClick={() => setTentativaPosts(atual => atual + 1)}>
                        <RefreshCw size={16} /> Atualizar
                    </button>
                </div>
            </main>
        );
    }

    return (

        <main className={incorporado ? "visualizarPostPagina visualizarPostIncorporado" : "visualizarPostPagina"}>

            {!incorporado && (
                <header className="visualizarPostTopo">

                    <button

                        type="button"

                        className="visualizarPostVoltar"

                        onClick={() => navigate(-1)}

                    >

                        <ArrowLeft size={19} />

                        Voltar

                    </button>

                    <div className="visualizarPostCabecalho">

                        <div className="visualizarPostLogo">

                            <Store size={25} />

                        </div>

                        <div>

                            <span className="visualizarPostEyebrow">

                                PUBLICAÇÕES DE

                            </span>

                            <h1>{nomeEmpresa || "Empresa"}</h1>

                            <p>

                                Confira os produtos e serviços publicados.

                            </p>

                        </div>

                    </div>

                </header>
            )}

            {mensagemSucesso && (

                <div className="visualizarPostSucesso" role="status">

                    <span className="visualizarPostSucessoIcone">

                        ✓

                    </span>

                    <div>

                        <strong>Pronto!</strong>

                        <p>{mensagemSucesso}</p>

                    </div>

                    <button

                        type="button"

                        onClick={() => setMensagemSucesso("")}

                        aria-label="Fechar mensagem"

                    >

                        ×

                    </button>

                </div>

            )}

            <div className="tdkPostsBuscaPainel">
                <div className="tdkPostsBuscaTexto">
                    <span className="tdkPostsBuscaIcone"><Search size={20} /></span>
                    <div>
                        <label htmlFor="perfilPesquisarPublicacoes">Buscar publicação</label>
                        <p>Encontre uma publicação pelo título</p>
                    </div>
                </div>
                <div className="tdkPostsBuscaCampo">
                    <Search size={19} aria-hidden="true" />
                    <input
                        id="perfilPesquisarPublicacoes"
                        type="search"
                        value={pesquisaPosts}
                        onChange={(evento) => setPesquisaPosts(evento.target.value)}
                        placeholder="Pesquisar pelo título..."
                        aria-label="Pesquisar publicações pelo título"
                    />
                    {pesquisaPosts && (
                        <button type="button" onClick={() => setPesquisaPosts("")} aria-label="Limpar pesquisa" title="Limpar pesquisa">
                            <X size={17} />
                        </button>
                    )}
                </div>
                {pesquisaPosts.trim() && (
                    <p className="tdkPostsBuscaResultado" role="status">
                        {postsFiltrados.length} {postsFiltrados.length === 1 ? "publicação encontrada" : "publicações encontradas"}
                    </p>
                )}
            </div>

            <section className="visualizarPostFeed">

                {postsExibidos.length === 0 && (
                    <div className="perfilEstadoVazio" role="status">
                        <Search size={30} />
                        <h3>Nenhuma publicação encontrada</h3>
                        <p>Tente pesquisar por outro título.</p>
                    </div>
                )}

                {postsExibidos.map((post, index) => {

                    const id = Number(post.id_post ?? index);

                    const selecionado =

                        Number(post.id_post) === (temPostDestacado ? postDestacado : Number(id_post));

                    const imagem = obterUrlImagem(

                        post.vincularImagem

                    );

                    const imagemIndisponivel =

                        !imagem ||

                        imagensIndisponiveis.includes(id);

                    const like = likes[id] ?? {

                        curtiu: false,

                        totalLikes: 0,

                    };

                    const enviando = Boolean(likesCarregando[id]);

                    return (

                        <article

                            key={post.id_post ?? index}

                            ref={

                                selecionado

                                    ? postSelecionadoRef

                                    : null

                            }

                            className={`visualizarPostConteudo ${selecionado

                                ? "visualizarPostSelecionado"

                                : ""

                                }`}

                        >

                            <div className="visualizarPostCardTopo">

                                <div className="visualizarPostMiniLogo visualizarPostInicialEmpresa" aria-hidden="true">
                                    {(String(nomeOrganizacaoPerfil || nomeEmpresa || post.nome_organizacao || post.nome || "O").trim().charAt(0) || "O").toLocaleUpperCase("pt-BR")}
                                </div>

                                <div className="visualizarPostDadosEmpresa">
                                    <strong>{nomeOrganizacaoPerfil || nomeEmpresa || post.nome_organizacao || post.nome || "Organização"}</strong>
                                </div>

                                {ehOrganizacao && idOrganizacaoLogada !== null && idOrganizacaoLogada === Number(post.id_organizacao) && (
                                    <div

                                        style={{

                                            position: "relative",

                                            display: "inline-flex",

                                            alignItems: "center",

                                            zIndex: 9999,

                                        }}

                                    >

                                        <button

                                            type="button"

                                            className="visualizarPostPonto"

                                            aria-label="Opções da publicação"

                                            aria-expanded={menuAberto === id}

                                            onClick={() => {

                                                setMenuAberto((atual) =>

                                                    atual === id ? null : id

                                                );

                                            }}

                                        >

                                            <MoreVertical size={22} />

                                        </button>

                                        {menuAberto === id && (

                                            <div

                                                style={{

                                                    position: "absolute",

                                                    top: "100%",

                                                    right: 0,

                                                    zIndex: 99999,

                                                    display: "block",

                                                    visibility: "visible",

                                                    opacity: 1,

                                                    minWidth: 220,

                                                    padding: 8,

                                                    backgroundColor: "#fff",

                                                    border: "1px solid #ddd",

                                                    borderRadius: 10,

                                                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",

                                                }}

                                            >

                                                <button type="button" className="tdkPostMenuItem"
                                                    onClick={() => abrirEdicaoPost(post)}>
                                                    <span aria-hidden="true">✎</span> Editar publicação
                                                </button>

                                                <button

                                                    type="button"

                                                    disabled={arquivando === id}

                                                    onClick={() => void arquivarPost(id)}

                                                    style={{

                                                        display: "flex",

                                                        alignItems: "center",

                                                        gap: 10,

                                                        width: "100%",

                                                        padding: 12,

                                                        border: 0,

                                                        background: "#fff",

                                                        color: "#333",

                                                        cursor: "pointer",

                                                        textAlign: "left",

                                                    }}

                                                >

                                                    <Archive size={18} />

                                                    <span>

                                                        {arquivando === id

                                                            ? "Arquivando..."

                                                            : "Arquivar publicação"}

                                                    </span>

                                                </button>

                                            </div>

                                        )}

                                    </div>
                                )}

                            </div>

                            <div className="visualizarPostAreaImagem">

                                {imagemIndisponivel ? (

                                    <div className="visualizarPostSemImagem">

                                        <div className="visualizarPostIconeImagem">

                                            <ImageOff size={36} />

                                        </div>

                                        <strong>

                                            Imagem indisponível

                                        </strong>

                                        <span>

                                            Esta publicação não possui

                                            uma imagem disponível.

                                        </span>

                                    </div>

                                ) : (

                                    <img

                                        src={imagem}

                                        alt={

                                            post.titulo ||

                                            "Imagem da publicação"

                                        }

                                        className="visualizarPostImagem"

                                        onError={() =>

                                            marcarImagemIndisponivel(id)

                                        }

                                    />

                                )}

                            </div>

                            <div className="visualizarPostTexto">

                                <h2>

                                    {post.titulo || "Sem título"}

                                </h2>

                                <p>

                                    {post.descricao ||

                                        "Nenhuma descrição disponível."}

                                </p>

                                <div className="visualizarPostAcoes">

                                    {usuarioPodeCurtir ? (

                                        <button

                                            type="button"

                                            className="visualizarPostCurtir"

                                            onClick={() =>

                                                void alternarLike(id)

                                            }

                                            disabled={enviando}

                                            aria-pressed={like.curtiu}

                                            aria-label={

                                                like.curtiu

                                                    ? "Descurtir publicação"

                                                    : "Curtir publicação"

                                            }

                                            title={

                                                like.curtiu

                                                    ? "Descurtir"

                                                    : "Curtir"

                                            }

                                        >

                                            <Heart

                                                size={21}

                                                fill={

                                                    like.curtiu

                                                        ? "#B01013"

                                                        : "none"

                                                }

                                                color={

                                                    like.curtiu

                                                        ? "#B01013"

                                                        : "currentColor"

                                                }

                                                strokeWidth={2}

                                            />

                                            <span>

                                                {enviando

                                                    ? "Curtido"

                                                    : like.curtiu

                                                        ? "Curtido"

                                                        : "Curtir"}

                                            </span>

                                            <span>

                                                {like.totalLikes}

                                            </span>

                                        </button>

                                    ) : (

                                        <span>

                                            {like.totalLikes} curtidas

                                        </span>

                                    )}

                                </div>

                            </div>

                        </article>

                    );

                })}

            </section>

            {erroArquivar && (

                <div

                    role="alert"

                    className="visualizarPostErro"

                >

                    {erroArquivar}

                    <button

                        type="button"

                        onClick={() => setErroArquivar("")}

                    >

                        Fechar

                    </button>

                </div>

            )}

            {erroLike && (

                <div

                    role="alert"

                    style={{

                        position: "fixed",

                        bottom: 20,

                        left: 16,

                        right: 16,

                        zIndex: 1000,

                        maxWidth: 500,

                        margin: "0 auto",

                        padding: "14px 18px",

                        background: "#FFFFFF",

                        border: "1px solid #B01013",

                        borderRadius: 12,

                        color: "#7f2a2a",

                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",

                    }}

                >

                    {erroLike}

                    <button

                        type="button"

                        onClick={() => setErroLike("")}

                        style={{

                            display: "block",

                            marginTop: 8,

                            border: 0,

                            background: "transparent",

                            color: "#B01013",

                            cursor: "pointer",

                            fontWeight: 700,

                        }}

                    >

                        Fechar

                    </button>

                </div>

            )}

            {postEmEdicao && createPortal(
                <div className="tdkEditOverlay" onMouseDown={e => {
                    if (e.target === e.currentTarget && !salvandoPost) setPostEmEdicao(null);
                }}>
                    <section className="tdkEditModal" role="dialog" aria-modal="true" aria-labelledby="tdkEditarTitulo">
                        <div className="tdkEditCabecalho">
                            <div><span className="tdkEditKicker">PUBLICAÇÃO</span>
                                <h2 id="tdkEditarTitulo">Editar publicação</h2>
                                <p>Atualize os detalhes da sua publicação.</p>
                            </div>
                            <button type="button" className="tdkEditFechar" aria-label="Fechar edição"
                                disabled={salvandoPost} onClick={() => setPostEmEdicao(null)}>×</button>
                        </div>
                        <form onSubmit={salvarEdicaoPost} className="tdkEditForm">
                            <label htmlFor="tdkEditTitulo">Título</label>
                            <input id="tdkEditTitulo" required maxLength={120} value={formPost.titulo}
                                disabled={salvandoPost} onChange={e => setFormPost(a => ({ ...a, titulo: e.target.value }))} />
                            <label htmlFor="tdkEditDescricao">Descrição</label>
                            <textarea id="tdkEditDescricao" rows={4} maxLength={2000} value={formPost.descricao}
                                disabled={salvandoPost} onChange={e => setFormPost(a => ({ ...a, descricao: e.target.value }))} />
                            <label htmlFor="tdkEditImagem">Foto da publicação</label>
                            <div className="tdkUploadArea">
                                {(previewNovaImagem || obterUrlImagem(postEmEdicao.vincularImagem)) && (
                                    <div className="tdkUploadPreview">
                                        <img src={previewNovaImagem || obterUrlImagem(postEmEdicao.vincularImagem)} alt="Prévia da publicação" />
                                        <span>{novaImagemPost ? "Nova imagem selecionada" : "Imagem atual"}</span>
                                    </div>
                                )}
                                <input
                                    id="tdkEditImagem"
                                    className="tdkUploadInput"
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    disabled={salvandoPost}
                                    onChange={e => {
                                        const arquivo = e.target.files?.[0];
                                        if (!arquivo) return;
                                        if (!["image/png", "image/jpeg"].includes(arquivo.type)) {
                                            setErroEditarPost("Escolha uma imagem PNG ou JPEG.");
                                            e.target.value = "";
                                            return;
                                        }
                                        if (arquivo.size === 0 || arquivo.size > 10 * 1024 * 1024) {
                                            setErroEditarPost("A imagem deve ter entre 1 byte e 10 MB.");
                                            e.target.value = "";
                                            return;
                                        }
                                        setNovaImagemPost(arquivo);
                                        setErroEditarPost("");
                                    }}
                                />
                                <label className="tdkUploadEscolher" htmlFor="tdkEditImagem">
                                    <ImagePlus size={22} />
                                    <span><strong>{novaImagemPost ? "Trocar imagem selecionada" : "Escolher nova imagem"}</strong><small>PNG ou JPEG · até 10 MB</small></span>
                                </label>
                                {novaImagemPost && (
                                    <div className="tdkUploadArquivo">
                                        <span title={novaImagemPost.name}>{novaImagemPost.name} · {(novaImagemPost.size / 1024 / 1024).toFixed(2)} MB</span>
                                        <button type="button" disabled={salvandoPost} onClick={() => {
                                            setNovaImagemPost(null);
                                            const input = document.getElementById("tdkEditImagem") as HTMLInputElement | null;
                                            if (input) input.value = "";
                                        }} aria-label="Remover nova imagem"><X size={17} /></button>
                                    </div>
                                )}
                            </div>
                            <p className="tdkEditAjuda">Se não selecionar uma nova imagem, a foto atual será mantida.</p>
                            {erroEditarPost && <p role="alert" className="tdkEditErro">{erroEditarPost}</p>}
                            <div className="tdkEditAcoes">
                                <button type="button" className="tdkEditCancelar" disabled={salvandoPost}
                                    onClick={() => setPostEmEdicao(null)}>Cancelar</button>
                                <button type="submit" className="tdkEditSalvar" disabled={salvandoPost}>
                                    {salvandoPost ? "Salvando..." : "Salvar alterações"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>,
                document.body
            )}

            {confirmarArquivarId !== null && (
                <ConfirmarPublicacao
                    acao="arquivar"
                    titulo={posts.find(p => Number(p.id_post) === confirmarArquivarId)?.titulo}
                    ocupado={arquivando !== null}
                    aoCancelar={() => setConfirmarArquivarId(null)}
                    aoConfirmar={() => void executarArquivamento(confirmarArquivarId)}
                />
            )}

        </main>

    );

}
