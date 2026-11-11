import Link from "next/link";
import { AvatarStories } from "@/app/(app)/components/AvatarStories";
import { BotaoSeguir } from "@/app/(app)/seguir/components/BotaoSeguir";
import {
  LABEL_PILOTAGEM,
  LABEL_TIPO_MOTO_BADGE,
} from "@/components/perfil/constants-tipo-moto";
import type { PerfilPublico } from "@/types/perfil-publico";
import type { Pilotagem } from "@/types/user";
import { FaixaConquistas } from "./FaixaConquistas";
import { FaixaSelos } from "./FaixaSelos";
import styles from "../perfil-publico.module.css";

type Props = {
  perfil: PerfilPublico;
};

const classeRitmo: Record<Pilotagem, string> = {
  tranquila: styles.ritmoTranquila,
  moderada: styles.ritmoModerada,
  agressiva: styles.ritmoAgressiva,
};

export const CartaoPiloto = ({ perfil }: Props) => {
  const cidade = perfil.cidade?.trim() ?? "";

  return (
    <section className={styles.cartaoPiloto} aria-label="Identidade do piloto">
      <div className={styles.identidade}>
        <AvatarStories
          uid={perfil.uid}
          fotoUrl={perfil.fotoUrl}
          nome={perfil.nome}
          tamanho="cartao"
        />
        <div className={styles.identidadeTextos}>
          <span className={styles.nome}>{perfil.nome}</span>
          {perfil.apelido ? <span className={styles.apelido}>@{perfil.apelido}</span> : null}
          <span className={`${styles.pillRitmo} ${classeRitmo[perfil.pilotagem]}`}>
            {LABEL_PILOTAGEM[perfil.pilotagem]}
          </span>
        </div>
      </div>

      <div className={styles.contadores}>
        <Link
          href={`/perfil/${perfil.uid}/seguindo?aba=seguindo`}
          className={styles.contador}
        >
          <span className={styles.contadorNumero}>{perfil.seguindo ?? 0}</span>
          <span className={styles.contadorRotulo}>seguindo</span>
        </Link>
        <Link
          href={`/perfil/${perfil.uid}/seguindo?aba=seguidores`}
          className={styles.contador}
        >
          <span className={styles.contadorNumero}>{perfil.seguidores ?? 0}</span>
          <span className={styles.contadorRotulo}>seguidores</span>
        </Link>
      </div>

      {typeof perfil.seguidoPorMim === "boolean" ? (
        <div className={styles.blocoSeguir}>
          {perfil.segueVoce ? <p className={styles.segueVoceCartao}>Segue você</p> : null}
          <BotaoSeguir
            uid={perfil.uid}
            apelido={perfil.apelido}
            seguido={perfil.seguidoPorMim}
            largo
          />
        </div>
      ) : null}

      <div className={styles.divisor} role="presentation" />

      <dl className={styles.ficha}>
        <div className={styles.fichaLinha}>
          <dt className={styles.fichaRotulo}>
            <span className="material-symbols-outlined" aria-hidden>
              two_wheeler
            </span>
            Moto
          </dt>
          <dd className={styles.fichaValor}>
            <span className={styles.motoNome}>{perfil.moto || "—"}</span>
            {perfil.tipoMoto ? (
              <span className={styles.badgeTipo}>{LABEL_TIPO_MOTO_BADGE[perfil.tipoMoto]}</span>
            ) : null}
          </dd>
        </div>
        {cidade ? (
          <div className={styles.fichaLinha}>
            <dt className={styles.fichaRotulo}>
              <span className="material-symbols-outlined" aria-hidden>
                location_on
              </span>
              Cidade
            </dt>
            <dd className={styles.fichaValor}>{cidade}</dd>
          </div>
        ) : null}
        {perfil.garupaFrequente ? (
          <div className={styles.fichaLinha}>
            <dt className={styles.fichaRotulo}>
              <span className="material-symbols-outlined" aria-hidden>
                group
              </span>
              Garupa
            </dt>
            <dd className={styles.fichaValor}>Costuma levar</dd>
          </div>
        ) : null}
      </dl>
      {(perfil.selos ?? []).length > 0 ? (
        <>
          <div className={styles.divisor} role="presentation" />
          <FaixaSelos selos={perfil.selos ?? []} />
        </>
      ) : null}
      {(perfil.conquistas ?? []).length > 0 ? (
        <>
          <div className={styles.divisor} role="presentation" />
          <FaixaConquistas conquistas={perfil.conquistas ?? []} />
        </>
      ) : null}
    </section>
  );
};
