"use client";

import { GuardaAdmin } from "../../components/GuardaAdmin";
import { CabecalhoCriarLocal } from "./CabecalhoCriarLocal";
import { FormularioCriarLocal } from "./FormularioCriarLocal";
import { IntroPainelAdmin } from "./IntroPainelAdmin";
import styles from "../criar-local.module.css";

export const TelaCriarLocal = () => {
  return (
    <GuardaAdmin>
      <div className={styles.tela}>
        <CabecalhoCriarLocal />
        <IntroPainelAdmin />
        <FormularioCriarLocal />
      </div>
    </GuardaAdmin>
  );
};
