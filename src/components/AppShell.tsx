import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";

import {
  Accessibility,
  BarChart3,
  Heart,
  HelpCircle,
  Home,
  Info,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useNavigate } from "react-router-dom";

import logo from "../assets/Logo.png";

import { useAuth } from "../hooks/useAuth";

import { userType } from "../../src/components/feed/model";

import "../css/AppShell.css";

export type ItemMenu =
  | "inicio"
  | "curtidas"
  | "perfil"
  | "dashboard"
  | "sobre"
  | "ajuda";

interface ItemDoMenu {
  id: ItemMenu;
  rotulo: string;
  Icone: LucideIcon;
  aoClicar: () => void;
}

export interface Sugestao {
  id: string;
  rotulo: string;
  detalhe?: string;
  aoEscolher: () => void;
}

interface Props {
  /** Item do menu que aparece marcado */
  ativo?: ItemMenu;
  children: ReactNode;

  /** Opções que se abrem abaixo da busca enquanto a pessoa digita */
  sugestoes?: Sugestao[];

  /** Busca controlada pela tela (ex.: o feed filtra as publicações). */
  busca?: string;
  aoMudarBusca?: (valor: string) => void;

  /** O que fazer ao clicar na logo (padrão: ir para "/") */
  aoClicarLogo?: () => void;

  /** O que fazer ao clicar em "Meu perfil" (padrão: "/perfil-pessoal") */
  aoAbrirPerfil?: () => void;

  /** Mostra "Dashboard" no menu (padrão: só para contas de organização) */
  mostrarDashboard?: boolean;

  /** Botão extra no cabeçalho, ao lado de Acessibilidade */
  acaoCabecalho?: ReactNode;

  /** Bloqueia cabeçalho e menu enquanto um modal está aberto */
  bloqueado?: boolean;
}

/**
 * Cabeçalho + menu lateral do TaDaKi.
 * Use em volta do conteúdo de qualquer tela interna.
 */
export function AppShell({
  ativo,
  children,
  sugestoes,
  busca,
  aoMudarBusca,
  aoClicarLogo,
  aoAbrirPerfil,
  mostrarDashboard,
  acaoCabecalho,
  bloqueado = false,
}: Props) {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  // Menu certo para cada tipo de conta, em qualquer tela que use o shell
  const tipoConta = userType(user);

  const exibirDashboard = mostrarDashboard ?? tipoConta === "ORGANIZACAO";

  function abrirPerfil() {
    if (aoAbrirPerfil) {
      aoAbrirPerfil();

      return;
    }

    if (tipoConta === "ORGANIZACAO") {
      const id = Number(user?.id_pessoa ?? user?.id_pessoa_login);

      if (Number.isSafeInteger(id) && id > 0) {
        navigate(`/perfil/${id}`);

        return;
      }
    }

    navigate("/perfil-pessoal");
  }

  const buscaControlada = aoMudarBusca !== undefined;

  const [buscaLocal, setBuscaLocal] = useState("");

  const valorBusca = buscaControlada ? (busca ?? "") : buscaLocal;

  // Sugestões da busca (dropdown em leque)
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const [indiceSugestao, setIndiceSugestao] = useState(-1);
  const buscaRef = useRef<HTMLFormElement>(null);

  const listaSugestoes = sugestoes ?? [];
  const mostrarSugestoes =
    sugestoesAbertas &&
    valorBusca.trim().length > 0 &&
    listaSugestoes.length > 0;

  // Fecha ao clicar fora
  useEffect(() => {
    function fora(e: MouseEvent) {
      if (!buscaRef.current?.contains(e.target as Node)) {
        setSugestoesAbertas(false);
      }
    }

    document.addEventListener("mousedown", fora);

    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function escolherSugestao(s: Sugestao) {
    setSugestoesAbertas(false);
    setIndiceSugestao(-1);
    s.aoEscolher();
  }

  function teclado(e: KeyboardEvent<HTMLInputElement>) {
    if (!mostrarSugestoes) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceSugestao((i) => (i + 1) % listaSugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceSugestao((i) => (i <= 0 ? listaSugestoes.length - 1 : i - 1));
    } else if (e.key === "Enter" && indiceSugestao >= 0) {
      e.preventDefault();
      escolherSugestao(listaSugestoes[indiceSugestao]);
    } else if (e.key === "Escape") {
      setSugestoesAbertas(false);
    }
  }

  const [saindo, setSaindo] = useState(false);

  // Acessibilidade — mesmas chaves de antes, então a escolha vale em todas as telas
  const [acessibilidadeAberta, setAcessibilidadeAberta] = useState(false);

  const [fonte, setFonte] = useState(() =>
    Number(localStorage.getItem("tadaki-font-scale") || "100"),
  );

  const [altoContraste, setAltoContraste] = useState(
    () => localStorage.getItem("tadaki-high-contrast") === "true",
  );

  const [reduzirAnimacoes, setReduzirAnimacoes] = useState(
    () => localStorage.getItem("tadaki-reduce-motion") === "true",
  );

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--tadaki-access-font-scale",
      String(fonte / 100),
    );

    document.documentElement.classList.toggle(
      "tadaki-high-contrast",
      altoContraste,
    );

    document.documentElement.classList.toggle(
      "tadaki-reduce-motion",
      reduzirAnimacoes,
    );

    localStorage.setItem("tadaki-font-scale", String(fonte));

    localStorage.setItem("tadaki-high-contrast", String(altoContraste));

    localStorage.setItem("tadaki-reduce-motion", String(reduzirAnimacoes));

    return () => {
      document.documentElement.classList.remove(
        "tadaki-high-contrast",
        "tadaki-reduce-motion",
      );

      document.documentElement.style.removeProperty(
        "--tadaki-access-font-scale",
      );
    };
  }, [fonte, altoContraste, reduzirAnimacoes]);

  function pesquisar(evento: FormEvent) {
    evento.preventDefault();

    // Quando a tela controla a busca (feed), o filtro já acontece ao digitar.
    if (buscaControlada) return;

    const termo = valorBusca.trim();

    // O feed lê o termo em ?q=
    navigate(termo ? `/?q=${encodeURIComponent(termo)}` : "/");
  }

  async function sair() {
    if (!window.confirm("Deseja realmente sair da sua conta?")) return;

    setSaindo(true);

    try {
      await logout();

      navigate("/login", { replace: true });
    } finally {
      setSaindo(false);
    }
  }

  const menuPrincipal: ItemDoMenu[] = [
    {
      id: "inicio",
      rotulo: "Início",
      Icone: Home,
      aoClicar: () => navigate("/"),
    },
    {
      id: "curtidas",
      rotulo: "Minhas curtidas",
      Icone: Heart,
      aoClicar: () => navigate("/likes"),
    },
    {
      id: "perfil",
      rotulo: "Meu perfil",
      Icone: UserRound,
      aoClicar: abrirPerfil,
    },
    ...(exibirDashboard
      ? [
          {
            id: "dashboard" as const,
            rotulo: "Dashboard",
            Icone: BarChart3,
            aoClicar: () => navigate("/dashboard"),
          },
        ]
      : []),
  ];

  const menuSecundario: ItemDoMenu[] = [
    {
      id: "sobre",
      rotulo: "Sobre o TaDaKi",
      Icone: Info,
      aoClicar: () => navigate("/sobre"),
    },
    {
      id: "ajuda",
      rotulo: "Ajuda",
      Icone: HelpCircle,
      aoClicar: () => navigate("/ajuda"),
    },
  ];

  function renderizarItens(itens: ItemDoMenu[]) {
    return itens.map(({ id, rotulo, Icone, aoClicar }) => (
      <button
        key={id}
        type="button"
        className={ativo === id ? "ativo" : ""}
        aria-current={ativo === id ? "page" : undefined}
        onClick={aoClicar}
      >
        <Icone size={20} />

        {rotulo}
      </button>
    ));
  }

  return (
    <div className="appShell" inert={bloqueado}>
      <a className="shellPularConteudo" href="#conteudoPrincipal">
        Pular para o conteúdo
      </a>

      <header className="shellCabecalho">
        <button
          type="button"
          className="shellLogo"
          onClick={aoClicarLogo ?? (() => navigate("/"))}
          aria-label="Página inicial"
        >
          <img src={logo} alt="TaDaKi" />
        </button>

        <form
          className="shellBusca"
          role="search"
          onSubmit={pesquisar}
          ref={buscaRef}
        >
          <Search size={19} />

          <input
            aria-label="Buscar negócios e serviços"
            placeholder="Buscar negócios e serviços"
            role="combobox"
            aria-expanded={mostrarSugestoes}
            aria-controls="shellSugestoes"
            aria-autocomplete="list"
            autoComplete="off"
            value={valorBusca}
            onFocus={() => setSugestoesAbertas(true)}
            onKeyDown={teclado}
            onChange={(e) => {
              setSugestoesAbertas(true);
              setIndiceSugestao(-1);

              if (buscaControlada) aoMudarBusca?.(e.target.value);
              else setBuscaLocal(e.target.value);
            }}
          />

          {mostrarSugestoes && (
            <ul id="shellSugestoes" className="shellSugestoes" role="listbox">
              {listaSugestoes.map((s, i) => (
                <li
                  key={s.id}
                  role="presentation"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === indiceSugestao}
                    className={i === indiceSugestao ? "ativa" : ""}
                    onMouseEnter={() => setIndiceSugestao(i)}
                    onClick={() => escolherSugestao(s)}
                  >
                    <span>{s.rotulo}</span>

                    {s.detalhe && <small>{s.detalhe}</small>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="shellAcoes">
          {acaoCabecalho}

          <div className="shellAcessibilidade">
            <button
              type="button"
              className="shellBotaoAcessibilidade"
              onClick={() => setAcessibilidadeAberta((aberto) => !aberto)}
              aria-label="Abrir opções de acessibilidade"
              aria-expanded={acessibilidadeAberta}
              aria-controls="shellPainelAcessibilidade"
            >
              <Accessibility size={22} />

              <span>Acessibilidade</span>
            </button>

            {acessibilidadeAberta && (
              <section
                id="shellPainelAcessibilidade"
                className="shellPainelAcessibilidade"
                aria-label="Opções de acessibilidade"
              >
                <div className="shellPainelTitulo">
                  <strong>Acessibilidade</strong>

                  <button
                    type="button"
                    onClick={() => setAcessibilidadeAberta(false)}
                    aria-label="Fechar painel de acessibilidade"
                  >
                    ×
                  </button>
                </div>

                <p>Ajuste a leitura do TaDaKi.</p>

                <div className="shellPainelLinha">
                  <span>Tamanho do texto: {fonte}%</span>

                  <div className="shellPainelFonte">
                    <button
                      type="button"
                      aria-label="Diminuir tamanho do texto"
                      disabled={fonte <= 100}
                      onClick={() => setFonte((v) => Math.max(100, v - 10))}
                    >
                      A−
                    </button>

                    <button
                      type="button"
                      aria-label="Aumentar tamanho do texto"
                      disabled={fonte >= 150}
                      onClick={() => setFonte((v) => Math.min(150, v + 10))}
                    >
                      A+
                    </button>
                  </div>
                </div>

                <label className="shellPainelLinha">
                  <span>Alto contraste</span>

                  <input
                    type="checkbox"
                    checked={altoContraste}
                    onChange={(e) => setAltoContraste(e.target.checked)}
                  />
                </label>

                <label className="shellPainelLinha">
                  <span>Reduzir animações</span>

                  <input
                    type="checkbox"
                    checked={reduzirAnimacoes}
                    onChange={(e) => setReduzirAnimacoes(e.target.checked)}
                  />
                </label>

                <button
                  type="button"
                  className="shellPainelRestaurar"
                  onClick={() => {
                    setFonte(100);
                    setAltoContraste(false);
                    setReduzirAnimacoes(false);
                  }}
                >
                  Restaurar padrão
                </button>
              </section>
            )}
          </div>
        </div>
      </header>

      <div className="shellCorpo">
        <nav className="shellMenu" aria-label="Menu principal">
          {renderizarItens(menuPrincipal)}

          <hr />

          {renderizarItens(menuSecundario)}

          <hr />

          <button
            type="button"
            className="shellSair"
            disabled={saindo}
            onClick={() => void sair()}
          >
            <LogOut size={20} />

            {saindo ? "Saindo..." : "Sair da conta"}
          </button>
        </nav>

        <main className="shellConteudo" id="conteudoPrincipal" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}