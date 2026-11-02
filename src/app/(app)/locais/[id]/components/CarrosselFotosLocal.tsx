"use client";

import { useCarrosselFotos } from "../hooks/useCarrosselFotos";
import styles from "../local-detalhe.module.css";

type Props = {
  fotos: string[];
  nome: string;
  elevarBolinhas?: boolean;
};

export const CarrosselFotosLocal = ({ fotos, nome, elevarBolinhas }: Props) => {
  const { trilhoRef, indice, aoRolar, irPara } = useCarrosselFotos(fotos.length);
  const varias = fotos.length > 1;

  const aoTecla = (tecla: string) => {
    if (tecla === "ArrowRight") irPara(indice + 1);
    if (tecla === "ArrowLeft") irPara(indice - 1);
  };

  return (
    <div className={styles.carrossel}>
      <div
        ref={trilhoRef}
        className={styles.trilho}
        onScroll={varias ? aoRolar : undefined}
        onKeyDown={
          varias
            ? (evento) => {
                if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
                evento.preventDefault();
                aoTecla(evento.key);
              }
            : undefined
        }
        tabIndex={varias ? 0 : undefined}
        aria-roledescription="carrossel"
        aria-label={`Fotos de ${nome}`}
      >
        {fotos.map((url, i) => (
          <div className={styles.slide} key={`${i}-${url}`}>
            <img
              src={url}
              alt={`${nome}, foto ${i + 1} de ${fotos.length}`}
              className={styles.heroCapaImg}
              draggable={false}
            />
          </div>
        ))}
      </div>
      {varias ? (
        <>
          <button
            type="button"
            className={`${styles.seta} ${styles.setaEsq}`}
            aria-label="Foto anterior"
            disabled={indice === 0}
            onClick={() => irPara(indice - 1)}
          >
            <span className="material-symbols-outlined" aria-hidden>
              chevron_left
            </span>
          </button>
          <button
            type="button"
            className={`${styles.seta} ${styles.setaDir}`}
            aria-label="Próxima foto"
            disabled={indice === fotos.length - 1}
            onClick={() => irPara(indice + 1)}
          >
            <span className="material-symbols-outlined" aria-hidden>
              chevron_right
            </span>
          </button>
          <div
            className={`${styles.bolinhas} ${elevarBolinhas ? styles.bolinhasAltas : ""}`}
            role="tablist"
            aria-label="Fotos"
          >
            {fotos.map((url, i) => (
              <button
                key={`${i}-${url}`}
                type="button"
                role="tab"
                className={`${styles.bolinha} ${i === indice ? styles.bolinhaAtiva : ""}`}
                aria-label={`Foto ${i + 1} de ${fotos.length}`}
                aria-selected={i === indice}
                onClick={() => irPara(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};
