import type { AcessoEvento, AtracaoEvento, TipoEvento } from "@/types/evento";

export type LocalizacaoForm = {
  endereco: string;
  lat: number | null;
  lng: number | null;
  nome: string;
};

export type ErrosCriarEvento = {
  titulo?: string;
  tipo?: string;
  local?: string;
  dataEvento?: string;
  horaAbertura?: string;
  horaEncerramento?: string;
  acesso?: string;
  linkIngresso?: string;
  foto?: string;
  informacoes?: string;
};

export type GpsStatus = "idle" | "buscando" | "fixado" | "erro";

export type { AcessoEvento, AtracaoEvento, TipoEvento };
