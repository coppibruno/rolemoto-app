"use client";

import { COPY } from "../constants";
import { CampoTexto } from "./CampoTexto";
import styles from "../primeiro-acesso.module.css";

type Props = {
  nome: string;
  moto: string;
  onNome: (valor: string) => void;
  onMoto: (valor: string) => void;
  erroNome?: string;
  erroMoto?: string;
  desabilitado?: boolean;
};

export const SecaoDadosPiloto = ({
  nome,
  moto,
  onNome,
  onMoto,
  erroNome,
  erroMoto,
  desabilitado,
}: Props) => {
  return (
    <section className={styles.campos}>
      <CampoTexto
        id="nome-completo"
        label={COPY.nomeLabel}
        icone="person"
        placeholder={COPY.nomePlaceholder}
        valor={nome}
        onChange={onNome}
        erro={erroNome}
        desabilitado={desabilitado}
        autoComplete="name"
      />
      <CampoTexto
        id="moto"
        label={COPY.motoLabel}
        icone="two_wheeler"
        placeholder={COPY.motoPlaceholder}
        valor={moto}
        onChange={onMoto}
        erro={erroMoto}
        desabilitado={desabilitado}
      />
    </section>
  );
};
