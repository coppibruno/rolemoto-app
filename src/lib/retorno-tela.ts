const CHAVE_ROLAGEM = "rolemoto.retorno.rolagem";
const CHAVE_ESTADO = "rolemoto.retorno.estado";

type MapaRolagem = Record<string, number>;
type MapaEstado = Record<string, unknown>;

const listas = new Map<string, unknown>();

let rolagem: MapaRolagem = {};
let estados: MapaEstado = {};
let hidratado = false;
let rotaAtual = "";
let navegando = false;
let reposicaoPendente = false;
let reposicaoAlvo = 0;
let quadro = 0;
let capturaInstalada = false;

const hidratar = () => {
  if (hidratado || typeof window === "undefined") return;
  hidratado = true;
  try {
    const rolagemSalva = sessionStorage.getItem(CHAVE_ROLAGEM);
    const estadoSalvo = sessionStorage.getItem(CHAVE_ESTADO);
    if (rolagemSalva) rolagem = JSON.parse(rolagemSalva) as MapaRolagem;
    if (estadoSalvo) estados = JSON.parse(estadoSalvo) as MapaEstado;
  } catch {
    rolagem = {};
    estados = {};
  }
};

const persistirRolagem = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CHAVE_ROLAGEM, JSON.stringify(rolagem));
  } catch {
    /* sessionStorage indisponível */
  }
};

const persistirEstado = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(estados));
  } catch {
    /* sessionStorage indisponível */
  }
};

/** O shell rola este painel, não a janela. */
export const painelRolagem = (): HTMLElement | null => {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>("[data-scroll-app]");
};

export const salvarRolagem = (rota: string, scrollTop: number) => {
  if (!rota || !Number.isFinite(scrollTop)) return;
  hidratar();
  rolagem[rota] = scrollTop;
  persistirRolagem();
};

export const lerRolagem = (rota: string): number | null => {
  hidratar();
  if (!Object.prototype.hasOwnProperty.call(rolagem, rota)) return null;
  const valor = rolagem[rota];
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
};

export const salvarEstado = <T>(chave: string, estado: T) => {
  hidratar();
  estados[chave] = estado;
  persistirEstado();
};

export const lerEstado = <T>(chave: string): T | null => {
  hidratar();
  if (!Object.prototype.hasOwnProperty.call(estados, chave)) return null;
  return estados[chave] as T;
};

export const salvarLista = <T>(chave: string, valor: T) => {
  listas.set(chave, valor);
};

export const lerLista = <T>(chave: string): T | null => {
  if (!listas.has(chave)) return null;
  return listas.get(chave) as T;
};

export const definirRotaAtual = (rota: string) => {
  rotaAtual = rota;
};

export const reposicaoEmAndamento = () => navegando || reposicaoPendente;

const gravarPainelAtual = () => {
  if (!rotaAtual || navegando) return;
  const el = painelRolagem();
  if (!el) return;
  salvarRolagem(rotaAtual, el.scrollTop);
};

const marcarTrocaDeRota = (antes: string) => {
  if (window.location.pathname !== antes) navegando = true;
};

/** Grava a rolagem antes do React trocar a página. */
export const instalarCapturaRolagem = () => {
  if (capturaInstalada || typeof window === "undefined") return;
  capturaInstalada = true;

  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);

  history.pushState = (...args: Parameters<History["pushState"]>) => {
    const antes = window.location.pathname;
    gravarPainelAtual();
    push(...args);
    marcarTrocaDeRota(antes);
  };

  history.replaceState = (...args: Parameters<History["replaceState"]>) => {
    const antes = window.location.pathname;
    gravarPainelAtual();
    replace(...args);
    marcarTrocaDeRota(antes);
  };

  window.addEventListener("popstate", () => {
    const antes = rotaAtual;
    gravarPainelAtual();
    if (window.location.pathname !== antes) navegando = true;
  });
};

export const concluirNavegacao = () => {
  navegando = false;
};

const encerrarReposicao = (scrollTop: number) => {
  reposicaoPendente = false;
  if (rotaAtual) salvarRolagem(rotaAtual, scrollTop);
};

export const reposicionarRolagem = () => {
  if (!reposicaoPendente) return;
  const el = painelRolagem();
  if (!el) return;
  el.scrollTop = reposicaoAlvo;
  if (el.scrollTop >= reposicaoAlvo - 1) encerrarReposicao(el.scrollTop);
};

const loopReposicao = (restantes: number) => {
  quadro = window.requestAnimationFrame(() => {
    reposicionarRolagem();
    if (reposicaoPendente && restantes > 0) loopReposicao(restantes - 1);
  });
};

export const iniciarReposicao = (alvo: number) => {
  window.cancelAnimationFrame(quadro);
  reposicaoAlvo = alvo;
  const el = painelRolagem();
  if (alvo <= 0) {
    reposicaoPendente = false;
    if (el) el.scrollTop = 0;
    return;
  }
  reposicaoPendente = true;
  if (el) el.scrollTop = alvo;
  if (el && el.scrollTop >= alvo - 1) {
    reposicaoPendente = false;
    return;
  }
  loopReposicao(40);
};

export const cancelarReposicao = () => {
  reposicaoPendente = false;
  window.cancelAnimationFrame(quadro);
};
