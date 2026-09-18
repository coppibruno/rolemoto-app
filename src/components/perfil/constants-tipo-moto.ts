import type { TipoMoto } from "@/types/user";

export type OpcaoTipoMoto = {
  valor: TipoMoto;
  icone: string;
  label: string;
};

export const OPCOES_TIPO_MOTO: OpcaoTipoMoto[] = [
  { valor: "trail", icone: "terrain", label: "Trail" },
  { valor: "speed", icone: "speed", label: "Speed" },
  { valor: "custom", icone: "build", label: "Custom" },
];

export const LABEL_TIPO_MOTO_BADGE: Record<TipoMoto, string> = {
  trail: "TRAIL",
  speed: "SPEED",
  custom: "CUSTOM",
};

export const LABEL_PILOTAGEM: Record<
  "agressiva" | "moderada" | "tranquila",
  string
> = {
  agressiva: "Agressiva",
  moderada: "Moderada",
  tranquila: "Tranquila",
};
