import { WebPlugin } from "@capacitor/core";
import type { PontoGps } from "./calcular-metricas";
import type { TelemetriaBufferPlugin } from "./telemetria-buffer";

export class TelemetriaBufferWeb
  extends WebPlugin
  implements TelemetriaBufferPlugin
{
  iniciar = async (): Promise<void> => undefined;
  garantir = async (): Promise<void> => undefined;
  parar = async (): Promise<void> => undefined;
  listar = async (): Promise<{ pontos: PontoGps[] }> => ({ pontos: [] });
  limpar = async (): Promise<void> => undefined;
}
