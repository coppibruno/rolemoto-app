import type { ErrosOferta, FormOferta } from "../hooks/useFormularioOferta";
import { CampoOferta } from "./CampoOferta";
import styles from "../../ofertas.module.css";

type Props = {
  form: FormOferta;
  erros: ErrosOferta;
  alterar: <K extends keyof FormOferta>(campo: K, valor: FormOferta[K]) => void;
};

const classeInput = (erro?: string) => `${styles.input} ${erro ? styles.inputComErro : ""}`;

export const CamposValorOferta = ({ form, erros, alterar }: Props) => (
  <div className={styles.linha2}>
    {form.tipo !== "brinde" ? (
      <CampoOferta rotulo={form.tipo === "preco" ? "No caixa (R$)" : "Desconto (%)"} erro={erros.valor}>
        <input
          className={classeInput(erros.valor)}
          inputMode={form.tipo === "preco" ? "decimal" : "numeric"}
          placeholder={form.tipo === "preco" ? "32,00" : "10"}
          value={form.valor}
          onChange={(e) => alterar("valor", e.target.value)}
        />
      </CampoOferta>
    ) : null}
    <CampoOferta rotulo="Por dia (opcional)" erro={erros.tetoDia}>
      <input
        className={classeInput(erros.tetoDia)}
        inputMode="numeric"
        placeholder="20"
        value={form.tetoDia}
        onChange={(e) => alterar("tetoDia", e.target.value.replace(/\D/g, ""))}
      />
    </CampoOferta>
  </div>
);
