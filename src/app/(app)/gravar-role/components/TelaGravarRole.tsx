"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CabecalhoTelemetria } from "@/components/telemetria/CabecalhoTelemetria";
import styles from "@/components/telemetria/telemetria.module.css";
import { useFotosVisita } from "@/app/(app)/avaliar/hooks/useFotosVisita";
import { useAuth } from "@/hooks/useAuth";
import { uploadFotoTelemetria } from "@/lib/storage";
import { useGravarRole } from "../hooks/useGravarRole";
import { BotaoControleGravacao } from "./BotaoControleGravacao";
import { ModalEconomiaBateria } from "./ModalEconomiaBateria";
import { PainelGravacaoAtiva } from "./PainelGravacaoAtiva";
import { ResumoPreSave } from "./ResumoPreSave";
import { StatusGravacao } from "./StatusGravacao";
import { ToastConquista } from "./ToastConquista";

export const TelaGravarRole = () => {
  const g = useGravarRole();
  const fotos = useFotosVisita();
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;
  const fotosSalvas = g.resumo?.fotosUrls?.join("\n") ?? "";
  const { definirRemotas } = fotos;

  useEffect(() => {
    if (fotosSalvas) definirRemotas(fotosSalvas.split("\n"));
  }, [fotosSalvas, definirRemotas]);

  const salvar = () => {
    const enviarFotos = uid
      ? async () => {
          const urls = await fotos.enviarTodas((file, tipo) =>
            uploadFotoTelemetria(uid, file, tipo),
          );
          fotos.descartarPendentes();
          fotos.definirRemotas(urls);
          return urls;
        }
      : undefined;
    void g.salvar(enviarFotos);
  };

  return (
    <div className={styles.tela}>
      <CabecalhoTelemetria titulo="Gravar rolê" hrefVoltar="/" />
      <div className={styles.conteudo}>
        {g.fase === "carregando" ? (
          <p className={styles.statusHint}>Preparando GPS…</p>
        ) : null}

        {g.fase === "web" ? (
          <section className={`${styles.card} ${styles.cardCockpit}`}>
            <StatusGravacao
              label="Disponível só no app"
              hint="O navegador para de medir quando a tela apaga."
            />
            <p className={styles.copyWeb}>
              Para gravar seu passeio com o celular no bolso, use o app Rolemoto
              no Android ou iOS.
            </p>
            <Link href="/" className={`${styles.ctaSecundario} ${styles.ctaNeutro}`}>
              Voltar ao feed
            </Link>
          </section>
        ) : null}

        {g.fase === "idle" ? (
          <section className={`${styles.card} ${styles.cardCockpit}`}>
            <StatusGravacao
              label="GPS pronto"
              hint="Permita localização sempre para medir com a tela off."
            />
            <BotaoControleGravacao
              label="Iniciar gravação"
              icone="play_circle"
              disabled={g.ocupado}
              onClick={() => void g.iniciar()}
            />
          </section>
        ) : null}

        {g.fase === "gravando" && g.iniciadoEm ? (
          <PainelGravacaoAtiva
            iniciadoEm={g.iniciadoEm}
            ocupado={g.ocupado}
            onEncerrar={() => void g.finalizar()}
          />
        ) : null}

        {g.fase === "resumo" && g.resumo ? (
          <ResumoPreSave
            dados={g.resumo}
            fotos={fotos}
            titulo={g.titulo}
            ocupado={g.ocupado}
            online={g.online}
            onTitulo={g.setTitulo}
            onPublica={g.setPublica}
            onSalvar={salvar}
            onDescartar={() => {
              fotos.limpar();
              void g.descartar();
            }}
          />
        ) : null}

        <ToastConquista frases={g.frasesConquista} />

        {g.erroCodigo === "economia_bateria" ? (
          <ModalEconomiaBateria
            onDesativar={() => void g.abrirAjustesEconomia()}
            onFechar={g.fecharErro}
          />
        ) : null}

        {g.aviso ? (
          <p className={styles.aviso} role="status">
            <span className="material-symbols-outlined" aria-hidden>
              cloud_upload
            </span>
            {g.aviso}
          </p>
        ) : null}

        {g.erro && g.erroCodigo !== "economia_bateria" ? (
          <div>
            <p className={styles.erro} role="alert">
              {g.erro}
            </p>
            {g.erroCodigo === "permissao_background" ? (
              <button
                type="button"
                className={styles.ctaSecundario}
                onClick={() => void g.abrirAjustes()}
              >
                Abrir ajustes
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
