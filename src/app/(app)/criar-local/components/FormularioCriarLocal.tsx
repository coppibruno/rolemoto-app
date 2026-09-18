"use client";

import { useFormularioCriarLocal } from "../hooks/useFormularioCriarLocal";
import { BotaoCancelar } from "./BotaoCancelar";
import { BotaoSalvarLocal } from "./BotaoSalvarLocal";
import { CampoEnderecoLocal } from "./CampoEnderecoLocal";
import { CampoLinkMaps } from "./CampoLinkMaps";
import { CampoNomeLocal } from "./CampoNomeLocal";
import { FotoFachada } from "./FotoFachada";
import { ListaFacilidades } from "./ListaFacilidades";
import { SeletorCategoriaLocal } from "./SeletorCategoriaLocal";
import { SeletorHorarioLocal } from "./SeletorHorarioLocal";
import { ToastSucesso } from "./ToastSucesso";
import styles from "../criar-local.module.css";

export const FormularioCriarLocal = () => {
  const form = useFormularioCriarLocal();
  const desabilitado = form.salvando;

  return (
    <form className={styles.formulario} onSubmit={form.salvar} noValidate>
      <CampoNomeLocal
        valor={form.nome}
        onChange={form.setNome}
        erro={form.erros.nome}
        desabilitado={desabilitado}
      />
      <CampoEnderecoLocal
        campo={form.endereco}
        erro={form.erros.endereco}
        desabilitado={desabilitado}
      />
      <SeletorCategoriaLocal
        valor={form.categoria}
        onChange={form.setCategoria}
        erro={form.erros.categoria}
        desabilitado={desabilitado}
      />
      <ListaFacilidades
        valores={form.facilidades}
        onAlternar={form.alternarFacilidade}
        desabilitado={desabilitado}
      />
      <SeletorHorarioLocal
        aberto24h={form.aberto24h}
        horarios={form.horarios}
        onMudarModo={form.setAberto24h}
        onMudarDia={form.atualizarHorario}
        erro={form.erros.horario}
        desabilitado={desabilitado}
      />
      <CampoLinkMaps
        valor={form.linkMaps}
        onChange={form.setLinkMaps}
        erro={form.erros.linkMaps}
        desabilitado={desabilitado}
      />
      <FotoFachada
        previewUrl={form.foto.previewUrl}
        erro={form.foto.erro ?? form.erros.foto}
        desabilitado={desabilitado}
        inputRef={form.foto.inputRef}
        onAbrirSeletor={form.foto.abrirSeletor}
        onSelecionar={form.foto.aoSelecionarArquivo}
        onRemover={form.foto.remover}
      />
      {form.erroGeral ? (
        <p className={styles.erroGeral} role="alert">
          <span className="material-symbols-outlined">warning</span>
          {form.erroGeral}
        </p>
      ) : null}
      <div className={styles.acoes}>
        <BotaoSalvarLocal salvando={form.salvando} />
        <BotaoCancelar desabilitado={desabilitado} />
      </div>
      <ToastSucesso visivel={form.sucesso} />
    </form>
  );
};
