"use client";

import { useFormularioPrimeiroAcesso } from "../hooks/useFormularioPrimeiroAcesso";
import { BlocoFotoPerfil } from "./BlocoFotoPerfil";
import { BotaoConcluir } from "./BotaoConcluir";
import { CabecalhoOnboarding } from "./CabecalhoOnboarding";
import { SecaoDadosPiloto } from "./SecaoDadosPiloto";
import { SecaoGaragem } from "./SecaoGaragem";
import { SeletorRitmoHabitual } from "./SeletorRitmoHabitual";
import styles from "../primeiro-acesso.module.css";

export const FormularioPrimeiroAcesso = ({ next }: { next: string | null }) => {
  const form = useFormularioPrimeiroAcesso(next);
  const ocupado = form.salvando || form.sucesso;

  return (
    <>
      <CabecalhoOnboarding percentual={form.percentual} />
      <form className={styles.formulario} onSubmit={form.salvar} noValidate>
        <BlocoFotoPerfil
          previewUrl={form.foto.previewUrl}
          nome={form.nome}
          erro={form.foto.erro ?? form.erros.foto}
          desabilitado={ocupado}
          inputRef={form.foto.inputRef}
          onAbrirSeletor={form.foto.abrirSeletor}
          onSelecionar={form.foto.aoSelecionarArquivo}
        />
        <SecaoDadosPiloto
          nome={form.nome}
          apelido={form.apelido}
          onNome={form.setNome}
          onApelido={form.setApelido}
          erroNome={form.erros.nome}
          erroApelido={form.erros.apelido}
          desabilitado={ocupado}
        />
        <SecaoGaragem
          moto={form.moto}
          tipoMoto={form.tipoMoto}
          garupaFrequente={form.garupaFrequente}
          onMoto={form.setMoto}
          onTipoMoto={form.setTipoMoto}
          onGarupa={form.setGarupaFrequente}
          erroMoto={form.erros.moto}
          erroTipoMoto={form.erros.tipoMoto}
          desabilitado={ocupado}
        />
        <SeletorRitmoHabitual
          valor={form.pilotagem}
          onChange={form.setPilotagem}
          erro={form.erros.pilotagem}
          desabilitado={ocupado}
        />
        {form.erroGeral ? (
          <p className={styles.erroGeral} role="alert">
            <span className="material-symbols-outlined" aria-hidden>
              warning
            </span>
            {form.erroGeral}
          </p>
        ) : null}
        <BotaoConcluir
          valido={form.valido}
          salvando={form.salvando}
          sucesso={form.sucesso}
        />
      </form>
    </>
  );
};
