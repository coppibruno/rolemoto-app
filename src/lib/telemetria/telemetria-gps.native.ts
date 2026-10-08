import { BackgroundGeolocation } from "@capgo/background-geolocation";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type {
  RoleTelemetriaCreate,
  SessaoTelemetriaLocal,
} from "@/types/role-telemetria";
import { auth, functionsApiUrl } from "@/lib/firebase";
import { tituloPadraoTelemetria } from "./formatar-telemetria";
import {
  aplicarPonto,
  arredondarParaPost,
  estadoCalculoInicial,
  tempoParedeSegundos,
  velocidadeMediaKmh,
  type EstadoCalculo,
} from "./calcular-metricas";
import { incorporarBuffer, mesclarComRemoto } from "./aplicar-buffer";
import type { PontoGps } from "./calcular-metricas";
import { telemetriaBuffer } from "./telemetria-buffer";
import { gerarTracado } from "./tracado";
import {
  TelemetriaGpsErro,
  type ResultadoStopTelemetria,
  type ResumoTelemetriaPendente,
  type TelemetriaGpsAdapter,
} from "./telemetria-gps.adapter";

const KEY_SESSAO = "rolemoto.telemetria.sessao";
const KEY_RESUMO = "rolemoto.telemetria.resumo";
const HEADER_SESSAO = "X-Rolemoto-Sessao-Token";
const TIMEOUT_SESSAO_MS = 5_000;

type SessaoRemota = {
  id: string;
  token: string;
  iniciadoEm: string;
};

type SessaoPersistida = SessaoTelemetriaLocal & {
  ativa: boolean;
  paradoDesde: number | null;
  velocidadeAtualKmh: number;
  velocidadesRecentesKmh?: number[];
  remota?: SessaoRemota | null;
};

type AgregadosRemotos = {
  distanciaKm: number;
  velocidadeMaxKmh: number;
  velocidadeAtualKmh: number;
  somaVelocidadesKmh: number;
  quantidadeVelocidades: number;
  tempoMovimentoSegundos: number;
  primeiro: SessaoTelemetriaLocal["primeiro"];
  ultimo: SessaoTelemetriaLocal["ultimo"];
};

let memoria: SessaoPersistida | null = null;
let callbackAnexado = false;

const backgroundOk = (valor: string | undefined): boolean =>
  valor === "granted" || valor === "always";

const novoSessaoId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const comTimeout = <T>(promessa: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promessa.then(
      (valor) => {
        clearTimeout(id);
        resolve(valor);
      },
      (erro) => {
        clearTimeout(id);
        reject(erro);
      },
    );
  });

const paraSessao = (s: SessaoPersistida): SessaoTelemetriaLocal => ({
  sessaoId: s.sessaoId,
  iniciadoEm: s.iniciadoEm,
  distanciaKm: s.distanciaKm,
  velocidadeMaxKmh: s.velocidadeMaxKmh,
  somaVelocidadesKmh: s.somaVelocidadesKmh ?? 0,
  quantidadeVelocidades: s.quantidadeVelocidades ?? 0,
  primeiro: s.primeiro ?? null,
  ultimo: s.ultimo,
  tempoMovimentoSegundos: s.tempoMovimentoSegundos,
});

const lerSessao = async (): Promise<SessaoPersistida | null> => {
  if (memoria) return memoria;
  const { value } = await Preferences.get({ key: KEY_SESSAO });
  if (!value) return null;
  memoria = JSON.parse(value) as SessaoPersistida;
  return memoria;
};

const gravarSessao = async (sessao: SessaoPersistida | null) => {
  memoria = sessao;
  if (!sessao) {
    await Preferences.remove({ key: KEY_SESSAO });
    return;
  }
  await Preferences.set({ key: KEY_SESSAO, value: JSON.stringify(sessao) });
};

const lerResumo = async (): Promise<ResumoTelemetriaPendente | null> => {
  const { value } = await Preferences.get({ key: KEY_RESUMO });
  if (!value) return null;
  const bruto = JSON.parse(value) as ResumoTelemetriaPendente & {
    roleId?: string;
  };
  if (!bruto.dados?.pontoInicio || !bruto.dados?.pontoFim) {
    return null;
  }
  return { dados: bruto.dados };
};

const gravarResumo = async (resumo: ResumoTelemetriaPendente | null) => {
  if (!resumo) {
    await Preferences.remove({ key: KEY_RESUMO });
    return;
  }
  await Preferences.set({ key: KEY_RESUMO, value: JSON.stringify(resumo) });
};

const estadoDe = (sessao: SessaoPersistida): EstadoCalculo => ({
  distanciaKm: sessao.distanciaKm,
  velocidadeMaxKmh: sessao.velocidadeMaxKmh,
  velocidadeAtualKmh: sessao.velocidadeAtualKmh ?? 0,
  somaVelocidadesKmh: sessao.somaVelocidadesKmh ?? 0,
  quantidadeVelocidades: sessao.quantidadeVelocidades ?? 0,
  tempoMovimentoSegundos: sessao.tempoMovimentoSegundos,
  primeiro: sessao.primeiro ?? null,
  ultimo: sessao.ultimo,
  paradoDesde: sessao.paradoDesde,
  velocidadesRecentesKmh: sessao.velocidadesRecentesKmh ?? [],
});

const aplicarEstado = (
  sessao: SessaoPersistida,
  estado: EstadoCalculo,
): SessaoPersistida => ({
  ...sessao,
  distanciaKm: estado.distanciaKm,
  velocidadeMaxKmh: estado.velocidadeMaxKmh,
  velocidadeAtualKmh: estado.velocidadeAtualKmh,
  somaVelocidadesKmh: estado.somaVelocidadesKmh,
  quantidadeVelocidades: estado.quantidadeVelocidades,
  tempoMovimentoSegundos: estado.tempoMovimentoSegundos,
  primeiro: estado.primeiro,
  ultimo: estado.ultimo,
  paradoDesde: estado.paradoDesde,
  velocidadesRecentesKmh: estado.velocidadesRecentesKmh ?? [],
});

const incorporarBufferNaSessao = async (
  sessao: SessaoPersistida,
  pontosLidos?: PontoGps[],
): Promise<SessaoPersistida> => {
  const pontos = pontosLidos ?? (await telemetriaBuffer.listar());
  return aplicarEstado(sessao, incorporarBuffer(estadoDe(sessao), pontos));
};

const aplicarLocalizacao = async (
  lat: number,
  lng: number,
  t: number,
  speed: number | null,
  accuracy: number,
) => {
  const sessao = await lerSessao();
  if (!sessao?.ativa) return;
  const proximo = aplicarPonto(estadoDe(sessao), {
    lat,
    lng,
    t,
    speed,
    accuracy,
  });
  await gravarSessao(aplicarEstado(sessao, proximo));
};

const urlPontoNativo = (sessaoId: string): string =>
  `${functionsApiUrl}/telemetria/sessao/${sessaoId}/ponto`;

const abrirSessaoRemotaInterno = async (): Promise<SessaoRemota | null> => {
  const tokenAuth = await auth.currentUser?.getIdToken();
  if (!tokenAuth) return null;
  const res = await fetch(`${functionsApiUrl}/telemetria/sessao`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenAuth}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    id?: string;
    token?: string;
    iniciadoEm?: string;
  };
  if (!data.id || !data.token || !data.iniciadoEm) return null;
  return { id: data.id, token: data.token, iniciadoEm: data.iniciadoEm };
};

const abrirSessaoRemota = async (): Promise<SessaoRemota | null> => {
  try {
    return await comTimeout(abrirSessaoRemotaInterno(), TIMEOUT_SESSAO_MS);
  } catch {
    return null;
  }
};

const buscarAgregadosRemotos = async (
  remota: SessaoRemota,
): Promise<AgregadosRemotos | null> => {
  const tokenAuth = await auth.currentUser?.getIdToken();
  if (!tokenAuth) return null;
  try {
    const res = await fetch(
      `${functionsApiUrl}/telemetria/sessao/${remota.id}`,
      {
        headers: { Authorization: `Bearer ${tokenAuth}` },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as AgregadosRemotos;
    return {
      distanciaKm: Number(data.distanciaKm ?? 0),
      velocidadeMaxKmh: Number(data.velocidadeMaxKmh ?? 0),
      velocidadeAtualKmh: Number(data.velocidadeAtualKmh ?? 0),
      somaVelocidadesKmh: Number(data.somaVelocidadesKmh ?? 0),
      quantidadeVelocidades: Number(data.quantidadeVelocidades ?? 0),
      tempoMovimentoSegundos: Number(data.tempoMovimentoSegundos ?? 0),
      primeiro: data.primeiro ?? null,
      ultimo: data.ultimo ?? null,
    };
  } catch {
    return null;
  }
};

const encerrarSessaoRemota = async (remota: SessaoRemota): Promise<void> => {
  const tokenAuth = await auth.currentUser?.getIdToken();
  if (!tokenAuth) return;
  try {
    await fetch(`${functionsApiUrl}/telemetria/sessao/${remota.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenAuth}` },
    });
  } catch {
    /* best-effort */
  }
};

const anexarCallback = async (remota?: SessaoRemota | null) => {
  await BackgroundGeolocation.start(
    {
      backgroundMessage: "Registrando seu rolê",
      backgroundTitle: "Rolemoto",
      requestPermissions: false,
      stale: false,
      distanceFilter: 5,
      minIntervalMs: 2000,
      networkFallback: true,
      ...(remota
        ? {
            url: urlPontoNativo(remota.id),
            headers: { [HEADER_SESSAO]: remota.token },
          }
        : {}),
    },
    (location, error) => {
      if (error || !location) return;
      void aplicarLocalizacao(
        location.latitude,
        location.longitude,
        location.time ?? Date.now(),
        location.speed,
        location.accuracy,
      );
    },
  );
  callbackAnexado = true;
};

const exigirBackground = async () => {
  const primeiro = await BackgroundGeolocation.requestPermissions({
    permissions: ["location"],
  });
  if (primeiro.location !== "granted") {
    throw new TelemetriaGpsErro(
      "permissao_background",
      "Precisamos da localização sempre para medir o passeio com a tela off.",
    );
  }

  const segundo = await BackgroundGeolocation.requestPermissions({
    permissions: ["backgroundLocation"],
  });
  if (!backgroundOk(segundo.backgroundLocation)) {
    throw new TelemetriaGpsErro(
      "permissao_background",
      "Precisamos da localização sempre para medir o passeio com a tela off.",
    );
  }

  if (Capacitor.getPlatform() === "android") {
    const noti = await BackgroundGeolocation.requestPermissions({
      permissions: ["notification"],
    });
    if (noti.notification !== "granted") {
      throw new TelemetriaGpsErro(
        "permissao_background",
        "Precisamos da localização sempre para medir o passeio com a tela off.",
      );
    }
  }
};

const pontoDe = (
  coord: { lat: number; lng: number } | null,
): RoleTelemetriaCreate["pontoInicio"] => ({
  lat: coord?.lat ?? 0,
  lng: coord?.lng ?? 0,
  nome: "",
  endereco: "",
});

const montarDados = (
  sessao: SessaoTelemetriaLocal,
  encerradoEm: string,
  tracado: string,
): RoleTelemetriaCreate => {
  const tempoSegundos = tempoParedeSegundos(sessao.iniciadoEm, encerradoEm);
  return {
    titulo: tituloPadraoTelemetria(encerradoEm),
    ...arredondarParaPost({
      velocidadeMaxKmh: sessao.velocidadeMaxKmh,
      velocidadeMediaKmh: velocidadeMediaKmh(
        sessao.somaVelocidadesKmh,
        sessao.quantidadeVelocidades,
      ),
      distanciaKm: sessao.distanciaKm,
      tempoSegundos,
      tempoMovimentoSegundos: sessao.tempoMovimentoSegundos,
    }),
    iniciadoEm: sessao.iniciadoEm,
    encerradoEm,
    pontoInicio: pontoDe(sessao.primeiro ?? sessao.ultimo),
    pontoFim: pontoDe(sessao.ultimo ?? sessao.primeiro),
    tracado,
  };
};

const limparBufferNativo = async () => {
  await telemetriaBuffer.parar();
  await telemetriaBuffer.limpar();
};

export const nativeAdapter: TelemetriaGpsAdapter = {
  isNative: () => true,

  getSession: async () => {
    const sessao = await lerSessao();
    if (!sessao?.ativa) return null;
    const comBuffer = await incorporarBufferNaSessao(sessao);
    await gravarSessao(comBuffer);
    await telemetriaBuffer.garantir();
    if (!callbackAnexado) {
      try {
        await anexarCallback(comBuffer.remota);
      } catch {
        return paraSessao(comBuffer);
      }
    }
    return paraSessao(comBuffer);
  },

  getResumoPendente: lerResumo,

  salvarResumoPendente: gravarResumo,

  start: async () => {
    const atual = await lerSessao();
    if (atual?.ativa) {
      throw new TelemetriaGpsErro(
        "sessao_ativa",
        "Finalize a gravação atual antes de iniciar outro passeio.",
      );
    }

    if (await telemetriaBuffer.economiaAfetaGps()) {
      throw new TelemetriaGpsErro(
        "economia_bateria",
        "A economia de bateria desliga o GPS com a tela apagada. Desative para gravar a velocidade do rolê.",
      );
    }

    await exigirBackground();

    const iniciado: SessaoPersistida = {
      ...estadoCalculoInicial(),
      sessaoId: novoSessaoId(),
      iniciadoEm: new Date().toISOString(),
      ativa: true,
      remota: null,
    };
    await gravarSessao(iniciado);

    try {
      await telemetriaBuffer.iniciar();
    } catch (erro) {
      await limparBufferNativo();
      await gravarSessao(null);
      throw erro;
    }

    // O Capgo recusa um segundo start (ALREADY_STARTED): a url tem de ir no
    // primeiro. O buffer nativo já grava enquanto a sessão remota abre (≤ 5 s).
    const remota = await abrirSessaoRemota();
    const comRemota: SessaoPersistida = {
      ...((await lerSessao()) ?? iniciado),
      remota,
    };
    await gravarSessao(comRemota);

    try {
      await anexarCallback(remota);
    } catch (erro) {
      if (remota) await encerrarSessaoRemota(remota);
      await limparBufferNativo();
      await gravarSessao(null);
      throw erro;
    }

    return paraSessao(comRemota);
  },

  stop: async (): Promise<ResultadoStopTelemetria> => {
    const sessao = await lerSessao();
    if (!sessao?.ativa) {
      throw new TelemetriaGpsErro("sem_sessao", "Nenhuma gravação ativa.");
    }

    try {
      await BackgroundGeolocation.stop();
    } finally {
      callbackAnexado = false;
    }

    const pontosBuffer = await telemetriaBuffer.listar();
    const comBuffer = await incorporarBufferNaSessao(sessao, pontosBuffer);

    const remoto =
      comBuffer.remota != null
        ? await buscarAgregadosRemotos(comBuffer.remota)
        : null;

    if (comBuffer.remota) {
      await encerrarSessaoRemota(comBuffer.remota);
    }

    const estadoRemoto: EstadoCalculo | null = remoto
      ? {
          distanciaKm: remoto.distanciaKm,
          velocidadeMaxKmh: remoto.velocidadeMaxKmh,
          velocidadeAtualKmh: remoto.velocidadeAtualKmh,
          somaVelocidadesKmh: remoto.somaVelocidadesKmh,
          quantidadeVelocidades: remoto.quantidadeVelocidades,
          tempoMovimentoSegundos: remoto.tempoMovimentoSegundos,
          primeiro: remoto.primeiro ?? null,
          ultimo: remoto.ultimo ?? null,
          paradoDesde: null,
        }
      : null;

    const mesclada = aplicarEstado(
      comBuffer,
      mesclarComRemoto(estadoDe(comBuffer), estadoRemoto),
    );
    const encerradoEm = new Date().toISOString();
    const local = paraSessao({ ...mesclada, ativa: false, remota: null });
    const dados = montarDados(local, encerradoEm, gerarTracado(pontosBuffer));
    await gravarResumo({ dados });
    await gravarSessao(null);
    await limparBufferNativo();
    return { sessao: local, encerradoEm, dados };
  },

  limparResumoPendente: async () => {
    await gravarResumo(null);
    await limparBufferNativo();
  },

  abrirAjustes: async () => {
    await BackgroundGeolocation.openSettings();
  },

  abrirAjustesEconomia: async () => {
    await telemetriaBuffer.abrirAjustesEconomia();
  },
};
