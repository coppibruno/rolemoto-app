"use client";

import { CabecalhoOfertas } from "../../components/CabecalhoOfertas";
import { useFormularioOferta } from "../hooks/useFormularioOferta";
import { CampoOferta } from "./CampoOferta";
import { CamposQuandoOferta } from "./CamposQuandoOferta";
import { CamposValorOferta } from "./CamposValorOferta";
import { SegmentoTipoOferta } from "./SegmentoTipoOferta";
import styles from "../../ofertas.module.css";

type Props = {
  localId: string;
  ofertaId: string | null;
};

export const TelaFormularioOferta = ({ localId, ofertaId }: Props) => {
  const { form, alterar, erros, carregando, salvando, salvar, hrefBalcao } =
    useFormularioOferta(localId, ofertaId);
  const classeInput = (erro?: string) => `${styles.input} ${erro ? styles.inputComErro : ""}`;

  return (
    <div className={styles.tela}>
      <CabecalhoOfertas titulo={ofertaId ? "Editar oferta" : "Nova oferta"} hrefVoltar={hrefBalcao} />
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void salvar();
        }}
        aria-busy={carregando}
      >
        <SegmentoTipoOferta valor={form.tipo} onChange={(tipo) => alterar("tipo", tipo)} />
        <CampoOferta rotulo="O que é" erro={erros.titulo}>
          <input
            className={classeInput(erros.titulo)}
            maxLength={60}
            placeholder="Combo do piloto"
            value={form.titulo}
            onChange={(e) => alterar("titulo", e.target.value)}
          />
        </CampoOferta>
        <CamposValorOferta form={form} erros={erros} alterar={alterar} />
        <CampoOferta rotulo="Código" erro={erros.codigo} ajuda="O mesmo que você combinou com o caixa">
          <input
            className={classeInput(erros.codigo)}
            maxLength={8}
            autoCapitalize="characters"
            placeholder="MOTO10"
            value={form.codigo}
            onChange={(e) => alterar("codigo", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          />
        </CampoOferta>
        <CampoOferta rotulo="Regra" erro={erros.regra}>
          <textarea
            className={`${styles.textarea} ${erros.regra ? styles.inputComErro : ""}`}
            maxLength={280}
            placeholder="Na compra do café. Um por piloto."
            value={form.regra}
            onChange={(e) => alterar("regra", e.target.value)}
          />
        </CampoOferta>
        <CamposQuandoOferta form={form} erros={erros} alterar={alterar} />
        {erros.geral ? (
          <p className={styles.erro} role="alert">
            {erros.geral}
          </p>
        ) : null}
        <button type="submit" className={styles.cta} disabled={carregando || salvando}>
          {salvando ? "Salvando…" : ofertaId ? "Salvar" : "Publicar oferta"}
        </button>
      </form>
    </div>
  );
};
