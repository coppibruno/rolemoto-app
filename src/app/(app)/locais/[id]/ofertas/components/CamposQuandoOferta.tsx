import type { ErrosOferta, FormOferta } from "../hooks/useFormularioOferta";
import { CampoOferta } from "./CampoOferta";
import { SeletorDiasOferta } from "./SeletorDiasOferta";
import styles from "../../ofertas.module.css";

type Props = {
  form: FormOferta;
  erros: ErrosOferta;
  alterar: <K extends keyof FormOferta>(campo: K, valor: FormOferta[K]) => void;
};

export const CamposQuandoOferta = ({ form, erros, alterar }: Props) => (
  <>
    <CampoOferta rotulo="Dias" grupo erro={erros.dias} ajuda="Nenhum marcado vale todo dia">
      <SeletorDiasOferta dias={form.dias} onChange={(dias) => alterar("dias", dias)} />
    </CampoOferta>
    <CampoOferta
      rotulo="Horário (opcional)"
      grupo
      erro={erros.faixa}
      ajuda="Deixe os dois vazios para valer o dia todo"
    >
      <div className={styles.linha2}>
        <input
          type="time"
          className={`${styles.input} ${erros.faixa ? styles.inputComErro : ""}`}
          value={form.horaInicio}
          onChange={(e) => alterar("horaInicio", e.target.value)}
          aria-label="Início"
        />
        <input
          type="time"
          className={`${styles.input} ${erros.faixa ? styles.inputComErro : ""}`}
          value={form.horaFim}
          onChange={(e) => alterar("horaFim", e.target.value)}
          aria-label="Fim"
        />
      </div>
    </CampoOferta>
  </>
);
