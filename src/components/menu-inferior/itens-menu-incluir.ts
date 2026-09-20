export type ItemMenuIncluirConfig = {
  id: "role" | "evento" | "local" | "telemetria";
  href: string | null;
  icone: string;
  titulo: string;
  subtitulo: string;
  emBreve?: boolean;
  soAdmin?: boolean;
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
    id: "telemetria",
    href: "/gravar-role",
    icone: "speed",
    titulo: "Gravar meu rolê",
    subtitulo: "Telemetria GPS do seu passeio",
  },
  {
    id: "evento",
    href: "/criar-evento",
    icone: "flag",
    titulo: "Evento",
    subtitulo: "Encontro no destino fixo",
    soAdmin: true,
  },
  {
    id: "local",
    href: "/criar-local",
    icone: "location_on",
    titulo: "Local",
    subtitulo: "Pontos cadastrados",
    soAdmin: true,
  },
];

export const itensMenuIncluirPara = (
  admin: boolean,
): ItemMenuIncluirConfig[] =>
  ITENS_MENU_INCLUIR.filter((item) => admin || !item.soAdmin);
