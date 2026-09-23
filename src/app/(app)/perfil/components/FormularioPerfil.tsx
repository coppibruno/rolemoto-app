"use client";

import type { ReactNode } from "react";
import type { Usuario } from "@/types/user";
import { useFormularioPerfil } from "../hooks/useFormularioPerfil";
import { HINT_CIDADE } from "../constants";
import { CampoTexto } from "./CampoTexto";
import { CartaoIdentidade } from "./CartaoIdentidade";
import { SecaoGaragem } from "./SecaoGaragem";
import { SeletorPilotagem } from "./SeletorPilotagem";
import { BotaoCriarSenha } from "./BotaoCriarSenha";
import { BotaoInstalarApp } from "./BotaoInstalarApp";
import { BotaoSair } from "./BotaoSair";
import { BotaoExcluirConta } from "./BotaoExcluirConta";
import { ToastSucesso } from "./ToastSucesso";
import styles from "../perfil.module.css";

type Props = {
  usuario: Usuario;
  antesDasAcoes?: ReactNode;
};

export const FormularioPerfil = ({ usuario, antesDasAcoes }: Props) => {
  const form = useFormularioPerfil(usuario);

  return (
    <form className={styles.formulario} onSubmit={form.salvar} noValidate>
      <CartaoIdentidade
        nome={form.nome}
        apelido={form.apelido}
        previewUrl={form.foto.previewUrl}
        erroFoto={form.foto.erro ?? form.erros.foto}
        desabilitado={form.salvando}
        inputRef={form.foto.inputRef}
        onAbrirSeletor={form.foto.abrirSeletor}
        onSelecionarFoto={form.foto.aoSelecionarArquivo}
      />

      <div className={styles.secaoCabecalho}>
        <span className={styles.secaoBarra} />
        <h2 className={styles.secaoTitulo}>Dados do Piloto</h2>
      </div>

      <CampoTexto
        id="nome-completo"
        label="Nome Completo"
        hint="obrigatório"
        hintDestaque
        icone="person"
        valor={form.nome}
        onChange={form.setNome}
        erro={form.erros.nome}
        desabilitado={form.salvando}
        autoComplete="name"
      />

      <CampoTexto
        id="apelido"
        label="Apelido"
        hint="visível no comboio"
        icone="alternate_email"
        valor={form.apelido}
        onChange={form.setApelido}
        erro={form.erros.apelido}
        desabilitado={form.salvando}
      />

      <SecaoGaragem
        moto={form.moto}
        tipoMoto={form.tipoMoto}
        garupaFrequente={form.garupaFrequente}
        onMoto={form.setMoto}
        onTipoMoto={form.setTipoMoto}
        onGarupa={form.setGarupaFrequente}
        erroMoto={form.erros.moto}
        erroTipoMoto={form.erros.tipoMoto}
        desabilitado={form.salvando}
      />

      <CampoTexto
        id="cidade"
        label="Cidade"
        hint={HINT_CIDADE}
        icone="location_city"
        valor={form.cidade}
        onChange={form.setCidade}
        erro={form.erros.cidade}
        desabilitado={form.salvando}
        autoComplete="address-level2"
      />

      <SeletorPilotagem
        valor={form.pilotagem}
        onChange={form.setPilotagem}
        erro={form.erros.pilotagem}
        desabilitado={form.salvando}
      />

      {form.erroGeral ? (
        <p className={styles.erroGeral} role="alert">
          <span className="material-symbols-outlined">warning</span>
          {form.erroGeral}
        </p>
      ) : null}

      {antesDasAcoes}

      <ToastSucesso visivel={form.sucesso} onFechar={form.fecharToast} />

      <div className={styles.acoes}>
        <button type="submit" className={styles.botaoSalvar} disabled={form.salvando}>
          {form.salvando ? (
            <span className={styles.spinner} />
          ) : (
            <span className="material-symbols-outlined">save</span>
          )}
          {form.salvando ? "Salvando..." : "Salvar Alterações"}
        </button>
        <BotaoInstalarApp />
        <BotaoCriarSenha />
        <BotaoSair desabilitado={form.salvando} />
        <BotaoExcluirConta desabilitado={form.salvando} />
      </div>
    </form>
  );
};
