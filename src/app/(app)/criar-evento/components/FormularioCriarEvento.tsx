"use client";

import { CTA_PUBLICAR, CTA_PUBLICANDO } from "../constants";
import { useFormularioCriarEvento } from "../hooks/useFormularioCriarEvento";
import { BannerRaio } from "./BannerRaio";
import { CampoDataHorarios } from "./CampoDataHorarios";
import { CampoInformacoes } from "./CampoInformacoes";
import { CampoLinkIngresso } from "./CampoLinkIngresso";
import { CampoLocalEvento } from "./CampoLocalEvento";
import { CampoNomeEvento } from "./CampoNomeEvento";
import { FotoFlyer } from "./FotoFlyer";
import { ListaAtracoes } from "./ListaAtracoes";
import { SeletorAcesso } from "./SeletorAcesso";
import { SeletorTipoEvento } from "./SeletorTipoEvento";
import { ToastSucesso } from "./ToastSucesso";
import styles from "../criar-evento.module.css";

export const FormularioCriarEvento = () => {
  const form = useFormularioCriarEvento();

  return (
    <>
      <form className={styles.formulario} onSubmit={form.publicar} noValidate>
        <CampoNomeEvento
          valor={form.titulo}
          onChange={form.setTitulo}
          erro={form.erros.titulo}
          desabilitado={form.publicando}
        />
        <SeletorTipoEvento
          valor={form.tipo}
          onChange={form.setTipo}
          erro={form.erros.tipo}
          desabilitado={form.publicando}
        />
        <CampoLocalEvento
          campo={form.local}
          erro={form.erros.local}
          desabilitado={form.publicando}
        />
        <CampoDataHorarios
          dataEvento={form.dataEvento}
          horaAbertura={form.horaAbertura}
          horaEncerramento={form.horaEncerramento}
          onChangeData={form.setDataEvento}
          onChangeAbertura={form.setHoraAbertura}
          onChangeEncerramento={form.setHoraEncerramento}
          erroData={form.erros.dataEvento}
          erroAbertura={form.erros.horaAbertura}
          erroEncerramento={form.erros.horaEncerramento}
          desabilitado={form.publicando}
        />
        <SeletorAcesso
          valor={form.acesso}
          onChange={form.setAcesso}
          erro={form.erros.acesso}
          desabilitado={form.publicando}
        />
        {form.acesso === "ingresso" ? (
          <CampoLinkIngresso
            valor={form.linkIngresso}
            onChange={form.setLinkIngresso}
            erro={form.erros.linkIngresso}
            desabilitado={form.publicando}
          />
        ) : null}
        <ListaAtracoes
          valores={form.atracoes}
          onToggle={form.alternarAtracao}
          desabilitado={form.publicando}
        />
        <FotoFlyer
          previewUrl={form.foto.previewUrl}
          erro={form.foto.erro ?? form.erros.foto}
          desabilitado={form.publicando}
          inputRef={form.foto.inputRef}
          onAbrirSeletor={form.foto.abrirSeletor}
          onSelecionar={form.foto.aoSelecionarArquivo}
          onRemover={form.foto.remover}
        />
        <CampoInformacoes
          valor={form.informacoes}
          onChange={form.setInformacoes}
          erro={form.erros.informacoes}
          desabilitado={form.publicando}
        />
        <BannerRaio />
        {form.erroGeral ? (
          <p className={styles.erroGeral} role="alert">
            <span className="material-symbols-outlined">warning</span>
            {form.erroGeral}
          </p>
        ) : null}
        <button
          type="submit"
          className={styles.botaoPublicar}
          disabled={form.publicando}
        >
          {form.publicando ? (
            <span className={`material-symbols-outlined ${styles.girando}`}>
              autorenew
            </span>
          ) : (
            <span className="material-symbols-outlined">publish</span>
          )}
          {form.publicando ? CTA_PUBLICANDO : CTA_PUBLICAR}
        </button>
      </form>
      <ToastSucesso visivel={form.sucesso} />
    </>
  );
};
