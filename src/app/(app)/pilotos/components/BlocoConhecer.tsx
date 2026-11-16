"use client";

import { LinhaPiloto } from "@/app/(app)/seguir/components/LinhaPiloto";
import type { LinhaSugestao } from "@/types/seguir";
import type { FaseSugestao } from "../hooks/useSugestoesPilotos";
import { textoMotivoLinha } from "../motivo-linha";
import styles from "../pilotos.module.css";

type Props = {
  fase: FaseSugestao;
  itens: LinhaSugestao[];
  toast: string | null;
  onTentar: () => void;
  onSeguir: (pessoa: LinhaSugestao) => void;
  onDispensar: (uid: string) => void;
};

export const BlocoConhecer = ({
  fase,
  itens,
  toast,
  onTentar,
  onSeguir,
  onDispensar,
}: Props) => (
  <section className={styles.bloco}>
    <h2 className={styles.secao}>Conhecer</h2>
    {fase === "carregando" ? <p className={styles.aviso}>Buscando…</p> : null}
    {fase === "vazio" ? <p className={styles.aviso}>Ninguém novo por aqui agora.</p> : null}
    {fase === "erro" ? (
      <div className={styles.erro}>
        <p>Não deu para buscar agora.</p>
        <button type="button" onClick={onTentar}>
          Tentar de novo
        </button>
      </div>
    ) : null}
    {fase === "ok" ? (
      <ul className={styles.lista}>
        {itens.map((pessoa) => (
          <li key={pessoa.uid}>
            <LinhaPiloto
              pessoa={pessoa}
              motivo={textoMotivoLinha(pessoa) ?? undefined}
              onSeguiu={() => onSeguir(pessoa)}
              onAgoraNao={() => onDispensar(pessoa.uid)}
            />
          </li>
        ))}
      </ul>
    ) : null}
    {toast ? (
      <p className={styles.toast} role="status">
        {toast}
      </p>
    ) : null}
  </section>
);
