"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import styles from "../login.module.css";

type Props = {
  identificador: string;
  enviando: boolean;
  sucesso: boolean;
  erro: string | null;
  onIdentificador: (valor: string) => void;
  onEnviar: (e: React.FormEvent) => void;
  onFechar: () => void;
};

export const SheetRecuperarSenha = ({
  identificador,
  enviando,
  sucesso,
  erro,
  onIdentificador,
  onEnviar,
  onFechar,
}: Props) => {
  const cartaoRef = useFocoModal(onFechar);

  return (
    <div className={styles.overlaySheet} onClick={onFechar}>
      <div
        ref={cartaoRef}
        className={styles.cartaoSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-recuperar-senha"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titulo-recuperar-senha" className={styles.tituloSheet}>
          Recuperar senha
        </h2>
        {sucesso ? (
          <p className={styles.corpoSheet}>
            Se esse e-mail estiver cadastrado, você recebe o link em instantes.
          </p>
        ) : (
          <p className={styles.corpoSheet}>
            Enviamos um link para o e-mail da conta, se ele existir.
          </p>
        )}
        {!sucesso ? (
          <form className={styles.formSheet} onSubmit={onEnviar}>
            <label htmlFor="recuperar-id" className={styles.label}>
              E-mail ou Apelido
            </label>
            <input
              id="recuperar-id"
              type="text"
              className={`${styles.input} ${styles.inputEllipsis}`}
              value={identificador}
              onChange={(e) => onIdentificador(e.target.value)}
              placeholder="ghost_rider ou piloto@…"
              disabled={enviando}
              autoComplete="email"
              data-foco-inicial
            />
            {erro ? (
              <p className={styles.erroSheet} role="alert">
                {erro}
              </p>
            ) : null}
            <button type="submit" className={styles.botaoEntendi} disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar link"}
            </button>
          </form>
        ) : (
          <button type="button" className={styles.botaoEntendi} onClick={onFechar} data-foco-inicial>
            Entendi
          </button>
        )}
      </div>
    </div>
  );
};
