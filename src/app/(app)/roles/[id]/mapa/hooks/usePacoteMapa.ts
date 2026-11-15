"use client";

import { useMemo, useState } from "react";
import { usePacoteMapaSalvo } from "@/hooks/usePacoteMapaSalvo";
import { apagarPacote } from "@/lib/mapa-viagem/pacote-mapa";
import { urlPmtilesSul } from "@/lib/mapa-viagem/plataforma";
import { AVISO_BYTES, estimarBytesPacote, hashPontosViagem } from "@/lib/mapa-viagem/viagem";
import type { Localizacao } from "@/types/role";
import { ERRO_BAIXAR, ERRO_TRECHO_LONGO } from "../constants";

type Viagem = {
  roleId: string;
  titulo: string;
  dataHoraSaida: string;
  pontos: Localizacao[];
};

export type Confirmacao = "tamanho" | "apagar" | null;

export const usePacoteMapa = (viagem: Viagem | null) => {
  const hash = useMemo(() => (viagem ? hashPontosViagem(viagem.pontos) : null), [viagem]);
  const estimativa = useMemo(() => (viagem ? estimarBytesPacote(viagem.pontos) : 0), [viagem]);
  const { estado, setEstado, recarregar } = usePacoteMapaSalvo(viagem?.roleId ?? "", hash);
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null);
  const [erro, setErro] = useState<string | null>(null);

  const executar = async () => {
    const url = urlPmtilesSul();
    if (!viagem || !url) return;
    setConfirmacao(null);
    setErro(null);
    setEstado({ tipo: "baixando", fracao: 0 });
    let ErroTrechoLongo: (new (...args: never[]) => Error) | null = null;
    try {
      // pmtiles só entra quando o piloto toca em Baixar.
      const modulo = await import("@/lib/mapa-viagem/baixar-pacote");
      ErroTrechoLongo = modulo.ErroTrechoLongo;
      await modulo.baixarPacote({
        ...viagem,
        urlSul: url,
        aoProgredir: (fracao) => setEstado({ tipo: "baixando", fracao }),
      });
    } catch (falha) {
      console.error(falha);
      setErro(ErroTrechoLongo && falha instanceof ErroTrechoLongo ? ERRO_TRECHO_LONGO : ERRO_BAIXAR);
    }
    recarregar();
  };

  const baixar = () => {
    if (estimativa > AVISO_BYTES && confirmacao !== "tamanho") {
      setConfirmacao("tamanho");
      return;
    }
    void executar();
  };

  const apagar = async () => {
    if (!viagem) return;
    if (confirmacao !== "apagar") {
      setConfirmacao("apagar");
      return;
    }
    setConfirmacao(null);
    await apagarPacote(viagem.roleId);
    recarregar();
  };

  return {
    estado,
    estimativa,
    confirmacao,
    erro,
    baixar,
    confirmarTamanho: () => void executar(),
    apagar: () => void apagar(),
    cancelarConfirmacao: () => setConfirmacao(null),
  };
};
