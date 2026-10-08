"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { isErroAuth, isFalhaDeRede } from "@/lib/telemetria/falha-rede";
import {
  TelemetriaGpsErro,
  obterAdapterGps,
  type TelemetriaGpsAdapter,
} from "@/lib/telemetria/telemetria-gps.adapter";
import type { RoleTelemetriaCreate } from "@/types/role-telemetria";
import { geocodePontosTelemetria } from "../../telemetria/services/geocode-telemetria.service";
import { telemetriaService } from "../../telemetria/services/telemetria.service";
import {
  MENSAGEM_AUTH_PENDENTE,
  MENSAGEM_SALVO_NO_CELULAR,
  avisarFilaVazia,
  onSyncResumo,
  type ResultadoSyncResumo,
} from "../services/sync-resumo-pendente";

export type FaseGravarRole =
  | "carregando"
  | "web"
  | "idle"
  | "gravando"
  | "resumo";

export const useGravarRole = () => {
  const router = useRouter();
  const [fase, setFase] = useState<FaseGravarRole>("carregando");
  const [adapter, setAdapter] = useState<TelemetriaGpsAdapter | null>(null);
  const [iniciadoEm, setIniciadoEm] = useState<string | null>(null);
  const [resumo, setResumo] = useState<RoleTelemetriaCreate | null>(null);
  const [titulo, setTitulo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCodigo, setErroCodigo] = useState<TelemetriaGpsErro["codigo"] | null>(
    null,
  );
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );

  useEffect(() => {
    let cancelado = false;
    const bootstrap = async () => {
      const gps = await obterAdapterGps();
      if (cancelado) return;
      setAdapter(gps);

      if (!gps.isNative()) {
        setFase("web");
        return;
      }

      const sessao = await gps.getSession();
      if (cancelado) return;
      if (sessao) {
        setIniciadoEm(sessao.iniciadoEm);
        setFase("gravando");
        return;
      }

      const pendente = await gps.getResumoPendente();
      if (cancelado) return;
      if (pendente) {
        setResumo(pendente.dados);
        setTitulo(pendente.dados.titulo);
        setFase("resumo");
        return;
      }

      setFase("idle");
    };

    void bootstrap();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  const irParaDashboard = useCallback(
    (id: string) => {
      setResumo(null);
      setTitulo("");
      setErro(null);
      router.replace(`/telemetria/${id}`);
    },
    [router],
  );

  const aoSync = useCallback(
    (resultado: ResultadoSyncResumo) => {
      if (fase !== "resumo") return;
      if (resultado.tipo === "ok") {
        irParaDashboard(resultado.criado.id);
        return;
      }
      if (resultado.tipo === "validacao") {
        setErro(resultado.mensagem);
      }
    },
    [fase, irParaDashboard],
  );

  useEffect(() => onSyncResumo(aoSync), [aoSync]);

  const iniciar = useCallback(async () => {
    if (!adapter) return;
    setErro(null);
    setErroCodigo(null);
    setOcupado(true);
    try {
      const sessao = await adapter.start();
      setIniciadoEm(sessao.iniciadoEm);
      setFase("gravando");
    } catch (e) {
      if (e instanceof TelemetriaGpsErro) {
        setErro(e.message);
        setErroCodigo(e.codigo);
      } else {
        setErro("Não foi possível iniciar a gravação.");
      }
    } finally {
      setOcupado(false);
    }
  }, [adapter]);

  const finalizar = useCallback(async () => {
    if (!adapter) return;
    setErro(null);
    setErroCodigo(null);
    setOcupado(true);
    try {
      const resultado = await adapter.stop();
      const pontos = await geocodePontosTelemetria(
        resultado.dados.pontoInicio,
        resultado.dados.pontoFim,
      );
      const dados = { ...resultado.dados, ...pontos };
      await adapter.salvarResumoPendente({ dados });
      setResumo(dados);
      setTitulo(dados.titulo);
      setIniciadoEm(null);
      setFase("resumo");
    } catch (e) {
      if (e instanceof TelemetriaGpsErro) {
        setErro(e.message);
      } else {
        setErro("Não foi possível encerrar a gravação.");
      }
    } finally {
      setOcupado(false);
    }
  }, [adapter]);

  const salvar = useCallback(async () => {
    if (!resumo) return;
    setErro(null);
    setOcupado(true);
    const dados = { ...resumo, titulo: titulo.trim() || resumo.titulo };
    try {
      await adapter?.salvarResumoPendente({ dados });
      const criado = await telemetriaService.criar(dados);
      await adapter?.limparResumoPendente();
      avisarFilaVazia();
      irParaDashboard(criado.id);
    } catch (e) {
      if (isFalhaDeRede(e)) {
        setErro(MENSAGEM_SALVO_NO_CELULAR);
      } else if (isErroAuth(e)) {
        setErro(MENSAGEM_AUTH_PENDENTE);
      } else {
        setErro(
          e instanceof ApiError ? e.message : "Falha ao salvar. Tente de novo.",
        );
      }
    } finally {
      setOcupado(false);
    }
  }, [adapter, irParaDashboard, resumo, titulo]);

  const descartar = useCallback(async () => {
    await adapter?.limparResumoPendente();
    avisarFilaVazia();
    setResumo(null);
    setTitulo("");
    setErro(null);
    setFase(adapter?.isNative() ? "idle" : "web");
  }, [adapter]);

  const abrirAjustes = useCallback(async () => {
    await adapter?.abrirAjustes();
  }, [adapter]);

  const fecharErro = useCallback(() => {
    setErro(null);
    setErroCodigo(null);
  }, []);

  const abrirAjustesEconomia = useCallback(async () => {
    fecharErro();
    await adapter?.abrirAjustesEconomia();
  }, [adapter, fecharErro]);

  return {
    fase,
    nativo: adapter?.isNative() ?? false,
    iniciadoEm,
    resumo,
    titulo,
    setTitulo,
    ocupado,
    erro,
    erroCodigo,
    online,
    iniciar,
    finalizar,
    salvar,
    descartar,
    abrirAjustes,
    abrirAjustesEconomia,
    fecharErro,
  };
};
