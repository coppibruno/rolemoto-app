"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AbaTipoGaragem } from "@/types/meus-roles";
import { TIPOS_GARAGEM } from "../constants";

const lerTipo = (bruto: string | null): AbaTipoGaragem | null =>
  bruto && (TIPOS_GARAGEM as string[]).includes(bruto)
    ? (bruto as AbaTipoGaragem)
    : null;

export const useAbaTipoGaragem = (inicial: AbaTipoGaragem = "roles") => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const daUrl = lerTipo(searchParams.get("tipo"));
  const [abaTipo, setAbaTipoEstado] = useState<AbaTipoGaragem>(daUrl ?? inicial);

  useEffect(() => {
    setAbaTipoEstado(daUrl ?? "roles");
  }, [daUrl]);

  const setAbaTipo = useCallback(
    (proxima: AbaTipoGaragem) => {
      setAbaTipoEstado(proxima);
      const params = new URLSearchParams(searchParams.toString());
      if (proxima === "roles") {
        params.delete("tipo");
      } else {
        params.set("tipo", proxima);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { abaTipo, setAbaTipo };
};
