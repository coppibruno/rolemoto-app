"use client";

import { useMemo, useState } from "react";
import type {
  MeuEventoGaragemItem,
  MeuLocalGaragemItem,
  PillAvaliacaoGaragem,
} from "@/types/meus-roles";

const filtrarEventos = (
  itens: MeuEventoGaragemItem[],
  pill: PillAvaliacaoGaragem,
): MeuEventoGaragemItem[] => {
  if (pill === "todos") return itens;
  if (pill === "avaliados") return itens.filter((item) => item.avaliado);
  return itens.filter(
    (item) => item.status === "concluido" && !item.avaliado,
  );
};

const filtrarLocais = (
  itens: MeuLocalGaragemItem[],
  pill: PillAvaliacaoGaragem,
): MeuLocalGaragemItem[] => {
  if (pill === "todos") return itens;
  if (pill === "avaliados") return itens.filter((item) => item.avaliado);
  return itens.filter((item) => !item.avaliado);
};

export const useFiltroAvaliacaoGaragem = <
  T extends MeuEventoGaragemItem | MeuLocalGaragemItem,
>(
  itens: T[],
  tipo: "eventos" | "locais",
) => {
  const [pill, setPill] = useState<PillAvaliacaoGaragem>("todos");

  const itensFiltrados = useMemo(() => {
    if (tipo === "eventos") {
      return filtrarEventos(itens as MeuEventoGaragemItem[], pill) as T[];
    }
    return filtrarLocais(itens as MeuLocalGaragemItem[], pill) as T[];
  }, [itens, pill, tipo]);

  const contagensPill = useMemo(() => {
    if (tipo === "eventos") {
      const lista = itens as MeuEventoGaragemItem[];
      return {
        todos: lista.length,
        aguardando_avaliacao: lista.filter(
          (item) => item.status === "concluido" && !item.avaliado,
        ).length,
        avaliados: lista.filter((item) => item.avaliado).length,
      };
    }
    const lista = itens as MeuLocalGaragemItem[];
    return {
      todos: lista.length,
      aguardando_avaliacao: lista.filter((item) => !item.avaliado).length,
      avaliados: lista.filter((item) => item.avaliado).length,
    };
  }, [itens, tipo]);

  return { pill, setPill, itensFiltrados, contagensPill };
};
