import Link from "next/link";
import type { LinhaPiloto as Linha } from "@/types/seguir";
import { BotaoSeguir } from "./BotaoSeguir";
import styles from "../seguir.module.css";

type Props = {
  pessoa: Linha;
  motivo?: string;
  onAgoraNao?: () => void;
  onSeguiu?: () => void;
};

const marcaApelido = (pessoa: Linha): string => {
  const apelido = pessoa.apelido.trim();
  const primeiro = pessoa.nome.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!apelido || apelido === "piloto" || apelido.toLowerCase() === primeiro) {
    return "";
  }
  return apelido;
};

export const LinhaPiloto = ({ pessoa, motivo, onAgoraNao, onSeguiu }: Props) => {
  const apelido = marcaApelido(pessoa);
  const cidade = pessoa.cidade.trim();

  return (
    <article className={styles.linha}>
      <Link href={`/perfil/${pessoa.uid}`} className={styles.linhaAlvo}>
        {pessoa.fotoUrl ? (
          <img
            src={pessoa.fotoUrl}
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
          <span className={styles.nomeLinha}>{pessoa.nome}</span>
          {apelido ? <span className={styles.marca}>@{apelido}</span> : null}
          {cidade ? <span className={styles.cidade}>{cidade}</span> : null}
          {pessoa.segueVoce ? <span className={styles.segueVoce}>Segue você</span> : null}
          {motivo ? <span className={styles.motivo}>{motivo}</span> : null}
        </span>
      </Link>
      <div className={styles.colunaAcao}>
        <BotaoSeguir
          uid={pessoa.uid}
          apelido={pessoa.apelido}
          seguido={pessoa.seguidoPorMim}
          onSeguiu={onSeguiu}
        />
        {onAgoraNao ? (
          <button
            type="button"
            className={styles.agoraNao}
            onClick={(evento) => {
              evento.preventDefault();
              evento.stopPropagation();
              onAgoraNao();
            }}
          >
            Agora não
          </button>
        ) : null}
      </div>
    </article>
  );
};
