"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoRolemoto } from "@/components/marca/LogoRolemoto";
import { normalizarCodigoAfiliado } from "@/lib/afiliado";
import {
  COPY_CODIGO_HINT,
  COPY_LINK_INEXISTENTE,
  PONTOS_AFILIADO,
  URL_APP_STORE,
  URL_PLAY_STORE,
} from "../constants";
import { useCliqueAfiliado } from "../useCliqueAfiliado";
import styles from "../afiliado.module.css";

type Props = {
  codigo: string;
};

export const TelaAfiliado = ({ codigo }: Props) => {
  const estado = useCliqueAfiliado(codigo);
  const codigoExibicao = normalizarCodigoAfiliado(codigo) ?? codigo.trim().toLowerCase();
  const [copiado, setCopiado] = useState(false);

  const copiarCodigo = async () => {
    if (!codigoExibicao) return;
    try {
      await navigator.clipboard.writeText(codigoExibicao);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className={styles.tela}>
      <header className={styles.marca}>
        <LogoRolemoto width={132} height={44} priority />
      </header>

      {estado === "carregando" ? <p className={styles.aviso}>Carregando…</p> : null}

      {estado === "inexistente" ? (
        <section className={styles.cartao}>
          <h1 className={styles.titulo}>{COPY_LINK_INEXISTENTE}</h1>
          <p className={styles.texto}>Confira o endereço com quem te mandou.</p>
          <Link href="/login" className={styles.botaoPrincipal}>
            Conhecer o Rolê Moto
          </Link>
        </section>
      ) : null}

      {estado === "ok" ? (
        <section className={styles.cartao}>
          <h1 className={styles.titulo}>Bora rodar junto?</h1>
          <p className={styles.texto}>
            O Rolê Moto é o app gratuito para quem quer companhia no rolê de moto.
          </p>

          <div className={styles.blocoCodigo}>
            <p className={styles.codigoRotulo}>Código de indicação</p>
            <p className={styles.codigoValor} aria-label={`Código ${codigoExibicao}`}>
              {codigoExibicao}
            </p>
            <button
              type="button"
              className={styles.botaoCopiar}
              onClick={() => void copiarCodigo()}
            >
              <span className="material-symbols-outlined" aria-hidden>
                {copiado ? "check" : "content_copy"}
              </span>
              {copiado ? "Copiado" : "Copiar código"}
            </button>
            <p className={styles.codigoHint}>{COPY_CODIGO_HINT}</p>
          </div>

          <ul className={styles.pontos}>
            {PONTOS_AFILIADO.map((ponto) => (
              <li key={ponto.icone} className={styles.ponto}>
                <span className="material-symbols-outlined" aria-hidden>
                  {ponto.icone}
                </span>
                <span>{ponto.texto}</span>
              </li>
            ))}
          </ul>
          <Link href="/login?modo=cadastro" className={styles.botaoPrincipal}>
            Entrar no site
          </Link>
          <div className={styles.lojas}>
            <a href={URL_APP_STORE} className={styles.botaoLoja} rel="noopener">
              <span className="material-symbols-outlined" aria-hidden>
                phone_iphone
              </span>
              App Store
            </a>
            <a href={URL_PLAY_STORE} className={styles.botaoLoja} rel="noopener">
              <span className="material-symbols-outlined" aria-hidden>
                android
              </span>
              Google Play
            </a>
          </div>
        </section>
      ) : null}
    </div>
  );
};
