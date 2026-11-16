"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { seguirService } from "@/app/(app)/seguir/services/seguir.service";
import type { LinhaPiloto } from "@/types/seguir";
import { eventoDetalheService } from "../../services/evento-detalhe.service";
import styles from "../../convidar/convidar.module.css";

type Props = {
  id: string;
};

export const TelaAutorizarFotografo = ({ id }: Props) => {
  const router = useRouter();
  const campoRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [itens, setItens] = useState<LinhaPiloto[]>([]);
  const [fase, setFase] = useState<"carregando" | "ok" | "erro">("carregando");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    eventoDetalheService
      .buscar(id)
      .then((evento) => {
        if (cancelado) return;
        if (!evento.possoGerenciarFotografo) {
          setFase("erro");
          setMensagem("Apenas administradores");
          return;
        }
        setTitulo(evento.titulo);
        setFase("ok");
      })
      .catch((e) => {
        if (cancelado) return;
        setFase("erro");
        setMensagem(
          e instanceof ApiError && e.status === 404
            ? "Evento não encontrado"
            : e instanceof Error
              ? e.message
              : "Não deu para carregar agora",
        );
      });
    return () => {
      cancelado = true;
    };
  }, [id]);

  useEffect(() => {
    if (fase === "ok") campoRef.current?.focus();
  }, [fase]);

  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2) {
      setItens([]);
      setErroBusca(q.length === 1 ? "Digite pelo menos 2 letras" : null);
      return;
    }
    let cancelado = false;
    const timer = window.setTimeout(() => {
      seguirService
        .busca(q)
        .then((res) => {
          if (!cancelado) {
            setItens(res.itens);
            setErroBusca(null);
          }
        })
        .catch(() => {
          if (!cancelado) setErroBusca("Não deu para carregar agora");
        });
    }, 300);
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [texto]);

  const voltar = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/eventos/${id}`);
  };

  const escolher = async (uid: string) => {
    setOcupado(true);
    setMensagem(null);
    try {
      await eventoDetalheService.definirFotografo(id, uid);
      router.replace(`/eventos/${encodeURIComponent(id)}`);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Não deu para autorizar agora");
      setOcupado(false);
    }
  };

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <button type="button" className={styles.botaoVoltar} aria-label="Voltar" onClick={voltar}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className={styles.titulo}>Fotógrafo</h1>
        <span className={styles.espaco} aria-hidden />
      </header>

      {fase === "carregando" ? <p className={styles.aviso}>Carregando…</p> : null}
      {fase === "erro" ? <p className={styles.aviso}>{mensagem}</p> : null}

      {fase === "ok" ? (
        <>
          {titulo ? <p className={styles.subtitulo}>{titulo}</p> : null}
          <p className={styles.aviso}>Escolha quem pode publicar o link do álbum.</p>
          <label className={styles.campo}>
            <span className="material-symbols-outlined" aria-hidden>
              search
            </span>
            <input
              ref={campoRef}
              type="search"
              value={texto}
              placeholder="Nome ou apelido"
              aria-label="Nome ou apelido"
              enterKeyHint="search"
              autoComplete="off"
              disabled={ocupado}
              onChange={(e) => setTexto(e.target.value)}
            />
          </label>

          {erroBusca ? <p className={styles.aviso}>{erroBusca}</p> : null}
          {mensagem ? <p className={styles.aviso}>{mensagem}</p> : null}

          <ul className={styles.lista}>
            {itens.map((piloto) => (
              <li key={piloto.uid}>
                <button
                  type="button"
                  className={styles.linha}
                  disabled={ocupado}
                  onClick={() => void escolher(piloto.uid)}
                >
                  {piloto.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={piloto.fotoUrl}
                      alt=""
                      className={styles.foto}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className={styles.fotoVazia} aria-hidden>
                      <span className="material-symbols-outlined">person</span>
                    </span>
                  )}
                  <span className={styles.textos}>
                    <span className={styles.nomeLinha}>{piloto.nome}</span>
                    {piloto.apelido ? (
                      <span className={styles.marca}>@{piloto.apelido}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
};
