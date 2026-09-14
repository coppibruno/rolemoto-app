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
  PLACEHOLDER_DESTINO,
  PLACEHOLDER_NOME_DESTINO,
  PLACEHOLDER_NOME_PARTIDA,
  PLACEHOLDER_PARTIDA,
} from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  origemId?: string;
};

export const FormularioCriarRole = ({ origemId }: Props) => {
  const { modelo, carregando, erro, recarregar } = useModeloRole(origemId);
  const form = useFormularioCriarRole(modelo);
  const modoClone = Boolean(origemId);

  if (modoClone && (carregando || form.hidratando)) {
    return <EstadoCarregandoModelo />;
  }

  if (modoClone && erro) {
    return <EstadoErroModelo erro={erro} onTentarDeNovo={recarregar} />;
  }

  return (
    <>
      {modelo ? <FaixaClonando titulo={modelo.titulo} /> : null}
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
          <BotaoPublicar publicando={form.publicando} />
          <BotaoCancelar desabilitado={form.publicando} modoClone={modoClone} />
        </div>

        <ToastSucesso visivel={form.sucesso} modoClone={modoClone} />
      </form>
    </>
  );
};
