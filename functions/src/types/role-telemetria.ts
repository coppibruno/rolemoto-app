import type {MedalhaPublica, MedalhaTelemetria} from "./conquista";

export type PontoTelemetria = {
  lat: number;
  lng: number;
  nome: string;
  endereco: string;
};

export type RoleTelemetria = {
  id: string;
  usuarioId: string;
  titulo: string;
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
  iniciadoEm: string;
  encerradoEm: string;
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
  /** Encoded polyline (precisão 5); "" em passeios antigos. Só no detalhe. */
  tracado?: string;
  /**
   * Velocidades (décimos de km/h, delta-encoded) alinhadas aos vértices do
   * `tracado`. Ausente/`""` em passeios antigos. Só no detalhe.
   */
  tracadoVelocidades?: string;
  /** Ausente em docs antigos → lido como true. */
  publica: boolean;
  /** Só no detalhe. Ausente em docs antigos → `[]`. Sem velocidade para quem não é o dono. */
  medalhas?: (MedalhaTelemetria | MedalhaPublica)[];
  /** Só no detalhe. 0..4 URLs de `telemetria/{uid}/`. Ausente → `[]`. */
  fotosUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

export type RoleTelemetriaCreate = {
  titulo: string;
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
  iniciadoEm: string;
  encerradoEm: string;
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
  tracado: string;
  /** Paralelo ao `tracado`; `""` se sem caminho ou passeio antigo. */
  tracadoVelocidades: string;
  publica: boolean;
  fotosUrls: string[];
};

/** `PATCH /telemetria/:id` — só o que veio no body. */
export type RoleTelemetriaPatch = {
  publica?: boolean;
  fotosUrls?: string[];
};

export type RoleTelemetriaNovo = RoleTelemetriaCreate & {
  usuarioId: string;
};

export type ItemHistoricoTelemetria = {
  id: string;
  tipo: "telemetria";
  titulo: string;
  distanciaKm: number;
  tempoSegundos: number;
  encerradoEm: string;
  publica: boolean;
};
