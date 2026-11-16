"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { EventoDetalhe } from "@/types/evento";
import { eventoDetalheService } from "../services/evento-detalhe.service";
import styles from "../evento-detalhe.module.css";

type Props = {
  evento: EventoDetalhe;
  destacar: boolean;
  onMudou: () => void;
};

const dominioDe = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const BlocoAlbumEvento = ({ evento, destacar, onMudou }: Props) => {
  const ref = useRef<HTMLElement>(null);
  const [url, setUrl] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [destaqueAtivo, setDestaqueAtivo] = useState(destacar);

  const temAlbum = evento.albuns.length > 0;
  const mostrar =
    temAlbum || evento.possoPublicarAlbum || evento.possoGerenciarFotografo;

  useEffect(() => {
    if (!destacar || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    setDestaqueAtivo(true);
    const timer = window.setTimeout(() => setDestaqueAtivo(false), 2000);
    return () => window.clearTimeout(timer);
  }, [destacar]);

  if (!mostrar) return null;

  const adicionar = async () => {
    setErro(null);
    setOcupado(true);
    try {
      await eventoDetalheService.adicionarAlbum(evento.id, url);
      setUrl("");
      onMudou();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu para adicionar o álbum");
    } finally {
      setOcupado(false);
    }
  };

  const remover = async (albumId: string) => {
    setErro(null);
    setOcupado(true);
    try {
      await eventoDetalheService.removerAlbum(evento.id, albumId);
      onMudou();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu para remover o álbum");
    } finally {
      setOcupado(false);
    }
  };

  const removerFotografo = async () => {
    setErro(null);
    setOcupado(true);
    try {
      await eventoDetalheService.removerFotografo(evento.id);
      onMudou();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu para remover o fotógrafo");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section
      id="album-evento"
      ref={ref}
      className={`${styles.card} ${destaqueAtivo ? styles.blocoDestaque : ""}`}
      aria-labelledby="titulo-album-evento"
    >
      <h3 id="titulo-album-evento" className={styles.cardTitulo}>
        Álbum de fotos
      </h3>

      {evento.possoGerenciarFotografo ? (
        <div className={styles.fotografoLinha}>
          {evento.fotografo ? (
            <>
              <p className={styles.texto}>
                Fotógrafo: <strong>{evento.fotografo.apelido || evento.fotografo.nome}</strong>
              </p>
              <div className={styles.fotografoAcoes}>
                <Link
                  href={`/eventos/${encodeURIComponent(evento.id)}/fotografo`}
                  className={styles.linkSecundario}
                >
                  Trocar
                </Link>
                <button
                  type="button"
                  className={styles.linkSecundario}
                  disabled={ocupado}
                  onClick={() => void removerFotografo()}
                >
                  Remover
                </button>
              </div>
            </>
          ) : (
            <Link
              href={`/eventos/${encodeURIComponent(evento.id)}/fotografo`}
              className={styles.ctaExterno}
            >
              Autorizar fotógrafo
            </Link>
          )}
        </div>
      ) : evento.fotografo ? (
        <p className={styles.texto}>
          Fotógrafo: {evento.fotografo.apelido || evento.fotografo.nome}
        </p>
      ) : null}

      {temAlbum ? (
        <ul className={styles.lista}>
          {evento.albuns.map((album) => (
            <li key={album.id} className={styles.itemLista}>
              <a
                href={album.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaExterno}
              >
                Abrir álbum · {dominioDe(album.url)}
              </a>
              {evento.possoPublicarAlbum ? (
                <button
                  type="button"
                  className={styles.linkSecundario}
                  disabled={ocupado}
                  aria-label="Remover álbum"
                  onClick={() => void remover(album.id)}
                >
                  Remover
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.texto}>Ainda sem link de álbum.</p>
      )}

      {evento.possoPublicarAlbum && evento.albuns.length < 5 ? (
        <form
          className={styles.formAlbum}
          onSubmit={(e) => {
            e.preventDefault();
            void adicionar();
          }}
        >
          <label className={styles.campoAlbum}>
            <span className={styles.srOnly}>Link do álbum</span>
            <input
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={url}
              disabled={ocupado}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="Link do álbum"
            />
          </label>
          <button type="submit" className={styles.ctaExterno} disabled={ocupado || !url.trim()}>
            {ocupado ? "Salvando…" : "Adicionar álbum"}
          </button>
        </form>
      ) : null}

      {erro ? (
        <p className={styles.erroAlbum} role="alert">
          {erro}
        </p>
      ) : null}
    </section>
  );
};
