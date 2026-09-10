"use client";

import { COPY } from "../constants";
import { CampoTexto } from "./CampoTexto";
import styles from "../primeiro-acesso.module.css";

type Props = {
  nome: string;
  apelido: string;
  onNome: (valor: string) => void;
  onApelido: (valor: string) => void;
  erroNome?: string;
  erroApelido?: string;
  desabilitado?: boolean;
};

export const SecaoDadosPiloto = ({
  nome,
  apelido,
  onNome,
  onApelido,
  erroNome,
  erroApelido,
  desabilitado,
}: Props) => {
  return (
    <section className={styles.card}>
      <div className={styles.secaoTitulo}>
        <span className="material-symbols-outlined" aria-hidden>
          badge
        </span>
        {COPY.dadosTitulo}
      </div>
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
        id="apelido"
        label={COPY.apelidoLabel}
        hint={COPY.apelidoHint}
        hintAbaixo={COPY.apelidoHintAbaixo}
        prefixo="@"
        iconeDireita="sports_motorsports"
        placeholder={COPY.apelidoPlaceholder}
        valor={apelido}
        onChange={onApelido}
        erro={erroApelido}
        desabilitado={desabilitado}
      />
    </section>
  );
};
