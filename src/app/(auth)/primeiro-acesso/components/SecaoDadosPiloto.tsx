"use client";

import { COPY } from "../constants";
import { CampoTexto } from "./CampoTexto";
import styles from "../primeiro-acesso.module.css";

type Props = {
  nome: string;
  moto: string;
  codigoAfiliado: string;
  codigoVeioDoLink: boolean;
  onNome: (valor: string) => void;
  onMoto: (valor: string) => void;
  onCodigoAfiliado: (valor: string) => void;
  erroNome?: string;
  erroMoto?: string;
  erroCodigo?: string;
  desabilitado?: boolean;
};

export const SecaoDadosPiloto = ({
  nome,
  moto,
  codigoAfiliado,
  codigoVeioDoLink,
  onNome,
  onMoto,
  onCodigoAfiliado,
  erroNome,
  erroMoto,
  erroCodigo,
  desabilitado,
}: Props) => {
  const hintCodigo =
    codigoVeioDoLink && codigoAfiliado.trim()
      ? COPY.codigoHintPreenchido
      : COPY.codigoHint;

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
      <CampoTexto
        id="codigo-indicacao"
        label={COPY.codigoLabel}
        icone="confirmation_number"
        placeholder={COPY.codigoPlaceholder}
        valor={codigoAfiliado}
        onChange={onCodigoAfiliado}
        erro={erroCodigo}
        hint={hintCodigo}
        desabilitado={desabilitado}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="text"
      />
    </section>
  );
};
