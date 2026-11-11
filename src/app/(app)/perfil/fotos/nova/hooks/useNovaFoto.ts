"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { uploadFotoPost } from "@/lib/storage";
import { LIMITE_LEGENDA } from "@/types/post-foto";
import type { MencaoOpcao } from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";
import { useCapturaFoto } from "@/app/(app)/stories/hooks/useCapturaFoto";
import { recarregarTemStories } from "@/app/(app)/stories/hooks/useTemStories";
import { guardarAvisoPublicacao } from "../../../aviso-publicacao";
import { postsService } from "../../../services/posts.service";

export const useNovaFoto = () => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legenda, setLegenda] = useState("");
  const [marca, setMarca] = useState<MencaoOpcao | null>(null);
  const [noStory, setNoStory] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const captura = useCapturaFoto(setArquivo);

  useEffect(() => {
    if (!arquivo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const publicar = async () => {
    if (!arquivo || enviando) return;
    if (!firebaseUser) {
      setErro("Sessão expirada. Entre de novo para publicar.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const fotoUrl = await uploadFotoPost(firebaseUser.uid, arquivo);
      const resposta = await postsService.publicar({
        fotoUrl,
        legenda,
        marca: marca ? { tipo: marca.tipo, id: marca.id } : null,
        encaminharStory: noStory,
      });
      if (resposta.erroStory) {
        guardarAvisoPublicacao(`A foto foi publicada. O story não foi: ${resposta.erroStory}`);
      }
      if (resposta.story) void recarregarTemStories(firebaseUser.uid);
      router.replace("/perfil");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível publicar a foto.");
      setEnviando(false);
    }
  };

  return {
    captura,
    arquivo,
    preview,
    legenda,
    setLegenda: (valor: string) => setLegenda(valor.slice(0, LIMITE_LEGENDA)),
    marca,
    setMarca,
    noStory,
    setNoStory,
    enviando,
    erro: erro ?? captura.erro,
    publicar,
  };
};
