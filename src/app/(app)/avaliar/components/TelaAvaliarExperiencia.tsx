"use client";

import type { TipoAlvoAvaliacao } from "@/types/avaliacao-experiencia";
import { CabecalhoFeed } from "@/app/(app)/feed/components/CabecalhoFeed";
import { useAvaliarExperiencia } from "../hooks/useAvaliarExperiencia";
import { useFormularioAvaliacao } from "../hooks/useFormularioAvaliacao";
import { useFotosVisita } from "../hooks/useFotosVisita";
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
  const avaliar = useAvaliarExperiencia(tipo, alvoId);
  const form = useFormularioAvaliacao(avaliar.enviando);
  const fotos = useFotosVisita();
  const mostrarForm =
    avaliar.visao === "form" || avaliar.visao === "enviado";
  const podeEnviar =
    form.podeEnviarBase && !fotos.enviandoFotos && Boolean(avaliar.uid);

  const publicar = async () => {
    if (!form.payloadBase || !avaliar.uid) return;
    const urls = await fotos.uploadTodas(avaliar.uid, tipo, alvoId);
    await avaliar.enviar({
      ...form.payloadBase,
      fotosUrls: urls,
    });
    fotos.limpar();
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
          <CabecalhoAvaliar onVoltar={avaliar.voltar} />
          <CardAlvoAvaliacao alvo={avaliar.alvo} />
          {mostrarForm ? (
            <>
              <SeletorNotaExperiencia
                nota={form.nota}
                onNota={form.setNota}
                focarPrimeira={avaliar.visao === "form"}
              />
              <CampoRelatoPiloto
                valor={form.comentario}
                onChange={form.alterarComentario}
              />
              <FotosVisita
                fotos={fotos.fotos}
                podeAnexar={fotos.podeAnexar}
                erroFoto={fotos.erroFoto}
                inputRef={fotos.inputRef}
                onAnexar={fotos.anexar}
                onRemover={fotos.remover}
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
