import styles from "./oferta-local.module.css";

type Props = {
  className?: string;
};

export const SeloParceiro = ({ className }: Props) => (
  <span className={`${styles.selo} ${className ?? ""}`}>Parceiro</span>
);
