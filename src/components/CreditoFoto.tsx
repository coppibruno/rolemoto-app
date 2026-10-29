import styles from "./credito-foto.module.css";

type Props = {
  texto?: string | null;
};

export const CreditoFoto = ({ texto }: Props) => {
  const credito = texto?.trim() ?? "";
  if (!credito) {
    return null;
  }
  return <p className={styles.credito}>Foto: {credito}</p>;
};
