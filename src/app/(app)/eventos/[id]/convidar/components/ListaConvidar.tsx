"use client";

import type { LinhaPiloto } from "@/types/seguir";
import type { FaseLista } from "../hooks/useConvidarEvento";
import { LinhaConvite } from "./LinhaConvite";
import styles from "../convidar.module.css";

type Props = {
  pessoas: LinhaPiloto[];
  fase: FaseLista;
  vazio: string;
  inscritos: Set<string>;
  convidados: Set<string>;
  marcados: Set<string>;
  onAlternar: (uid: string) => void;
  onTentar: () => void;
};

const estadoDe = (
  uid: string,
  inscritos: Set<string>,
  convidados: Set<string>,
  marcados: Set<string>,
) => {
  if (inscritos.has(uid)) return "inscrito" as const;
  if (convidados.has(uid)) return "convidado" as const;
  if (marcados.has(uid)) return "marcada" as const;
  return "livre" as const;
};

export const ListaConvidar = ({
  pessoas,
  fase,
  vazio,
  inscritos,
  convidados,
  marcados,
  onAlternar,
  onTentar,
}: Props) => {
  if (fase === "carregando") return <p className={styles.aviso}>Carregando…</p>;
  if (fase === "erro") {
    return (
      <div className={styles.erro}>
        <p>Não deu para carregar agora</p>
        <button type="button" onClick={onTentar}>
          Tentar de novo
        </button>
      </div>
    );
  }
  if (fase === "vazio") return <p className={styles.aviso}>{vazio}</p>;
  if (fase !== "ok") return null;

  return (
    <ul className={styles.lista}>
      {pessoas.map((pessoa) => (
        <li key={pessoa.uid}>
          <LinhaConvite
            pessoa={pessoa}
            estado={estadoDe(pessoa.uid, inscritos, convidados, marcados)}
            onAlternar={onAlternar}
          />
        </li>
      ))}
    </ul>
  );
};
