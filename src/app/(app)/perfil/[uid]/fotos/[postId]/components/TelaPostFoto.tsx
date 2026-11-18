"use client";

import { useState } from "react";
import { useCamadaCheia } from "@/app/(app)/stories/camada-cheia";
import { useComentariosPost } from "../hooks/useComentariosPost";
import { usePostFoto } from "../hooks/usePostFoto";
import { AcoesPost } from "./AcoesPost";
import { CabecalhoPost } from "./CabecalhoPost";
import { CampoComentario } from "./CampoComentario";
import { ChipMarcaPost } from "./ChipMarcaPost";
import { FotoComToqueDuplo } from "./FotoComToqueDuplo";
import { ListaComentarios } from "./ListaComentarios";
import styles from "../post-foto.module.css";

type Props = {
  autorUid: string;
  postId: string;
};

export const TelaPostFoto = ({ autorUid, postId }: Props) => {
  useCamadaCheia(true);
  const detalhe = usePostFoto(postId);
  const comentarios = useComentariosPost(postId, detalhe.mudarTotal);
  const post = detalhe.post;
  const [focoPedido, setFocoPedido] = useState(0);

  return (
    <div className={styles.tela}>
      <CabecalhoPost
        autorUid={autorUid}
        postId={postId}
        autor={post?.autor}
        meu={detalhe.meu}
      />
      <div className={styles.rolagem}>
        {detalhe.carregando ? <div className={styles.fotoEsqueleto} aria-busy="true" /> : null}
        {detalhe.naoEncontrado ? <p className={styles.estado}>Esta foto não existe mais.</p> : null}
        {detalhe.erro ? (
          <div className={styles.estado}>
            <p>Não foi possível abrir a foto.</p>
            <button type="button" className={styles.secundario} onClick={() => void detalhe.recarregar()}>
              Tentar de novo
            </button>
          </div>
        ) : null}
        {post ? (
          <>
            <FotoComToqueDuplo
              fotoUrl={post.fotoUrl}
              legenda={post.legenda}
              onCurtirDuplo={() => void detalhe.curtirSo()}
            />
            <div className={styles.corpo}>
              {post.marca ? <ChipMarcaPost marca={post.marca} /> : null}
              {post.legenda ? <p className={styles.legenda}>{post.legenda}</p> : null}
              <AcoesPost
                encaminhado={post.encaminhadoPorMim}
                meu={detalhe.meu}
                ocupado={detalhe.ocupado}
                erro={detalhe.erroAcao}
                curtido={post.curtidoPorMim}
                totalCurtidas={post.totalCurtidas}
                onCurtir={() => void detalhe.alternarCurtida()}
                onComentar={() => setFocoPedido((n) => n + 1)}
                onEncaminhar={() => void detalhe.encaminhar()}
                onApagar={() => void detalhe.apagar()}
              />
              <ListaComentarios
                total={post.totalComentarios}
                itens={comentarios.itens}
                carregando={comentarios.carregando}
                erro={comentarios.erro}
                temAnteriores={Boolean(comentarios.cursor)}
                carregandoMais={comentarios.carregandoMais}
                onAnteriores={() => void comentarios.carregarAnteriores()}
                onTentar={() => void comentarios.recarregar()}
                onApagar={(id) => void comentarios.apagar(id)}
              />
            </div>
          </>
        ) : null}
      </div>
      {post ? (
        <CampoComentario
          enviando={comentarios.enviando}
          erro={comentarios.erroEnvio}
          onEnviar={comentarios.enviar}
          focoPedido={focoPedido}
        />
      ) : null}
    </div>
  );
};
