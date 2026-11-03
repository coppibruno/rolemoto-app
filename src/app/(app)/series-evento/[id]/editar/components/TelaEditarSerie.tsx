"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { FormularioCriarEvento } from "@/app/(app)/criar-evento/components/FormularioCriarEvento";
import type { SerieEvento } from "@/types/serie-evento";
import { GuardaAdmin } from "../../../components/GuardaAdmin";
import { seriesEventoService } from "../../../services/series-evento.service";
import styles from "../../../series-evento.module.css";

export const TelaEditarSerie = ({ id }: { id: string }) => {
  const [serie, setSerie] = useState<SerieEvento | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    seriesEventoService
      .buscar(id)
      .then((detalhe) => setSerie(detalhe.serie))
      .catch((falha) => {
        setErro(falha instanceof ApiError ? falha.message : "Não foi possível carregar");
      });
  }, [id]);

  return (
    <GuardaAdmin>
      <div className={styles.tela}>
        <header className={styles.cabecalho}>
          <Link href={`/series-evento/${id}`} className={styles.voltar} aria-label="Voltar">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className={styles.titulo}>Editar o rito</h1>
        </header>
        {erro ? (
          <p className={styles.erro} role="alert">
            {erro}
          </p>
        ) : null}
        {serie ? <FormularioCriarEvento serieInicial={serie} /> : null}
      </div>
    </GuardaAdmin>
  );
};
