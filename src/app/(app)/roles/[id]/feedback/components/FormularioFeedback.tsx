"use client";

import type { NotaFeedback, TagFeedback } from "@/types/usuario-role-feedback";
import type { NotaFormulario } from "../hooks/useFormularioFeedback";
import { AvisoVisibilidade } from "./AvisoVisibilidade";
import { CampoRelato } from "./CampoRelato";
import { SeletorNota } from "./SeletorNota";
import { TagsDestaque } from "./TagsDestaque";

type Props = {
  nota: NotaFormulario;
  onNota: (nota: NotaFeedback) => void;
  tags: Set<TagFeedback>;
  onToggleTag: (tag: TagFeedback) => void;
  comentario: string;
  onComentario: (valor: string) => void;
  focarPrimeira: boolean;
};

export const FormularioFeedback = ({
  nota,
  onNota,
  tags,
  onToggleTag,
  comentario,
  onComentario,
  focarPrimeira,
}: Props) => {
  return (
    <>
      <SeletorNota nota={nota} onNota={onNota} focarPrimeira={focarPrimeira} />
      <TagsDestaque selecionadas={tags} onToggle={onToggleTag} />
      <CampoRelato valor={comentario} onChange={onComentario} />
      <AvisoVisibilidade />
    </>
  );
};
