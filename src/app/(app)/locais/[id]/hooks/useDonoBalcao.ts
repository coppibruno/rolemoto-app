"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { seguirService } from "@/app/(app)/seguir/services/seguir.service";
import type { DonoLocal } from "@/types/oferta-local";
import type { LinhaPiloto } from "@/types/seguir";
import { ofertaLocalService } from "../../services/oferta-local.service";
import { DONO_ERRO } from "../constants";

const MIN_LETRAS = 2;
const ESPERA_MS = 300;

type Props = {
  localId: string;
  donoInicial: DonoLocal | null;
};

export const useDonoBalcao = ({ localId, donoInicial }: Props) => {
  const [dono, setDono] = useState<DonoLocal | null>(donoInicial);
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<LinhaPiloto[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoSoltar, setConfirmandoSoltar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const q = termo.trim();
    if (q.length < MIN_LETRAS) {
      setResultados([]);
      return;
    }
    let cancelado = false;
    const timer = setTimeout(() => {
      seguirService
        .busca(q)
        .then((resposta) => {
          if (!cancelado) setResultados(resposta.itens);
        })
        .catch(() => {
          if (!cancelado) setResultados([]);
        });
    }, ESPERA_MS);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [termo]);

  const salvar = useCallback(
    async (novo: DonoLocal | null) => {
      setSalvando(true);
      setErro(null);
      try {
        await ofertaLocalService.definirDono(localId, novo?.uid ?? null);
        setDono(novo);
        setTermo("");
        setConfirmandoSoltar(false);
      } catch (e) {
        setErro(e instanceof ApiError ? e.message : DONO_ERRO);
      } finally {
        setSalvando(false);
      }
    },
    [localId],
  );

  const escolher = (piloto: LinhaPiloto) =>
    void salvar({ uid: piloto.uid, nome: piloto.apelido.trim() || piloto.nome.split(/\s+/)[0] });

  return {
    dono,
    termo,
    setTermo,
    resultados,
    salvando,
    erro,
    confirmandoSoltar,
    pedirSoltar: () => setConfirmandoSoltar(true),
    cancelarSoltar: () => setConfirmandoSoltar(false),
    soltar: () => void salvar(null),
    escolher,
  };
};
