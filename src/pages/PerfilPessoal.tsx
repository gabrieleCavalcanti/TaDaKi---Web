import React, { useEffect, useState } from "react";

import {
  User,
  Pencil,
  Heart,
  Star,
  Bookmark,
  Calendar,
  Mail,
  Save,
  X,
  Plus,
  Camera,
  Search,
  ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { apiFetch, getImageUrl } from "../services/api";

import { AvatarBoneco, AVATARES } from "./AvataresPerfil";

import { AppShell } from "../components/AppShell";

import "../css/PerfilPessoal.css";

const VERMELHO = "#C1121F";

// Quantos favoritos aparecem por vez (o resto fica atrás de "Ver mais").
const LIMITE_FAVORITOS = 6;

// O avatar escolhido é salvo no campo `imagem` como "avatar:<id>" (ex.: "avatar:urso").
const PREFIXO_AVATAR = "avatar:";

function obterAvatarId(imagem?: string) {
  if (!imagem || !imagem.startsWith(PREFIXO_AVATAR)) return null;

  const id = imagem.slice(PREFIXO_AVATAR.length);

  return AVATARES.some((avatar) => avatar.id === id) ? id : null;
}

function fundoDoAvatar(id: string) {
  return AVATARES.find((avatar) => avatar.id === id)?.fundo;
}

// Compara textos sem acento e sem diferença de maiúscula/minúscula.
function normalizar(valor?: string) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

interface Usuario {
  id_pessoa_login?: number;

  id_pessoa?: number;

  id_cliente?: number;

  nome?: string;

  username?: string;

  tipo?: string;

  data_nascimento?: string;

  imagem?: string;

  email?: string;

  telefone?: string;
}

interface Favorito {
  id_favorito: number;
  id_cliente: number;
  id_organizacao: number;
  nome?: string;
  username?: string;
  area?: string;
  imagem?: string;
  id_pessoa?: number;
}

interface Contato {
  id_contato?: number;

  telefone?: string | null;

  email?: string | null;

  id_pessoa?: number;

  principal?: number | boolean;
}

export default function PerfilPessoal() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [contatos, setContatos] = useState<Contato[]>([]);

  const [favoritos, setFavoritos] = useState(0);
  const [favoritosAbertos, setFavoritosAbertos] = useState(false);
  const [listaFavoritos, setListaFavoritos] = useState<Favorito[]>([]);
  const [carregandoFavoritos, setCarregandoFavoritos] = useState(false);
  const [buscaFavoritos, setBuscaFavoritos] = useState("");
  const [limiteFavoritos, setLimiteFavoritos] = useState(LIMITE_FAVORITOS);

  const [likes, setLikes] = useState(0);

  const [avaliacoes, setAvaliacoes] = useState(0);

  const [loading, setLoading] = useState(true);

  const [editando, setEditando] = useState(false);

  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");

  const [username, setUsername] = useState("");

  const [dataNascimento, setDataNascimento] = useState("");

  const [adicionandoEmail, setAdicionandoEmail] = useState(false);

  const [novoEmail, setNovoEmail] = useState("");

  const [salvandoEmail, setSalvandoEmail] = useState(false);

  const [alterandoPrincipal, setAlterandoPrincipal] = useState(false);

  const [excluindoEmail, setExcluindoEmail] = useState<number | null>(null);

  const [seletorAvatarAberto, setSeletorAvatarAberto] = useState(false);

  const [salvandoAvatar, setSalvandoAvatar] = useState(false);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    try {
      setLoading(true);

      const respostaLogin = await apiFetch<any>("/auth/me");

      const dadosLogin = respostaLogin?.user || respostaLogin;

      const idPessoa = dadosLogin?.id_pessoa ?? dadosLogin?.id_pessoa_login;

      if (!idPessoa) {
        throw new Error("ID da pessoa não encontrado.");
      }

      const respostaPessoa = await apiFetch<any>(`/pessoas?id=${idPessoa}`);

      const listaPessoas = Array.isArray(respostaPessoa?.pessoaId)
        ? respostaPessoa.pessoaId
        : Array.isArray(respostaPessoa?.pessoas)
          ? respostaPessoa.pessoas
          : Array.isArray(respostaPessoa)
            ? respostaPessoa
            : respostaPessoa?.pessoaId
              ? [respostaPessoa.pessoaId]
              : [];

      const pessoa =
        listaPessoas.find(
          (item: any) => Number(item.id_pessoa) === Number(idPessoa),
        ) || listaPessoas[0];

      if (!pessoa) {
        throw new Error("Dados da pessoa não encontrados.");
      }

      const respostaContatos = await apiFetch<any>(
        `/contatos?id_pessoa=${idPessoa}&campo=email`,
      );

      const listaContatos: Contato[] = Array.isArray(
        respostaContatos?.contatoPessoa,
      )
        ? respostaContatos.contatoPessoa.filter((contato: Contato) =>
            Boolean(contato.email),
          )
        : [];

      setContatos(listaContatos);

      const contatoPrincipal = listaContatos.find(
        (contato) =>
          Number(contato.principal) === 1 || contato.principal === true,
      );

      const emailPrincipal =
        contatoPrincipal?.email || listaContatos[0]?.email || "";

      const usuarioCarregado: Usuario = {
        ...dadosLogin,

        ...pessoa,

        id_pessoa: Number(pessoa.id_pessoa ?? idPessoa),

        nome: pessoa.nome || dadosLogin.nome || "",

        username: pessoa.username || dadosLogin.username || "",

        tipo: pessoa.tipo || dadosLogin.tipo,

        data_nascimento:
          pessoa.data_nascimento || dadosLogin.data_nascimento || "",

        imagem: pessoa.imagem || dadosLogin.imagem || "",

        email: emailPrincipal,
      };

      setUsuario(usuarioCarregado);
      console.log("dadosLogin", dadosLogin);
console.log("pessoa", pessoa);

      setNome(usuarioCarregado.nome || "");

      setUsername(usuarioCarregado.username || "");

      setDataNascimento(usuarioCarregado.data_nascimento?.split("T")[0] || "");
      await carregarFavoritos(usuarioCarregado);

      // setFavoritos(0);

      setLikes(0);

      setAvaliacoes(0);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);

      alert(
        error instanceof Error ? error.message : "Erro ao carregar o perfil.",
      );
    } finally {
      setLoading(false);
    }
  }

async function carregarFavoritos(usuarioAtual: Usuario | null = usuario) {
  const idCliente = Number(usuarioAtual?.id_cliente);

  if (!idCliente) {
    setListaFavoritos([]);
    setFavoritos(0);
    return;
  }

  try {
    setCarregandoFavoritos(true);

    const respostaFavoritos = await apiFetch<any>(
      `/Favoritos?id_cliente=${idCliente}`,
    );

    const todos: Favorito[] =
      [
        respostaFavoritos?.favoritos,
        respostaFavoritos?.resultadoSelecionaTodos,
      ].find((valor) => Array.isArray(valor)) ?? [];

    // Mantém o filtro no front enquanto o backend ignorar o id_cliente
    const vistos = new Set<number>();
    const favoritosRecebidos = todos.filter((fav) => {
      if (Number(fav.id_cliente) !== idCliente) return false;
      const org = Number(fav.id_organizacao);
      if (vistos.has(org)) return false;
      vistos.add(org);
      return true;
    });

    setFavoritos(favoritosRecebidos.length);

    if (favoritosRecebidos.length === 0) {
      setListaFavoritos([]);
      return;
    }

    const respostaOrganizacoes = await apiFetch<any>(
      "/pessoas?tipo=ORGANIZACAO",
    );

    const organizacoes: any[] =
      [
        respostaOrganizacoes?.funcionarios,
        respostaOrganizacoes?.organizacoes,
        respostaOrganizacoes?.pessoas,
        respostaOrganizacoes?.pessoaId,
        respostaOrganizacoes,
      ].find((valor) => Array.isArray(valor)) ?? [];

    let areasPorId = new Map<number, string>();

    try {
      const respostaAreas = await apiFetch<any>("/AreaAtuacao");

      const listaAreas: any[] =
        [
          respostaAreas?.resultadoSelecionaTodos,
          respostaAreas?.areas,
          respostaAreas?.dados,
          respostaAreas?.data,
          respostaAreas,
        ].find((valor) => Array.isArray(valor)) ?? [];

      areasPorId = new Map(
        listaAreas.map((area: any): [number, string] => [
          Number(area.id_area_atuacao),
          String(area.descricao ?? ""),
        ]),
      );
    } catch (error) {
      console.error("Erro ao carregar áreas de atuação:", error);
    }

    const favoritosComDados: Favorito[] = favoritosRecebidos.map((favorito) => {
      const organizacao = organizacoes.find(
        (item: any) =>
          Number(item.id_organizacao) === Number(favorito.id_organizacao) ||
          Number(item.id_pessoa) === Number(favorito.id_organizacao) ||
          Number(item.id_pessoa_login) === Number(favorito.id_organizacao),
      );

      return {
        ...favorito,
        nome:
          organizacao?.nome ||
          organizacao?.username ||
          `Organização #${favorito.id_organizacao}`,
        username: organizacao?.username || "",
        area: areasPorId.get(Number(organizacao?.id_area_atuacao)) || "",
        imagem: organizacao?.imagem || "",
        id_pessoa: organizacao?.id_pessoa,
      };
    });

    setListaFavoritos(favoritosComDados);
  } catch (error) {
    console.error("Erro ao carregar favoritos:", error);
  } finally {
    setCarregandoFavoritos(false);
  }
}

  async function alternarFavoritos() {
    const abrir = !favoritosAbertos;
    setFavoritosAbertos(abrir);

    if (abrir) {
      setBuscaFavoritos("");
      setLimiteFavoritos(LIMITE_FAVORITOS);

      await carregarFavoritos();
    }
  }

  function formatarData(data?: string) {
    if (!data) return "Não informado";

    const partes = data.split("T")[0].split("-");

    if (partes.length === 3) {
      const meses = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
      ];

      const mes = meses[Number(partes[1]) - 1];

      if (mes) {
        return `${Number(partes[2])} de ${mes} de ${partes[0]}`;
      }

      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return data;
  }

  function iniciarEdicao() {
    setNome(usuario?.nome || "");

    setUsername(usuario?.username || "");

    setDataNascimento(usuario?.data_nascimento?.split("T")[0] || "");

    setEditando(true);
  }

  function cancelarEdicao() {
    setNome(usuario?.nome || "");

    setUsername(usuario?.username || "");

    setDataNascimento(usuario?.data_nascimento?.split("T")[0] || "");

    setEditando(false);
  }

  async function salvarEdicao() {
    if (!usuario?.id_pessoa) {
      alert("Não foi possível identificar a pessoa.");

      return;
    }

    if (!nome.trim()) {
      alert("O nome é obrigatório.");

      return;
    }

    if (!username.trim()) {
      alert("O nome de usuário é obrigatório.");

      return;
    }

    if (dataNascimento && Number.isNaN(Date.parse(dataNascimento))) {
      alert("Informe uma data de nascimento válida.");

      return;
    }

    try {
      setSalvando(true);

      await apiFetch<any>(`/pessoas?id=${usuario.id_pessoa}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          nome: nome.trim(),

          username: username.trim(),

          data_nascimento: dataNascimento || null,
        }),
      });

      setUsuario((anterior) => {
        if (!anterior) return anterior;

        return {
          ...anterior,

          nome: nome.trim(),

          username: username.trim(),

          data_nascimento: dataNascimento,
        };
      });

      setEditando(false);

      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarEmail() {
    const email = novoEmail.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Informe um e-mail válido.");
      return;
    }

    if (contatos.some((contato) => contato.email?.toLowerCase() === email)) {
      alert("Esse e-mail já está cadastrado.");

      return;
    }

    if (!usuario?.id_pessoa) {
      alert("Não foi possível identificar a pessoa.");

      return;
    }

    try {
      setSalvandoEmail(true);

      // POST /contatos

      // Corpo conforme o modelo do seu backend:

      // { email: "isa3\@gmail.com", id_pessoa: 29 }

      await apiFetch<any>("/contatos", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,

          id_pessoa: usuario.id_pessoa,
        }),
      });

      setNovoEmail("");

      setAdicionandoEmail(false);

      await carregarUsuario();

      alert("E-mail cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar e-mail:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar o e-mail.",
      );
    } finally {
      setSalvandoEmail(false);
    }
  }

  async function definirEmailPrincipal(idContato: number) {
    if (!usuario?.id_pessoa || !idContato) {
      alert("ID do contato ou da pessoa inválido.");

      return;
    }

    try {
      setAlterandoPrincipal(true);

      await apiFetch<any>(`/contatos/principal?id=${idContato}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id_pessoa: usuario.id_pessoa,
        }),
      });

      await carregarUsuario();
    } catch (error) {
      console.error("Erro ao alterar e-mail principal:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o e-mail principal.",
      );
    } finally {
      setAlterandoPrincipal(false);
    }
  }

  async function excluirEmail(idContato: number) {
    const contato = contatos.find((item) => item.id_contato === idContato);

    if (!contato) return;

    const principal =
      Number(contato.principal) === 1 || contato.principal === true;

    if (principal) {
      alert("Selecione outro e-mail como principal antes de excluir este.");

      return;
    }

    if (!window.confirm("Deseja excluir este e-mail?")) {
      return;
    }

    try {
      setExcluindoEmail(idContato);

      // DELETE /contatos?id=ID_DO_CONTATO

      await apiFetch<any>(`/contatos?id=${idContato}`, {
        method: "DELETE",
      });

      await carregarUsuario();

      alert("E-mail excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir e-mail:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o e-mail.",
      );
    } finally {
      setExcluindoEmail(null);
    }
  }

  async function escolherAvatar(idAvatar: string) {
    if (!usuario?.id_pessoa) {
      alert("Não foi possível identificar a pessoa.");

      return;
    }

    const imagem = `${PREFIXO_AVATAR}${idAvatar}`;

    try {
      setSalvandoAvatar(true);

      await apiFetch<any>(`/pessoas?id=${usuario.id_pessoa}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ imagem }),
      });

      setUsuario((anterior) => (anterior ? { ...anterior, imagem } : anterior));

      setSeletorAvatarAberto(false);
    } catch (error) {
      console.error("Erro ao salvar avatar:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o avatar.",
      );
    } finally {
      setSalvandoAvatar(false);
    }
  }

  const avatarAtual = obterAvatarId(usuario?.imagem);

  // Busca nos favoritos por nome ou área de atuação
  const termoBuscaFavoritos = normalizar(buscaFavoritos);

  const favoritosFiltrados = termoBuscaFavoritos
    ? listaFavoritos.filter(
        (favorito) =>
          normalizar(favorito.nome).includes(termoBuscaFavoritos) ||
          normalizar(favorito.area).includes(termoBuscaFavoritos),
      )
    : listaFavoritos;

  const favoritosVisiveis = favoritosFiltrados.slice(0, limiteFavoritos);

  const favoritosRestantes = favoritosFiltrados.length - favoritosVisiveis.length;

  const atividades = [
    {
      chave: "likes",
      classe: "metricaLikes",
      titulo: "Curtidos",
      descricao: "Publicações que você curtiu",
      total: likes,
      Icone: Heart,
      aoClicar: () => navigate("/likes"),
    },
    {
      chave: "favoritos",
      classe: "metricaFavoritos",
      titulo: "Favoritos",
      descricao: "Negócios salvos para visitar",
      total: favoritos,
      Icone: Bookmark,
      aoClicar: alternarFavoritos,
    },
    {
      chave: "avaliacoes",
      classe: "metricaAvaliacoes",
      titulo: "Avaliações",
      descricao: "Opiniões que você compartilhou",
      total: avaliacoes,
      Icone: Star,
      aoClicar: () => navigate("/avaliacoes-cliente"),
    },
  ];

  if (loading) {
    return (
      <AppShell ativo="perfil">
        <div className="perfilPessoalLoading">
          <div className="spinner" />

          <span>Carregando perfil...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell ativo="perfil">
    <div className="perfilPessoal">
      <div className="perfilPessoalConteudo">
        <h1 className="tituloPagina">Meu perfil</h1>

        <p className="subtituloPagina">
          Gerencie suas informações e acompanhe suas atividades no TaDaKi.
        </p>

        {/* Cartão azul: foto, nome e botão de editar */}

        <section className="topoPerfilPessoal">
          <div className="avatarWrapper">
            <div
              className="avatarPessoal"
              style={avatarAtual ? { background: fundoDoAvatar(avatarAtual) } : undefined}
            >
              {avatarAtual ? (
                <AvatarBoneco id={avatarAtual} size={92} />
              ) : usuario?.imagem ? (
                <img src={getImageUrl(usuario.imagem)} alt="Foto de perfil" />
              ) : (
                <User size={44} color="#fff" />
              )}
            </div>

            <button
              type="button"
              className="botaoCameraAvatar"
              aria-label="Escolher avatar"
              aria-expanded={seletorAvatarAberto}
              onClick={() => setSeletorAvatarAberto((aberto) => !aberto)}
            >
              <Camera size={13} />
            </button>
          </div>

          <div className="nomePerfilPessoal">
            {editando ? (
              <>
                <label htmlFor="nomePerfil">Nome completo</label>

                <input
                  id="nomePerfil"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite seu nome"
                  maxLength={100}
                />

                <label htmlFor="usernamePerfil">Nome de usuário</label>

                <input
                  id="usernamePerfil"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu nome de usuário"
                  maxLength={50}
                />
              </>
            ) : (
              <>
                <h2>{usuario?.nome || usuario?.username || "Usuário"}</h2>

                <span>@{usuario?.username || "usuario"}</span>
              </>
            )}
          </div>

          {editando ? (
            <div className="botoesEdicaoPessoal">
              <button
                type="button"
                className="botaoEditarPessoal botaoSalvarPessoal"
                onClick={salvarEdicao}
                disabled={salvando}
              >
                <Save size={16} />

                {salvando ? "Salvando..." : "Salvar"}
              </button>

              <button
                type="button"
                className="botaoCancelarEdicao"
                onClick={cancelarEdicao}
                disabled={salvando}
              >
                <X size={16} />
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="botaoEditarPessoal"
              onClick={iniciarEdicao}
            >
              <Pencil size={15} />
              Editar perfil
            </button>
          )}
        </section>

        {/* Escolha de avatar */}

        {seletorAvatarAberto && (
          <section className="seletorAvatar" aria-label="Escolha seu avatar">
            <div className="cabecalhoSeletorAvatar">
              <div>
                <h2>Escolha seu avatar</h2>
                <span>Ele aparece no seu perfil</span>
              </div>

              <button
                type="button"
                onClick={() => setSeletorAvatarAberto(false)}
                aria-label="Fechar escolha de avatar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="gradeAvatares">
              {AVATARES.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`opcaoAvatar ${
                    avatarAtual === avatar.id ? "opcaoAvatarAtiva" : ""
                  }`}
                  aria-pressed={avatarAtual === avatar.id}
                  disabled={salvandoAvatar}
                  onClick={() => escolherAvatar(avatar.id)}
                >
                  <span
                    className="opcaoAvatarImagem"
                    style={{ background: avatar.fundo }}
                  >
                    <AvatarBoneco id={avatar.id} size={92} />
                  </span>

                  <span className="opcaoAvatarNome">{avatar.nome}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Informações pessoais */}

        <section className="informacoesPessoais">
          <h2>Informações pessoais</h2>

          <div className="informacoesLista">
            <div className="informacaoItem">
              <div className="iconeInformacao">
                <Calendar size={20} />
              </div>

              <div className="textoInformacao">
                <span>Data de nascimento</span>

                {editando ? (
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                ) : (
                  <strong>{formatarData(usuario?.data_nascimento)}</strong>
                )}
              </div>
            </div>

            <div className="informacaoItem informacaoEmails">
              <div className="iconeInformacao">
                <Mail size={20} />
              </div>

              <div className="textoInformacao conteudoEmails">
                <span>E-mail</span>

                <strong className="emailPrincipal">
                  {usuario?.email || "Não informado"}
                </strong>

                {editando && (
                  <>
                    <div className="listaEmails">
                      {contatos.map((contato) => {
                        const principal =
                          Number(contato.principal) === 1 ||
                          contato.principal === true;

                        return (
                          <div className="itemEmail" key={contato.id_contato}>
                            <label className="selecaoEmail">
                              <input
                                type="radio"
                                name="emailPrincipal"
                                checked={principal}
                                disabled={alterandoPrincipal}
                                onChange={() => {
                                  if (contato.id_contato) {
                                    definirEmailPrincipal(contato.id_contato);
                                  }
                                }}
                              />

                              <span>{contato.email}</span>
                            </label>

                            <button
                              type="button"
                              className="botaoExcluirEmail"
                              title="Excluir e-mail"
                              disabled={
                                principal ||
                                excluindoEmail === contato.id_contato
                              }
                              onClick={() => {
                                if (contato.id_contato) {
                                  excluirEmail(contato.id_contato);
                                }
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {adicionandoEmail ? (
                      <div className="formAdicionarEmail">
                        <input
                          type="email"
                          value={novoEmail}
                          onChange={(e) => setNovoEmail(e.target.value)}
                          placeholder="Digite o novo e-mail"
                          maxLength={254}
                        />

                        <button
                          type="button"
                          onClick={adicionarEmail}
                          disabled={salvandoEmail}
                        >
                          {salvandoEmail ? "Salvando..." : "Adicionar"}
                        </button>

                        <button
                          type="button"
                          className="botaoCancelarEmail"
                          onClick={() => {
                            setAdicionandoEmail(false);

                            setNovoEmail("");
                          }}
                          disabled={salvandoEmail}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="botaoAdicionarEmail"
                        onClick={() => setAdicionandoEmail(true)}
                      >
                        <Plus size={14} />
                        Adicionar e-mail
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sua atividade */}

        <section className="secaoMetricas">
          <h2 className="tituloMetricas">Sua atividade</h2>

          <div className="metricasPessoal">
            {atividades.map(
              ({ chave, classe, titulo, descricao, total, Icone, aoClicar }) => (
                <button
                  key={chave}
                  type="button"
                  className={`metricaCard ${classe}`}
                  onClick={aoClicar}
                >
                  <div className="iconeMetrica">
                    <Icone size={30} color={VERMELHO} strokeWidth={1.8} />
                  </div>

                  <div className="textoMetrica">
                    <strong>
                      {titulo}

                      {total > 0 && (
                        <em className="contadorMetrica">{total}</em>
                      )}
                    </strong>

                    <span>{descricao}</span>
                  </div>

                  <ChevronRight className="setaMetrica" size={18} />
                </button>
              ),
            )}
          </div>
        </section>

        {favoritosAbertos && (
          <section className="listaFavoritosPerfil">
            <div className="cabecalhoFavoritos">
              <div>
                <h2>Meus favoritos</h2>
                <span>Organizações que você salvou</span>
              </div>
              <button
                type="button"
                onClick={() => setFavoritosAbertos(false)}
                aria-label="Fechar favoritos"
              >
                <X size={18} />
              </button>
            </div>

            {carregandoFavoritos ? (
              <p className="mensagemFavoritos">Carregando favoritos...</p>
            ) : listaFavoritos.length === 0 ? (
              <p className="mensagemFavoritos">
                Você ainda não adicionou organizações aos favoritos.
              </p>
            ) : (
              <>
                <label className="buscaFavoritos">
                  <Search size={18} />

                  <input
                    type="search"
                    value={buscaFavoritos}
                    onChange={(e) => {
                      setBuscaFavoritos(e.target.value);

                      setLimiteFavoritos(LIMITE_FAVORITOS);
                    }}
                    placeholder="Buscar por nome ou área de atuação"
                    aria-label="Buscar nos favoritos por nome ou área de atuação"
                  />

                  {buscaFavoritos && (
                    <button
                      type="button"
                      onClick={() => {
                        setBuscaFavoritos("");

                        setLimiteFavoritos(LIMITE_FAVORITOS);
                      }}
                      aria-label="Limpar busca"
                    >
                      <X size={16} />
                    </button>
                  )}
                </label>

                {termoBuscaFavoritos && favoritosFiltrados.length > 0 && (
                  <p className="resultadoFavoritos" role="status">
                    {favoritosFiltrados.length}{" "}
                    {favoritosFiltrados.length === 1
                      ? "favorito encontrado"
                      : "favoritos encontrados"}
                  </p>
                )}

                {favoritosFiltrados.length === 0 ? (
                  <p className="mensagemFavoritos">
                    Nenhum favorito encontrado para essa busca.
                  </p>
                ) : (
                  <>
                    <div className="gradeFavoritos">
                      {favoritosVisiveis.map((favorito) => (
                        <button
                          type="button"
                          className="itemFavoritoPerfil"
                          key={favorito.id_favorito}
                          onClick={() => {
                            if (favorito.id_pessoa) {
                              navigate(`/perfil/${favorito.id_pessoa}`);
                            }
                          }}
                        >
                          {obterAvatarId(favorito.imagem) ? (
                            <span
                              className="imagemFavoritoPerfil imagemFavoritoAvatar"
                              style={{
                                background: fundoDoAvatar(
                                  obterAvatarId(favorito.imagem) as string,
                                ),
                              }}
                            >
                              <AvatarBoneco
                                id={obterAvatarId(favorito.imagem) as string}
                                size={44}
                              />
                            </span>
                          ) : favorito.imagem ? (
                            <img
                              className="imagemFavoritoPerfil"
                              src={getImageUrl(favorito.imagem)}
                              alt={favorito.nome || "Organização"}
                            />
                          ) : (
                            <div className="imagemFavoritoPerfil imagemFavoritoVazia">
                              <User size={26} />
                            </div>
                          )}
                          <span className="dadosFavoritoPerfil">
                            <strong>{favorito.nome}</strong>

                            {favorito.area ? (
                              <small>{favorito.area}</small>
                            ) : favorito.username ? (
                              <small>@{favorito.username}</small>
                            ) : null}
                          </span>
                          <Star size={18} color={VERMELHO} fill={VERMELHO} />
                        </button>
                      ))}
                    </div>

                    {favoritosRestantes > 0 && (
                      <button
                        type="button"
                        className="maisFavoritos"
                        onClick={() =>
                          setLimiteFavoritos((limite) => limite + LIMITE_FAVORITOS)
                        }
                      >
                        Ver mais favoritos ({favoritosRestantes})
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
    </AppShell>
  );
}