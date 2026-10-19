import React, { useEffect, useState } from "react";

import {
  Star,
  User,
  Pencil,
  Heart,
  Calendar,
  AtSign,
  Save,
  X,
  Plus,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { apiFetch, getImageUrl } from "../services/api";

import "../css/PerfilPessoal.css";

const VERMELHO = "#8E0808";

interface Usuario {
  id_pessoa_login?: number;

  id_pessoa?: number;

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
    const idCliente = Number(
      usuarioAtual?.id_pessoa_login ?? usuarioAtual?.id_pessoa,
    );

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

      const favoritosRecebidos: Favorito[] = Array.isArray(
        respostaFavoritos?.favoritos,
      )
        ? respostaFavoritos.favoritos
        : Array.isArray(respostaFavoritos?.resultadoSelecionaTodos)
          ? respostaFavoritos.resultadoSelecionaTodos
          : [];

      // Atualiza a quantidade assim que a API retornar.
      setFavoritos(favoritosRecebidos.length);

      if (favoritosRecebidos.length === 0) {
        setListaFavoritos([]);
        return;
      }

      const respostaOrganizacoes = await apiFetch<any>(
        "/pessoas?tipo=ORGANIZACAO",
      );

      const organizacoes = Array.isArray(respostaOrganizacoes?.funcionarios)
        ? respostaOrganizacoes.funcionarios
        : Array.isArray(respostaOrganizacoes?.pessoas)
          ? respostaOrganizacoes.pessoas
          : Array.isArray(respostaOrganizacoes)
            ? respostaOrganizacoes
            : [];

      const favoritosComDados: Favorito[] = favoritosRecebidos.map(
        (favorito) => {
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
            imagem: organizacao?.imagem || "",
            id_pessoa: organizacao?.id_pessoa,
          };
        },
      );

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
      await carregarFavoritos();
    }
  }

  function formatarData(data?: string) {
    if (!data) return "Não informado";

    const partes = data.split("T")[0].split("-");

    if (partes.length === 3) {
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

  if (loading) {
    return (
      <div className="perfilPessoalLoading">
        <div className="spinner" />

        <span>Carregando perfil...</span>
      </div>
    );
  }

  return (
    <div className="perfilPessoal">
      <div className="perfilPessoalConteudo">

        <section className="cardPerfilPessoal">
          <div className="detalheVermelho" />

          <div className="topoPerfilPessoal">
            <div className="avatarPessoal">
              {usuario?.imagem ? (
                <img src={getImageUrl(usuario.imagem)} alt="Foto de perfil" />
              ) : (
                <User size={55} color="#fff" />
              )}
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
                  <h1>{usuario?.nome || usuario?.username || "Usuário"}</h1>

                  <span>@{usuario?.username || "usuario"}</span>
                </>
              )}
            </div>

            {editando ? (
              <div className="botoesEdicaoPessoal">
                <button
                  type="button"
                  className="botaoEditarPessoal"
                  onClick={salvarEdicao}
                  disabled={salvando}
                >
                  <Save size={20} />

                  {salvando ? "Salvando..." : "Salvar"}
                </button>

                <button
                  type="button"
                  className="botaoCancelarEdicao"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  <X size={20} />
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="botaoEditarPessoal"
                onClick={iniciarEdicao}
              >
                <Pencil size={20} />
                Editar perfil
              </button>
            )}
          </div>

          <div className="informacoesPessoais">
            <h2>Informações pessoais</h2>

            <div className="informacoesGrid">
              <div className="informacaoItem">
                <div className="iconeInformacao">
                  <Calendar size={22} color={VERMELHO} />
                </div>

                <div>
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
                  <AtSign size={22} color={VERMELHO} />
                </div>

                <div className="conteudoEmails">
                  <span>E-mail principal</span>

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
          </div>
        </section>

        <section className="secaoMetricas">
          <div className="tituloMetricas">
            <h2>Minha atividade</h2>

            <span>Acesse suas atividades</span>
          </div>

          <div className="metricasPessoal">
            <button
              type="button"
              className="metricaCard metricaLikes"
              onClick={() => navigate("/likes")}
            >
              <div className="iconeMetrica">
                <Heart size={27} color={VERMELHO} fill={VERMELHO} />
              </div>

              <div className="textoMetrica">
                <strong>{likes}</strong>

                <span>Curtidas</span>
              </div>

              <span className="setaMetrica">→</span>
            </button>

            <button
              type="button"
              className="metricaCard metricaFavoritos"
              onClick={alternarFavoritos}
            >
              <div className="iconeMetrica">
                <Star size={27} color="#6685A8" fill="#6685A8" />
              </div>

              <div className="textoMetrica">
                <strong>{favoritos}</strong>

                <span>Favoritos</span>
              </div>

              <span className="setaMetrica">→</span>
            </button>

            <button
              type="button"
              className="metricaCard metricaAvaliacoes"
              onClick={() => navigate("/avaliacoes-cliente")}
            >
              <div className="iconeMetrica">
                <User size={27} color="#666" />
              </div>

              <div className="textoMetrica">
                <strong>{avaliacoes}</strong>

                <span>Avaliações</span>
              </div>

              <span className="setaMetrica">→</span>
            </button>
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
              <div className="gradeFavoritos">
                {listaFavoritos.map((favorito) => (
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
                    {favorito.imagem ? (
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
                      {favorito.username && <small>@{favorito.username}</small>}
                    </span>
                    <Heart size={18} color={VERMELHO} fill={VERMELHO} />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}