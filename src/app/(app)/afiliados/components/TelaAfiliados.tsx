"use client";

import Link from "next/link";
import { GuardaAdmin } from "../../components/GuardaAdmin";
import { useAfiliados } from "../hooks/useAfiliados";
import { FormularioAfiliado } from "./FormularioAfiliado";
import { ItemAfiliado } from "./ItemAfiliado";
import styles from "../afiliados.module.css";

export const TelaAfiliados = () => {
  const tela = useAfiliados();

  return (
    <GuardaAdmin>
      <div className={styles.tela}>
        <header className={styles.cabecalho}>
          <Link href="/perfil" className={styles.botaoVoltar} aria-label="Voltar">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className={styles.titulo}>Links de afiliado</h1>
        </header>
        <div className={styles.conteudo}>
          <p className={styles.intro}>
            Cliques na página do link e contas criadas pelo site. Instalação pela loja não conta.
          </p>
          <FormularioAfiliado
            criando={tela.criando}
            erro={tela.erroCriar}
            onCriar={tela.criar}
          />
          {tela.carregando ? <p className={styles.intro}>Carregando…</p> : null}
          {tela.erro ? (
            <div className={styles.erro}>
              <p>{tela.erro}</p>
              <button type="button" onClick={() => void tela.recarregar()}>
                Tentar de novo
              </button>
            </div>
          ) : null}
          {!tela.carregando && !tela.erro && tela.itens.length === 0 ? (
            <p className={styles.intro}>Nenhum link criado ainda.</p>
          ) : null}
          {tela.itens.length > 0 ? (
            <ul className={styles.lista}>
              {tela.itens.map((afiliado) => (
                <li key={afiliado.id}>
                  <ItemAfiliado afiliado={afiliado} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </GuardaAdmin>
  );
};
