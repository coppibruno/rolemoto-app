export type SeloId =
  | "primeira_parada"
  | "postos_da_estrada"
  | "moto_point"
  | "cacador_de_vista"
  | "parada_de_fome"
  | "oficina_confianca"
  | "rodou_o_mapa";

export type SeloPublico = {
  id: SeloId;
  label: string;
};
