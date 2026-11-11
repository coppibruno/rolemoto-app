import type { AmostraConquista, ConquistaConcedida } from "./conquista";

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
  /** Encoded polyline (precisão 5); vazio em passeios antigos. Só no detalhe. */
  tracado?: string;
  /** Ausente em docs antigos → lido como true. */
  publica: boolean;
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
  tracado?: string;
  publica?: boolean;
  /** Recorte dos pinos cruzados, cortado no `stop()` nativo (SPEC 056). */
  amostras?: AmostraConquista[];
};

/** 201 do `POST /telemetria`: o passeio e os carimbos novos ou recordes. */
export type RoleTelemetriaCriada = RoleTelemetria & {
  conquistas?: ConquistaConcedida[];
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

/** Estado local da sessão (plugin / adapter) — não vai inteiro à API. */
export type SessaoTelemetriaLocal = {
  sessaoId: string;
  iniciadoEm: string;
  distanciaKm: number;
  velocidadeMaxKmh: number;
  somaVelocidadesKmh: number;
  quantidadeVelocidades: number;
  primeiro: {lat: number; lng: number; t: number} | null;
  ultimo: {lat: number; lng: number; t: number} | null;
  tempoMovimentoSegundos: number;
};
