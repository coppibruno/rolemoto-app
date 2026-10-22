"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Abre o player uma vez quando a URL traz `?stories=1` e tira o parâmetro. */
export const useAbrirStoriesDaUrl = (pronto: boolean, abrir: () => void) => {
  const router = useRouter();
  const pathname = usePathname();
  const abriu = useRef(false);
  const abrirRef = useRef(abrir);
  abrirRef.current = abrir;

  useEffect(() => {
    if (!pronto || abriu.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("stories") !== "1") return;
    abriu.current = true;
    params.delete("stories");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    abrirRef.current();
  }, [pronto, pathname, router]);
};
