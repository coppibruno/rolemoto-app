import { BackgroundGeolocation } from "@capgo/background-geolocation";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type {
  SessaoTelemetriaLocal,
  TelemetriaRoleCreate,
} from "@/types/telemetria-role";
import {
  aplicarPonto,
  arredondarParaPost,
  estadoCalculoInicial,
  tempoParedeSegundos,
  velocidadeMediaKmh,
  type EstadoCalculo,
} from "./calcular-metricas";
import {
  TelemetriaGpsErro,
  type ResultadoStopTelemetria,
  type ResumoTelemetriaPendente,
  type TelemetriaGpsAdapter,
} from "./telemetria-gps.adapter";

const KEY_SESSAO = "rolemoto.telemetria.sessao";
const KEY_RESUMO = "rolemoto.telemetria.resumo";

type SessaoPersistida = SessaoTelemetriaLocal & {
  ativa: boolean;
  paradoDesde: number | null;
};

let memoria: SessaoPersistida | null = null;
let callbackAnexado = false;

const backgroundOk = (valor: string | undefined): boolean =>
  valor === "granted" || valor === "always";

const paraSessao = (s: SessaoPersistida): SessaoTelemetriaLocal => ({
  roleId: s.roleId,
  iniciadoEm: s.iniciadoEm,
  distanciaKm: s.distanciaKm,
  velocidadeMaxKmh: s.velocidadeMaxKmh,
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
  return JSON.parse(value) as ResumoTelemetriaPendente;
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
  tempoMovimentoSegundos: sessao.tempoMovimentoSegundos,
  ultimo: sessao.ultimo,
  paradoDesde: sessao.paradoDesde,
});

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
  await gravarSessao({
    ...sessao,
    distanciaKm: proximo.distanciaKm,
    velocidadeMaxKmh: proximo.velocidadeMaxKmh,
    tempoMovimentoSegundos: proximo.tempoMovimentoSegundos,
    ultimo: proximo.ultimo,
    paradoDesde: proximo.paradoDesde,
  });
};

const anexarCallback = async () => {
  await BackgroundGeolocation.start(
    {
      backgroundMessage: "Registrando seu rolê",
      backgroundTitle: "Rolemoto",
      requestPermissions: false,
      stale: false,
      distanceFilter: 10,
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
      "Precisamos da localização sempre para medir o rolê com a tela off.",
    );
  }

  const segundo = await BackgroundGeolocation.requestPermissions({
    permissions: ["backgroundLocation"],
  });
  if (!backgroundOk(segundo.backgroundLocation)) {
    throw new TelemetriaGpsErro(
      "permissao_background",
      "Precisamos da localização sempre para medir o rolê com a tela off.",
    );
  }

  if (Capacitor.getPlatform() === "android") {
    const noti = await BackgroundGeolocation.requestPermissions({
      permissions: ["notification"],
    });
    if (noti.notification !== "granted") {
      throw new TelemetriaGpsErro(
        "permissao_background",
        "Precisamos da localização sempre para medir o rolê com a tela off.",
      );
    }
  }
};

const montarDados = (
  sessao: SessaoTelemetriaLocal,
  encerradoEm: string,
): TelemetriaRoleCreate => {
  const tempoSegundos = tempoParedeSegundos(sessao.iniciadoEm, encerradoEm);
  return {
    ...arredondarParaPost({
      velocidadeMaxKmh: sessao.velocidadeMaxKmh,
      velocidadeMediaKmh: velocidadeMediaKmh(
        sessao.distanciaKm,
        sessao.tempoMovimentoSegundos,
      ),
      distanciaKm: sessao.distanciaKm,
      tempoSegundos,
      tempoMovimentoSegundos: sessao.tempoMovimentoSegundos,
    }),
    iniciadoEm: sessao.iniciadoEm,
    encerradoEm,
  };
};

export const nativeAdapter: TelemetriaGpsAdapter = {
  isNative: () => true,

  getSession: async () => {
    const sessao = await lerSessao();
    if (!sessao?.ativa) return null;
    if (!callbackAnexado) {
      try {
        await anexarCallback();
      } catch {
        return paraSessao(sessao);
      }
    }
    return paraSessao(sessao);
  },

  getResumoPendente: lerResumo,

  start: async (roleId: string) => {
    const atual = await lerSessao();
    if (atual?.ativa && atual.roleId !== roleId) {
      throw new TelemetriaGpsErro(
        "sessao_outro_role",
        "Finalize a gravação atual antes de iniciar outro rolê.",
      );
    }
    if (atual?.ativa && atual.roleId === roleId) {
      if (!callbackAnexado) await anexarCallback();
      return paraSessao(atual);
    }

    await exigirBackground();
    const iniciado: SessaoPersistida = {
      ...estadoCalculoInicial(),
      roleId,
      iniciadoEm: new Date().toISOString(),
      ativa: true,
    };
    await gravarSessao(iniciado);
    await anexarCallback();
    return paraSessao(iniciado);
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
    const encerradoEm = new Date().toISOString();
    const local = paraSessao({ ...sessao, ativa: false });
    const dados = montarDados(local, encerradoEm);
    await gravarResumo({ roleId: sessao.roleId, dados });
    await gravarSessao(null);
    return { sessao: local, encerradoEm, dados };
  },

  limparResumoPendente: async () => {
    await gravarResumo(null);
  },

  abrirAjustes: async () => {
    await BackgroundGeolocation.openSettings();
  },
};
