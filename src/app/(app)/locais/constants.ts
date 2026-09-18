import type { CategoriaLocal, FacilidadeLocal } from "@/types/local";

export type OpcaoCategoria = {
  valor: CategoriaLocal;
  label: string;
  icone: string;
};

export const OPCOES_CATEGORIA: OpcaoCategoria[] = [
  { valor: "posto", label: "Posto", icone: "local_gas_station" },
  { valor: "bar_moto_point", label: "Bar & Moto Point", icone: "sports_bar" },
  {
    valor: "restaurante_estrada",
    label: "Restaurante Estrada",
    icone: "restaurant",
  },
  { valor: "oficina", label: "Oficina", icone: "build" },
  { valor: "mirante", label: "Mirante", icone: "landscape" },
];

export type OpcaoFacilidade = {
  valor: FacilidadeLocal;
  label: string;
  icone: string;
};

export const OPCOES_FACILIDADES: OpcaoFacilidade[] = [
  {
    valor: "patio_amplo_50",
    label: "Pátio Amplo para 50+ Motos",
    icone: "two_wheeler",
  },
  {
    valor: "calibrador_alta_pressao",
    label: "Calibrador de Alta Pressão Grátis",
    icone: "tire_repair",
  },
  { valor: "banheiros_limpos", label: "Banheiros Limpos", icone: "shower" },
  {
    valor: "conveniencia_cafe",
    label: "Loja de Conveniência / Café Expresso",
    icone: "local_cafe",
  },
  { valor: "wifi_aberto", label: "Wi-Fi Aberto", icone: "wifi" },
  {
    valor: "cameras_24h",
    label: "Câmeras de Monitoramento 24h",
    icone: "videocam",
  },
];
