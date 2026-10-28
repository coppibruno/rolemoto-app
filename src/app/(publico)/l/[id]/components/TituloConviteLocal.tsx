import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  nome: string;
  endereco: string;
};

export const TituloConviteLocal = ({ nome, endereco }: Props) => {
  return (
    <section>
      <h1 className={styles.titulo}>{nome}</h1>
      <p className={styles.descricao}>{endereco}</p>
    </section>
  );
};
