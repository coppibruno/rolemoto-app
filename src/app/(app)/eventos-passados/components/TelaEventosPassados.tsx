"use client";

import Link from "next/link";
import { GuardaAdmin } from "@/app/(app)/components/GuardaAdmin";
import { formatarPeriodoEvento } from "@/app/(app)/feed/formatar-horario";
import { useEventosPassados } from "../hooks/useEventosPassados";
import styles from "../eventos-passados.module.css";

export const TelaEventosPassados = () => {
  const lista = useEventosPassados();

  return (
    <GuardaAdmin>
      <div className={styles.tela}>
        <header className={styles.cabecalho}>
          <Link href="/explorar" className={styles.voltar} aria-label="Voltar ao Explorar">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className={styles.titulo}>Eventos passados</h1>
          <span className={styles.espaco} aria-hidden />
        </header>

        <p className={styles.apoio}>
          Últimos 60 dias. Abra a data para autorizar o fotógrafo ou colar o álbum.
        </p>

        {lista.carregando ? <p className={styles.apoio}>Carregando…</p> : null}
        {lista.erro ? (
          <p className={styles.erro} role="alert">
            {lista.erro}{" "}
            <button type="button" onClick={lista.recarregar}>
              Tentar de novo
            </button>
          </p>
        ) : null}
        {!lista.carregando && !lista.erro && lista.itens.length === 0 ? (
          <p className={styles.vazio}>Nenhum evento encerrado neste período.</p>
        ) : null}

        {lista.itens.length > 0 ? (
          <ul className={styles.lista}>
            {lista.itens.map((item) => {
              const quando = formatarPeriodoEvento(
                item.dataHoraAbertura,
                item.dataHoraEncerramento,
              );
              const selo =
                item.totalAlbuns > 0
                  ? `${item.totalAlbuns} álbum${item.totalAlbuns > 1 ? "s" : ""}`
                  : item.fotografoId
                    ? "Fotógrafo"
                    : "Sem álbum";
              return (
                <li key={item.id}>
                  <Link
                    href={`/eventos/${encodeURIComponent(item.id)}`}
                    className={styles.cartao}
                  >
                    {item.fotoCapaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.fotoCapaUrl} alt="" className={styles.capa} />
                    ) : (
                      <span className={styles.capaVazia} aria-hidden>
                        <span className="material-symbols-outlined">local_activity</span>
                      </span>
                    )}
                    <span className={styles.textos}>
                      <span className={styles.nome}>{item.titulo}</span>
                      <span className={styles.meta}>
                        {quando}
                        {item.localNome ? ` · ${item.localNome}` : ""}
                        {item.cancelada ? " · Cancelada" : ""}
                      </span>
                    </span>
                    <span
                      className={`${styles.selo} ${item.totalAlbuns > 0 ? styles.seloOk : ""}`}
                    >
                      {selo}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </GuardaAdmin>
  );
};
