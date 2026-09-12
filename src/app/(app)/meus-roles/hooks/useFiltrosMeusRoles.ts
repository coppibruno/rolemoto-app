"use client";

import { useMemo, useState } from "react";
import type {
  AbaMeusRoles,
  FiltrosMeusRoles,
  MeuRoleItem,
  PapelMeuRole,
} from "@/types/meus-roles";
import type { RitmoRole } from "@/types/role";

const porSaida = (a: MeuRoleItem, b: MeuRoleItem, dir: "asc" | "desc") => {
  const sinal = dir === "asc" ? 1 : -1;
  return sinal * (Date.parse(a.dataHoraSaida) - Date.parse(b.dataHoraSaida));
};

const porAba = (item: MeuRoleItem, aba: AbaMeusRoles): boolean => {
  if (aba === "proximos") return item.status !== "concluido";
  if (aba === "confirmados") {
    return item.status === "confirmado" || item.status === "lider";
  }
  if (aba === "aguardando") return item.status === "pendente";
  return item.status === "concluido";
};

export const useFiltrosMeusRoles = (itens: MeuRoleItem[]) => {
  const [aba, setAba] = useState<AbaMeusRoles>("proximos");
  const [ritmo, setRitmo] = useState<RitmoRole | "todas">("todas");
  const [papel, setPapel] = useState<PapelMeuRole | "todos">("todos");
  const [sheetAberto, setSheetAberto] = useState(false);

  const filtros: FiltrosMeusRoles = { aba, ritmo, papel };
  const tuneAtivo = ritmo !== "todas" || papel !== "todos";

  const selecionarAba = (proxima: Exclude<AbaMeusRoles, "proximos">) => {
    setAba((atual) => (atual === proxima ? "proximos" : proxima));
  };

  const limparTune = () => {
    setRitmo("todas");
    setPapel("todos");
  };

  const itensVisiveis = useMemo(() => {
    const filtrados = itens.filter((item) => {
      if (!porAba(item, aba)) return false;
      if (ritmo !== "todas" && item.ritmo !== ritmo) return false;
      if (papel !== "todos" && item.papel !== papel) return false;
      return true;
    });
    const dir = aba === "concluidos" ? "desc" : "asc";
    return [...filtrados].sort((a, b) => porSaida(a, b, dir));
  }, [itens, aba, ritmo, papel]);

  return {
    filtros,
    tuneAtivo,
    sheetAberto,
    setSheetAberto,
    selecionarAba,
    setRitmo,
    setPapel,
    limparTune,
    itensVisiveis,
  };
};
