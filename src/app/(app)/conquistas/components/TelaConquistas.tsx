"use client";

import { GuardaAdmin } from "../../components/GuardaAdmin";
import { TOAST_SALVO } from "../constants";
import { useConquistasAdmin } from "../hooks/useConquistasAdmin";
import { CabecalhoConquistas } from "./CabecalhoConquistas";
import { FormularioConquista } from "./FormularioConquista";
import { ListaConquistas } from "./ListaConquistas";
import styles from "../conquistas.module.css";

export const TelaConquistas = () => {
  const tela = useConquistasAdmin();
  const { modo } = tela;

  return (
    <GuardaAdmin>
      <div className={styles.tela}>
        <CabecalhoConquistas
          onVoltar={modo.tipo === "lista" ? undefined : tela.voltarParaLista}
        />
        {modo.tipo === "lista" ? (
          <ListaConquistas
            itens={tela.itens}
            carregando={tela.carregando}
            erro={tela.erro}
            onNova={tela.abrirNova}
            onAbrir={tela.abrirEdicao}
            onRecarregar={() => void tela.recarregar()}
          />
        ) : (
          <FormularioConquista
            key={modo.tipo === "editar" ? modo.item.id : "nova"}
            inicial={modo.tipo === "editar" ? modo.item : null}
            onSalvo={tela.aoSalvar}
            onCancelar={tela.voltarParaLista}
          />
        )}
        {tela.salvo ? (
          <div className={styles.toast} role="status">
            <span className="material-symbols-outlined" aria-hidden>
              task_alt
            </span>
            {TOAST_SALVO}
          </div>
        ) : null}
      </div>
    </GuardaAdmin>
  );
};
