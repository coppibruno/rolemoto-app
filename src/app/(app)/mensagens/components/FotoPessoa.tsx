import styles from "../mensagens.module.css";

type Props = {
  fotoUrl: string;
  pequena?: boolean;
};

export const FotoPessoa = ({ fotoUrl, pequena }: Props) => {
  const classe = `${styles.foto} ${pequena ? styles.fotoPequena : ""}`;
  if (!fotoUrl) {
    return (
      <span className={`${classe} ${styles.fotoVazia}`} aria-hidden>
        <span className="material-symbols-outlined">person</span>
      </span>
    );
  }
  return <img src={fotoUrl} alt="" className={classe} referrerPolicy="no-referrer" />;
};
