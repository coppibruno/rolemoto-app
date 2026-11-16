export type ItemMenuConfig = {
  href: "/" | "/explorar" | "/meus-roles" | "/criar-role" | "/perfil";
  label: string;
  icone: "home" | "explore" | "sports_score" | "add" | "account_circle";
  ariaLabel: string;
  tipo: "lateral" | "fab";
};

export const ITENS_MENU: readonly [
  ItemMenuConfig,
  ItemMenuConfig,
  ItemMenuConfig,
  ItemMenuConfig,
  ItemMenuConfig,
] = [
  {
    href: "/",
    label: "Início",
    icone: "home",
    ariaLabel: "Início, feed dos amigos",
    tipo: "lateral",
  },
  {
    href: "/explorar",
    label: "Explorar",
    icone: "explore",
    ariaLabel: "Explorar rolês, eventos e locais",
    tipo: "lateral",
  },
  {
    href: "/criar-role",
    label: "Incluir",
    icone: "add",
    ariaLabel: "Incluir",
    tipo: "fab",
  },
  {
    href: "/meus-roles",
    label: "Meus Rolês",
    icone: "sports_score",
    ariaLabel: "Meus rolês",
    tipo: "lateral",
  },
  {
    href: "/perfil",
    label: "Perfil",
    icone: "account_circle",
    ariaLabel: "Editar perfil",
    tipo: "lateral",
  },
];
