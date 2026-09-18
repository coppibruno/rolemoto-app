export type ItemMenuIncluirConfig = {
  id: "role" | "evento" | "local";
  href: string | null;
  icone: string;
  titulo: string;
  subtitulo: string;
  emBreve?: boolean;
};

export const ITENS_MENU_INCLUIR: ItemMenuIncluirConfig[] = [
  {
    id: "role",
    href: "/criar-role",
    icone: "two_wheeler",
    titulo: "Rolê",
    subtitulo: "Comboio com partida e rota",
  },
  {
    id: "evento",
    href: "/criar-evento",
    icone: "flag",
    titulo: "Evento",
    subtitulo: "Encontro no destino fixo",
  },
  {
    id: "local",
    href: "/criar-local",
    icone: "location_on",
    titulo: "Local",
    subtitulo: "Pontos cadastrados",
  },
];
