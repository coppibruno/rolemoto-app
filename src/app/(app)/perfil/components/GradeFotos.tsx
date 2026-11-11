"use client";

import Link from "next/link";
import { useGradeFotos } from "../hooks/useGradeFotos";
import { AvisoPublicacao } from "./AvisoPublicacao";
import { MiniaturaFoto } from "./MiniaturaFoto";
import styles from "../fotos-perfil.module.css";

type Props = {
  uid: string;
  propria: boolean;
};

export const GradeFotos = ({ uid, propria }: Props) => {
  const grade = useGradeFotos(uid);
  const vazia = !grade.carregando && !grade.erro && grade.itens.length === 0;

  return (
    <div className={styles.painelFotos}>
      {propria ? (
        <>
          <AvisoPublicacao />
          <Link href="/perfil/fotos/nova" className={styles.novaFoto}>
            <span className="material-symbols-outlined" aria-hidden>
              add_a_photo
            </span>
            Nova foto
          </Link>
        </>
      ) : null}
      {grade.carregando ? (
        <ul className={styles.grade} aria-busy="true" aria-label="Carregando fotos">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className={styles.esqueleto} />
          ))}
        </ul>
      ) : null}
      {grade.erro ? (
        <div className={styles.estado}>
          <p>Não foi possível carregar as fotos.</p>
          <button type="button" className={styles.secundario} onClick={() => void grade.recarregar()}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {vazia ? (
        <p className={styles.estado}>{propria ? "Poste a primeira foto" : "Nenhuma foto ainda"}</p>
      ) : null}
      {!grade.carregando && grade.itens.length > 0 ? (
        <ul className={styles.grade} aria-label="Fotos">
          {grade.itens.map((item) => (
            <MiniaturaFoto key={item.id} autorUid={uid} item={item} />
          ))}
        </ul>
      ) : null}
      {grade.cursor && !grade.carregando ? (
        <button
          type="button"
          className={styles.secundario}
          onClick={() => void grade.carregarMais()}
          disabled={grade.carregandoMais}
        >
          {grade.carregandoMais ? "Carregando…" : "Carregar mais"}
        </button>
      ) : null}
    </div>
  );
};
