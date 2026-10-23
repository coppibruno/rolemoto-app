export type TipoHistoricoOculto = "role" | "evento";

export type HistoricoOculto = {
  id: string;
  usuarioId: string;
  tipo: TipoHistoricoOculto;
  alvoId: string;
  createdAt: string;
};

export type HistoricoOcultoCreate = {
  usuarioId: string;
  tipo: TipoHistoricoOculto;
  alvoId: string;
};
