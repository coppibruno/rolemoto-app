export type ItemMenuConfig = {
  href: "/" | "/aprovacoes" | "/criar-role" | "/perfil";
  label: string;
  icone: "two_wheeler" | "how_to_reg" | "add" | "account_circle";
  ariaLabel: string;
  tipo: "lateral" | "fab";
};

export const ITENS_MENU: readonly [
  ItemMenuConfig,
  ItemMenuConfig,
  ItemMenuConfig,
  ItemMenuConfig,
] = [
  {
    href: "/",
    label: "Rolês",
    icone: "two_wheeler",
    ariaLabel: "Listagem de rolês",
    tipo: "lateral",
  },
  {
    href: "/aprovacoes",
    label: "Fila",
    icone: "how_to_reg",
    ariaLabel: "Aprovações de comboio",
    tipo: "lateral",
  },
  {
    href: "/criar-role",
    label: "Incluir",
    icone: "add",
    ariaLabel: "Incluir rolê",
    tipo: "fab",
  },
  {
    href: "/perfil",
    label: "Perfil",
    icone: "account_circle",
    ariaLabel: "Editar perfil",
    tipo: "lateral",
  },
];
