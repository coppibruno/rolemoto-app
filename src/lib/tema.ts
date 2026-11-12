export type Tema = "claro" | "escuro";

export const CHAVE_TEMA = "rolemoto-tema";
export const TEMA_PADRAO: Tema = "escuro";

const COR_BARRA: Record<Tema, string> = {
  claro: "#f7f4f1",
  escuro: "#121316",
};

export const ehTema = (valor: string | null): valor is Tema =>
  valor === "claro" || valor === "escuro";

/** Escolha explícita do piloto. `null` enquanto ele não tiver trocado o tema no app. */
export const preferenciaSalva = (): Tema | null => {
  if (typeof window === "undefined") return null;
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    return ehTema(salvo) ? salvo : null;
  } catch {
    return null;
  }
};

export const temaDoSistema = (): Tema => {
  if (typeof window === "undefined") return TEMA_PADRAO;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "claro"
    : TEMA_PADRAO;
};

/** Preferência salva, ou o claro/escuro do aparelho quando ainda não houve escolha. */
export const resolverTema = (): Tema => preferenciaSalva() ?? temaDoSistema();

export const aplicarTema = (tema: Tema) => {
  document.documentElement.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", COR_BARRA[tema]);
};

/** Roda antes da hidratação para o primeiro frame já sair no tema certo. */
export const scriptTema = `(function(){try{var t=localStorage.getItem("${CHAVE_TEMA}");if(t!=="claro"&&t!=="escuro"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"claro":"${TEMA_PADRAO}";}document.documentElement.dataset.tema=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="claro"?"${COR_BARRA.claro}":"${COR_BARRA.escuro}");}catch(e){}})();`;
