"use client";

import { useEffect } from "react";
import type { TipoAlvoAvaliacao } from "@/types/avaliacao-experiencia";
import { CabecalhoFeed } from "@/app/(app)/feed/components/CabecalhoFeed";
import { useAvaliarExperiencia } from "../hooks/useAvaliarExperiencia";
import { useFormularioAvaliacao } from "../hooks/useFormularioAvaliacao";
import { useFotosVisita } from "../hooks/useFotosVisita";
import { TITULO_PAGINA_EDITAR } from "../constants";
import { AcoesAvaliar } from "./AcoesAvaliar";
import { CabecalhoAvaliar } from "./CabecalhoAvaliar";
import { CampoRelatoPiloto } from "./CampoRelatoPiloto";
import { CardAlvoAvaliacao } from "./CardAlvoAvaliacao";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoErro } from "./EstadoErro";
import { FotosVisita } from "./FotosVisita";
import { ListaAvaliacoes } from "./ListaAvaliacoes";
import { SeletorNotaExperiencia } from "./SeletorNotaExperiencia";
import { ToggleRecomendaComboio } from "./ToggleRecomendaComboio";
import styles from "../avaliar.module.css";

type Props = {
  tipo: TipoAlvoAvaliacao;
  alvoId: string;
};

export const TelaAvaliarExperiencia = ({ tipo, alvoId }: Props) => {
  const avaliar = useAvaliarExperiencia(tipo, alvoId, "form");
  const form = useFormularioAvaliacao(avaliar.enviando, avaliar.minha);
  const fotos = useFotosVisita();
  const mostrarForm =
    avaliar.visao === "form" || avaliar.visao === "enviado";
  const podeEnviar =
    form.podeEnviarBase && !fotos.enviandoFotos && Boolean(avaliar.uid);

  useEffect(() => {
    if (!avaliar.minha) {
      fotos.limpar();
      return;
    }
    fotos.definirRemotas(avaliar.minha.fotosUrls);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sincroniza fotos só quando a avaliação muda
  }, [avaliar.minha?.id, avaliar.minha?.updatedAt]);

  const publicar = async () => {
    if (!form.payloadBase || !avaliar.uid) return;
    const editando = form.modoEdicao;
    const urls = await fotos.uploadTodas(avaliar.uid, tipo, alvoId);
    await avaliar.enviar({
      ...form.payloadBase,
      fotosUrls: urls,
    });
    if (!editando) {
      fotos.limpar();
    }
  };

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />
      {avaliar.carregando ? <EstadoCarregando /> : null}
      {!avaliar.carregando && avaliar.erro ? (
        <EstadoErro
          titulo={avaliar.erro.titulo}
          corpo={avaliar.erro.corpo}
          onVoltar={avaliar.voltar}
          onTentar={avaliar.erro.podeTentar ? avaliar.recarregar : undefined}
        />
      ) : null}
      {!avaliar.carregando && avaliar.alvo && !avaliar.erro ? (
        <div className={styles.corpo}>
          <CabecalhoAvaliar
            onVoltar={avaliar.voltar}
            titulo={form.modoEdicao ? TITULO_PAGINA_EDITAR : undefined}
          />
          <CardAlvoAvaliacao alvo={avaliar.alvo} />
          {avaliar.toast ? (
            <p className={styles.toastSucesso} role="status">
              {avaliar.toast}
            </p>
          ) : null}
          {mostrarForm ? (
            <>
              <SeletorNotaExperiencia
                nota={form.nota}
                onNota={form.setNota}
                focarPrimeira={avaliar.visao === "form" && !form.modoEdicao}
              />
              <CampoRelatoPiloto
                valor={form.comentario}
                onChange={form.alterarComentario}
              />
              <FotosVisita
                fotos={fotos.fotos}
                urlsRemotas={fotos.urlsRemotas}
                podeAnexar={fotos.podeAnexar}
                erroFoto={fotos.erroFoto}
                inputRef={fotos.inputRef}
                onAnexar={fotos.anexar}
                onRemover={fotos.remover}
                onRemoverRemota={fotos.removerRemota}
                onAbrirSeletor={fotos.abrirSeletor}
              />
              <ToggleRecomendaComboio
                ativo={form.recomendaComboio}
                onChange={form.setRecomendaComboio}
              />
            </>
          ) : (
            <ListaAvaliacoes
              avaliacoes={avaliar.avaliacoes}
              uid={avaliar.uid}
            />
          )}
          <AcoesAvaliar
            podeEnviar={podeEnviar}
            enviando={avaliar.enviando || fotos.enviandoFotos}
            enviado={avaliar.visao === "enviado"}
            erroEnvio={avaliar.erroEnvio}
            mostrarForm={mostrarForm}
            modoEdicao={form.modoEdicao}
            onEnviar={() => {
              void publicar();
            }}
            onCancelar={avaliar.voltar}
            onVoltarFeed={avaliar.voltarAoFeed}
          />
        </div>
      ) : null}
    </div>
  );
};
