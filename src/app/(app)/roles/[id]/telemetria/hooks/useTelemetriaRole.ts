"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { podeGravarTelemetriaNativa } from "@/lib/telemetria/plataforma";
import {
  obterAdapterGps,
  TelemetriaGpsErro,
} from "@/lib/telemetria/telemetria-gps.adapter";
import type {
  TelemetriaRole,
  TelemetriaRoleCreate,
} from "@/types/telemetria-role";
import { COPY_TELEMETRIA, ERRO_INICIAR, ERRO_PUBLICAR } from "../constants";
import { telemetriaRoleService } from "../services/telemetria-role.service";
import { useSessaoTelemetriaNativa } from "./useSessaoTelemetriaNativa";

export type FaseTelemetria =
  | "carregando"
  | "web"
  | "idle"
  | "educacao"
  | "gravando"
  | "resumo"
  | "pendente";

export const useTelemetriaRole = (roleId: string, elegivel: boolean) => {
  const nativo = podeGravarTelemetriaNativa();
  const { sessaoDesteRole, sessaoOutroRole, sincronizar } =
    useSessaoTelemetriaNativa(roleId);

  const [fase, setFase] = useState<FaseTelemetria>("carregando");
  const [salvo, setSalvo] = useState<TelemetriaRole | null>(null);
  const [pendente, setPendente] = useState<TelemetriaRoleCreate | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!elegivel) return;
    let cancelado = false;

    const carregar = async () => {
      try {
        const doc = await telemetriaRoleService.buscarMinha(roleId);
        if (cancelado) return;
        setSalvo(doc);
        setFase("resumo");
      } catch (falha) {
        if (cancelado) return;
        if (!(falha instanceof ApiError) || falha.status !== 404) {
          setErro(falha instanceof Error ? falha.message : ERRO_PUBLICAR);
        }
        const adapter = await obterAdapterGps();
        const resumo = await adapter.getResumoPendente();
        if (cancelado) return;
        if (resumo?.roleId === roleId) {
          setPendente(resumo.dados);
          setFase("pendente");
          return;
        }
        if (!nativo) {
          setFase("web");
          return;
        }
        const sessao = await adapter.getSession();
        if (cancelado) return;
        setFase(sessao?.roleId === roleId ? "gravando" : "idle");
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [elegivel, nativo, roleId]);

  useEffect(() => {
    if (salvo || !nativo || !elegivel) return;
    if (sessaoDesteRole) setFase("gravando");
  }, [elegivel, nativo, salvo, sessaoDesteRole]);

  const publicar = useCallback(
    async (dados: TelemetriaRoleCreate) => {
      setOcupado(true);
      setErro(null);
      try {
        const doc = await telemetriaRoleService.publicar(roleId, dados);
        const adapter = await obterAdapterGps();
        await adapter.limparResumoPendente();
        setSalvo(doc);
        setPendente(null);
        setFase("resumo");
      } catch (falha) {
        if (falha instanceof ApiError && falha.status === 409) {
          try {
            const doc = await telemetriaRoleService.buscarMinha(roleId);
            setSalvo(doc);
            setFase("resumo");
            const adapter = await obterAdapterGps();
            await adapter.limparResumoPendente();
            return;
          } catch {
            /* cai no erro abaixo */
          }
        }
        setPendente(dados);
        setFase("pendente");
        setErro(falha instanceof ApiError ? falha.message : ERRO_PUBLICAR);
      } finally {
        setOcupado(false);
      }
    },
    [roleId],
  );

  const pedirInicio = useCallback(() => {
    setErro(null);
    setFase("educacao");
  }, []);

  const iniciar = useCallback(async () => {
    setOcupado(true);
    setErro(null);
    try {
      const adapter = await obterAdapterGps();
      await adapter.start(roleId);
      await sincronizar();
      setFase("gravando");
    } catch (falha) {
      if (falha instanceof TelemetriaGpsErro) {
        setErro(
          falha.codigo === "permissao_background"
            ? COPY_TELEMETRIA.permissao
            : falha.message,
        );
        setFase("idle");
      } else {
        setErro(ERRO_INICIAR);
        setFase("idle");
      }
    } finally {
      setOcupado(false);
    }
  }, [roleId, sincronizar]);

  const finalizar = useCallback(async () => {
    setOcupado(true);
    setErro(null);
    try {
      const adapter = await obterAdapterGps();
      const resultado = await adapter.stop();
      await sincronizar();
      await publicar(resultado.dados);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : ERRO_PUBLICAR);
    } finally {
      setOcupado(false);
    }
  }, [publicar, sincronizar]);

  const tentarSalvar = useCallback(async () => {
    if (!pendente) return;
    await publicar(pendente);
  }, [pendente, publicar]);

  const abrirAjustes = useCallback(async () => {
    const adapter = await obterAdapterGps();
    await adapter.abrirAjustes();
  }, []);

  return {
    nativo,
    fase,
    salvo,
    pendente,
    sessao: sessaoDesteRole,
    sessaoOutroRole,
    ocupado,
    erro,
    pedirInicio,
    iniciar,
    finalizar,
    tentarSalvar,
    abrirAjustes,
  };
};
