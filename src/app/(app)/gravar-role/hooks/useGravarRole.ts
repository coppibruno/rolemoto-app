"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  TelemetriaGpsErro,
  obterAdapterGps,
  type TelemetriaGpsAdapter,
} from "@/lib/telemetria/telemetria-gps.adapter";
import type { RoleTelemetriaCreate } from "@/types/role-telemetria";
import { geocodePontosTelemetria } from "../../telemetria/services/geocode-telemetria.service";
import { telemetriaService } from "../../telemetria/services/telemetria.service";

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

  const iniciar = useCallback(async () => {
    if (!adapter) return;
    setErro(null);
    setOcupado(true);
    try {
      const sessao = await adapter.start();
      setIniciadoEm(sessao.iniciadoEm);
      setFase("gravando");
    } catch (e) {
      if (e instanceof TelemetriaGpsErro) {
        setErro(e.message);
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
    setOcupado(true);
    try {
      const resultado = await adapter.stop();
      const pontos = await geocodePontosTelemetria(
        resultado.dados.pontoInicio,
        resultado.dados.pontoFim,
      );
      const dados = { ...resultado.dados, ...pontos };
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
    try {
      const criado = await telemetriaService.criar({
        ...resumo,
        titulo: titulo.trim() || resumo.titulo,
      });
      await adapter?.limparResumoPendente();
      router.replace(`/telemetria/${criado.id}`);
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : "Falha ao salvar. Tente de novo.",
      );
    } finally {
      setOcupado(false);
    }
  }, [adapter, resumo, router, titulo]);

  const descartar = useCallback(async () => {
    await adapter?.limparResumoPendente();
    setResumo(null);
    setTitulo("");
    setErro(null);
    setFase(adapter?.isNative() ? "idle" : "web");
  }, [adapter]);

  const abrirAjustes = useCallback(async () => {
    await adapter?.abrirAjustes();
  }, [adapter]);

  return {
    fase,
    nativo: adapter?.isNative() ?? false,
    iniciadoEm,
    resumo,
    titulo,
    setTitulo,
    ocupado,
    erro,
    iniciar,
    finalizar,
    salvar,
    descartar,
    abrirAjustes,
  };
};
