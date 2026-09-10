import type { RitmoRole } from "@/types/role";

export type LocalizacaoForm = {
  endereco: string;
  lat: number | null;
  lng: number | null;
};

export type ErrosCriarRole = {
  titulo?: string;
  partida?: string;
  destino?: string;
  dataHora?: string;
  ritmo?: string;
  foto?: string;
  descricao?: string;
};

export type GpsStatus = "idle" | "buscando" | "fixado" | "erro";

export type TipoErroModelo = "proibido" | "nao-encontrado" | "rede";

export type ErroModelo = {
  tipo: TipoErroModelo;
  mensagem: string;
};

export type { RitmoRole };
