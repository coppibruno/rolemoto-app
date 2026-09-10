"use client";

import { CabecalhoFeed } from "@/app/(app)/feed/components/CabecalhoFeed";
import { useFeedbackRole } from "../hooks/useFeedbackRole";
import { useFormularioFeedback } from "../hooks/useFormularioFeedback";
import { AcoesFeedback } from "./AcoesFeedback";
import { CabecalhoAvaliacao } from "./CabecalhoAvaliacao";
import { CardResumoRole } from "./CardResumoRole";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoErro } from "./EstadoErro";
import { FormularioFeedback } from "./FormularioFeedback";
import { ListaRelatosComboio } from "./ListaRelatosComboio";
import styles from "../feedback-role.module.css";

type Props = {
  roleId: string;
};

export const TelaFeedbackRole = ({ roleId }: Props) => {
  const feedback = useFeedbackRole(roleId);
  const form = useFormularioFeedback(feedback.enviando);
  const mostrarForm = feedback.visao === "form" || feedback.visao === "enviado";

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />
      {feedback.carregando ? <EstadoCarregando /> : null}
      {!feedback.carregando && feedback.erro ? (
        <EstadoErro
          titulo={feedback.erro.titulo}
          corpo={feedback.erro.corpo}
          onVoltar={feedback.voltarAoFeed}
          onTentar={feedback.erro.podeTentar ? feedback.recarregar : undefined}
        />
      ) : null}
      {!feedback.carregando && feedback.detalhe && !feedback.erro ? (
        <div className={styles.corpo}>
          <CabecalhoAvaliacao />
          <CardResumoRole detalhe={feedback.detalhe} />
          {mostrarForm ? (
            <FormularioFeedback
              nota={form.nota}
              onNota={(valor) => form.setNota(valor)}
              tags={form.tags}
              onToggleTag={form.toggleTag}
              comentario={form.comentario}
              onComentario={form.alterarComentario}
              focarPrimeira={feedback.visao === "form"}
            />
          ) : (
            <ListaRelatosComboio
              relatos={feedback.relatos}
              uid={feedback.uid}
              focarTitulo
            />
          )}
          <AcoesFeedback
            podeEnviar={form.podeEnviar}
            enviando={feedback.enviando}
            enviado={feedback.visao === "enviado"}
            erroEnvio={feedback.erroEnvio}
            mostrarPular={mostrarForm}
            onEnviar={() => {
              if (form.payload) void feedback.enviar(form.payload);
            }}
            onPular={feedback.pular}
            onVoltar={feedback.voltarAoFeed}
          />
        </div>
      ) : null}
    </div>
  );
};
