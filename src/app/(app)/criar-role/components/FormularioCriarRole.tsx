"use client";

import { useFormularioCriarRole } from "../hooks/useFormularioCriarRole";
import { useModeloRole } from "../hooks/useModeloRole";
import { BotaoCancelar } from "./BotaoCancelar";
import { BotaoPublicar } from "./BotaoPublicar";
import { CampoDataHora } from "./CampoDataHora";
import { CampoDescricao } from "./CampoDescricao";
import { CampoLocalizacao } from "./CampoLocalizacao";
import { CampoTitulo } from "./CampoTitulo";
import { EstadoCarregandoModelo } from "./EstadoCarregandoModelo";
import { EstadoErroModelo } from "./EstadoErroModelo";
import { FaixaClonando } from "./FaixaClonando";
import { FotoCapa } from "./FotoCapa";
import { SeletorRitmo } from "./SeletorRitmo";
import { ToastSucesso } from "./ToastSucesso";
import {
  FAIXA_CLONANDO,
  FAIXA_EDITANDO,
  PLACEHOLDER_DESTINO,
  PLACEHOLDER_NOME_DESTINO,
  PLACEHOLDER_NOME_PARTIDA,
  PLACEHOLDER_PARTIDA,
} from "../constants";
import type { ModoCriarRole } from "../types";
import styles from "../criar-role.module.css";

type Props = {
  origemId?: string;
  editarId?: string;
  modo: ModoCriarRole;
};

export const FormularioCriarRole = ({ origemId, editarId, modo }: Props) => {
  const roleId = editarId ?? origemId;
  const { modelo, carregando, erro, recarregar } = useModeloRole(roleId);
  const form = useFormularioCriarRole(modelo, modo);
  const precisaModelo = modo !== "criar";

  if (precisaModelo && (carregando || form.hidratando)) {
    return <EstadoCarregandoModelo />;
  }

  if (precisaModelo && erro) {
    return (
      <EstadoErroModelo
        erro={erro}
        hrefVoltar={modo === "editar" ? "/meus-roles" : "/perfil"}
        labelVoltar={modo === "editar" ? "Voltar aos meus rolês" : "Voltar ao perfil"}
        onTentarDeNovo={recarregar}
      />
    );
  }

  return (
    <>
      {modelo ? (
        <FaixaClonando
          rotulo={modo === "editar" ? FAIXA_EDITANDO : FAIXA_CLONANDO}
          titulo={modelo.titulo}
        />
      ) : null}
      <form className={styles.formulario} onSubmit={form.publicar} noValidate>
        <CampoTitulo
          valor={form.titulo}
          onChange={form.setTitulo}
          erro={form.erros.titulo}
          desabilitado={form.publicando}
        />

        <CampoLocalizacao
          id="partida"
          label="Partida"
          icone="trip_origin"
          placeholder={PLACEHOLDER_PARTIDA}
          placeholderNome={PLACEHOLDER_NOME_PARTIDA}
          mostrarGps
          campo={form.partida}
          erro={form.erros.partida}
          desabilitado={form.publicando}
        />

        <CampoDataHora
          dataSaida={form.dataSaida}
          horaSaida={form.horaSaida}
          onChangeData={form.setDataSaida}
          onChangeHora={form.setHoraSaida}
          erro={form.erros.dataHora}
          desabilitado={form.publicando}
        />

        <CampoLocalizacao
          id="destino"
          label="Destino Final"
          icone="location_on"
          placeholder={PLACEHOLDER_DESTINO}
          placeholderNome={PLACEHOLDER_NOME_DESTINO}
          campo={form.destino}
          erro={form.erros.destino}
          desabilitado={form.publicando}
        />

        <SeletorRitmo
          valor={form.ritmo}
          onChange={form.setRitmo}
          erro={form.erros.ritmo}
          desabilitado={form.publicando}
        />

        <FotoCapa
          previewUrl={form.foto.previewUrl}
          capaHerdada={form.foto.urlHerdada}
          erro={form.foto.erro ?? form.erros.foto}
          desabilitado={form.publicando}
          inputRef={form.foto.inputRef}
          onAbrirSeletor={form.foto.abrirSeletor}
          onSelecionar={form.foto.aoSelecionarArquivo}
          onRemover={form.foto.remover}
        />

        <CampoDescricao
          valor={form.descricao}
          onChange={form.setDescricao}
          erro={form.erros.descricao}
          desabilitado={form.publicando}
        />

        {form.erroGeral ? (
          <p className={styles.erroGeral} role="alert">
            <span className="material-symbols-outlined">warning</span>
            {form.erroGeral}
          </p>
        ) : null}

        <div className={styles.acoes}>
          <BotaoPublicar publicando={form.publicando} modo={modo} />
          <BotaoCancelar desabilitado={form.publicando} modo={modo} />
        </div>

        <ToastSucesso visivel={form.sucesso} modo={modo} />
      </form>
    </>
  );
};
