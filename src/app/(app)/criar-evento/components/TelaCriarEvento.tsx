"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { CabecalhoCriarEvento } from "./CabecalhoCriarEvento";
import { FormularioCriarEvento } from "./FormularioCriarEvento";
import { IntroPainelAdmin } from "./IntroPainelAdmin";
import styles from "../criar-evento.module.css";

export const TelaCriarEvento = () => {
  const router = useRouter();
  const { usuario } = useAuth();
  const admin = usuario?.admin === true;

  useEffect(() => {
    if (usuario && !admin) {
      router.replace("/");
    }
  }, [usuario, admin, router]);

  if (!usuario || !admin) {
    return null;
  }

  return (
    <div className={styles.tela}>
      <CabecalhoCriarEvento fotoUrl={usuario.fotoUrl} nome={usuario.nome} />
      <IntroPainelAdmin />
      <FormularioCriarEvento />
    </div>
  );
};
