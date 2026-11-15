"use client";

import { useCallback, useEffect, useState } from "react";
import { lerMetaPacote } from "@/lib/mapa-viagem/pacote-mapa";
import { noAppInstalado, urlPmtilesSul } from "@/lib/mapa-viagem/plataforma";
import type { EstadoPacote, MetaPacote } from "@/lib/mapa-viagem/tipos";

const estadoDaMeta = (meta: MetaPacote | null, hashAtual: string): EstadoPacote => {
  if (!meta) return { tipo: "ausente" };
  return meta.pontosHash === hashAtual ? { tipo: "atual", meta } : { tipo: "desatualizado", meta };
};

/** Lê `mapas/{roleId}/meta.json` e compara o hash com os pontos atuais do rolê. */
export const usePacoteMapaSalvo = (roleId: string, hashAtual: string | null) => {
  const [estado, setEstado] = useState<EstadoPacote>({ tipo: "carregando" });
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    if (!noAppInstalado()) {
      setEstado({ tipo: "indisponivel" });
      return;
    }
    if (!hashAtual) return;
    let ativo = true;
    void lerMetaPacote(roleId).then((meta) => {
      if (!ativo) return;
      if (!meta && !urlPmtilesSul()) {
        setEstado({ tipo: "sem-url" });
        return;
      }
      setEstado(estadoDaMeta(meta, hashAtual));
    });
    return () => {
      ativo = false;
    };
  }, [roleId, hashAtual, ticket]);

  return { estado, setEstado, recarregar };
};
