"use client";

import { useEffect, useState } from "react";
import {
  cliqueJaContadoHoje,
  guardarCodigoAfiliado,
  marcarCliqueHoje,
  normalizarCodigoAfiliado,
} from "@/lib/afiliado";
import { functionsApiUrl } from "@/lib/firebase";

export type EstadoAfiliado = "carregando" | "ok" | "inexistente";

export const useCliqueAfiliado = (bruto: string): EstadoAfiliado => {
  const [estado, setEstado] = useState<EstadoAfiliado>("carregando");

  useEffect(() => {
    const codigo = normalizarCodigoAfiliado(bruto);
    if (!codigo) {
      setEstado("inexistente");
      return;
    }
    if (cliqueJaContadoHoje(codigo)) {
      guardarCodigoAfiliado(codigo);
      setEstado("ok");
      return;
    }

    let cancelado = false;
    fetch(`${functionsApiUrl}/publico/afiliados/${encodeURIComponent(codigo)}/clique`, {
      method: "POST",
    })
      .then((res) => {
        if (cancelado) return;
        if (res.status === 404) {
          setEstado("inexistente");
          return;
        }
        guardarCodigoAfiliado(codigo);
        if (res.ok) marcarCliqueHoje(codigo);
        setEstado("ok");
      })
      .catch(() => {
        if (cancelado) return;
        guardarCodigoAfiliado(codigo);
        setEstado("ok");
      });

    return () => {
      cancelado = true;
    };
  }, [bruto]);

  return estado;
};
