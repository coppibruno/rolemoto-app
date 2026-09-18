"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHistoricoPublico } from "../hooks/useHistoricoPublico";
import { usePerfilPublico } from "../hooks/usePerfilPublico";
import { CabecalhoVisaoComunitaria } from "./CabecalhoVisaoComunitaria";
import { CapsulaIdentidadePublica } from "./CapsulaIdentidadePublica";
import { EstadoCarregandoPublico } from "./EstadoCarregandoPublico";
import { EstadoErroPublico } from "./EstadoErroPublico";
import { GaragemPublica } from "./GaragemPublica";
import { HistoricoPublicoSecao } from "./HistoricoPublico";
import { RitmoPublico } from "./RitmoPublico";
import styles from "../perfil-publico.module.css";

type Props = {
  uid: string;
};

export const TelaPerfilPublico = ({ uid }: Props) => {
  const router = useRouter();
  const { usuario, loading: authLoading } = useAuth();
  const { perfil, carregando, naoEncontrado, erro } = usePerfilPublico(uid);
  const historico = useHistoricoPublico(uid);

  useEffect(() => {
    if (authLoading || !usuario || !uid) return;
    if (usuario.uid === uid) {
      router.replace("/perfil");
    }
  }, [authLoading, usuario, uid, router]);

  if (!uid) {
    return <EstadoErroPublico />;
  }

  if (authLoading || (usuario && usuario.uid === uid)) {
    return <EstadoCarregandoPublico />;
  }

  if (carregando) {
    return <EstadoCarregandoPublico />;
  }

  if (naoEncontrado) {
    return <EstadoErroPublico />;
  }

  if (erro || !perfil) {
    return <EstadoErroPublico mensagem={erro ?? undefined} />;
  }

  return (
    <div className={styles.tela}>
      <CabecalhoVisaoComunitaria uid={perfil.uid} nome={perfil.nome} />
      <CapsulaIdentidadePublica perfil={perfil} />
      <GaragemPublica perfil={perfil} />
      <RitmoPublico pilotagem={perfil.pilotagem} />
      <HistoricoPublicoSecao
        historico={historico.historico}
        aba={historico.aba}
        itens={historico.itens}
        carregando={historico.carregando}
        erro={historico.erro}
        onAba={historico.setAba}
      />
    </div>
  );
};
