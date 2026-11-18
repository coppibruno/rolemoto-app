"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  codigoAfiliadoValido,
  limparCodigoAfiliado,
  normalizarCodigoAfiliado,
} from "@/lib/afiliado";
import { ApiError } from "@/lib/api";
import { destinoSeguro, urlLoginComNext } from "@/lib/destino-pos-auth";
import { useAuth } from "@/hooks/useAuth";
import type { ErrosPrimeiroAcesso, Pilotagem } from "@/types/user";
import { COPY } from "../constants";
import { perfilPrimeiroAcessoService } from "../services/perfil.service";
import { useFotoPrimeiroAcesso } from "./useFotoPrimeiroAcesso";

const validar = (campos: {
  nome: string;
  moto: string;
  pilotagem: Pilotagem | null;
  codigoAfiliado: string;
}): ErrosPrimeiroAcesso => {
  const erros: ErrosPrimeiroAcesso = {};
  const nome = campos.nome.trim();
  const moto = campos.moto.trim();
  const codigo = campos.codigoAfiliado.trim();

  if (!nome) erros.nome = "Informe o nome";
  else if (nome.length < 2) erros.nome = "Mínimo 2 caracteres";

  if (!moto) erros.moto = "Informe a moto";
  else if (moto.length < 2) erros.moto = "Mínimo 2 caracteres";

  if (!campos.pilotagem) {
    erros.pilotagem = "Selecione o ritmo de pilotagem";
  }

  if (codigo && !normalizarCodigoAfiliado(codigo)) {
    erros.codigoAfiliado = COPY.codigoErroFormato;
  }

  return erros;
};

export const useFormularioPrimeiroAcesso = (next: string | null) => {
  const { firebaseUser, recarregarPerfil } = useAuth();
  const router = useRouter();
  const foto = useFotoPrimeiroAcesso(firebaseUser?.photoURL ?? "");

  const [nome, setNome] = useState(firebaseUser?.displayName ?? "");
  const [moto, setMoto] = useState("");
  const [codigoAfiliado, setCodigoAfiliado] = useState("");
  const [codigoVeioDoLink, setCodigoVeioDoLink] = useState(false);
  const [pilotagem, setPilotagem] = useState<Pilotagem | null>(null);
  const [erros, setErros] = useState<ErrosPrimeiroAcesso>({});
  const [salvando, setSalvando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const nomeHidratado = useRef(Boolean(firebaseUser?.displayName));
  const codigoHidratado = useRef(false);

  useEffect(() => {
    if (nomeHidratado.current || !firebaseUser) return;
    nomeHidratado.current = true;
    if (firebaseUser.displayName) {
      setNome(firebaseUser.displayName);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (codigoHidratado.current) return;
    codigoHidratado.current = true;
    const guardado = codigoAfiliadoValido();
    if (guardado) {
      setCodigoAfiliado(guardado);
      setCodigoVeioDoLink(true);
    }
  }, []);

  const codigoTrim = codigoAfiliado.trim();
  const codigoInvalido = Boolean(codigoTrim && !normalizarCodigoAfiliado(codigoTrim));

  const valido =
    nome.trim().length >= 2 &&
    moto.trim().length >= 2 &&
    pilotagem !== null &&
    !foto.erro &&
    !codigoInvalido;

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setErroGeral(null);

    const errosAtuais = validar({ nome, moto, pilotagem, codigoAfiliado });
    if (foto.erro) errosAtuais.foto = foto.erro;
    setErros(errosAtuais);

    if (Object.keys(errosAtuais).length > 0 || !firebaseUser || !pilotagem) {
      return;
    }

    setSalvando(true);

    try {
      const fotoUrl = await foto.enviar(
        firebaseUser.uid,
        firebaseUser.photoURL ?? "",
      );

      const digitado = codigoTrim ? normalizarCodigoAfiliado(codigoTrim) : null;
      await perfilPrimeiroAcessoService.criar({
        nome: nome.trim(),
        moto: moto.trim(),
        pilotagem,
        fotoUrl,
        ...(digitado ? { codigoAfiliado: digitado } : {}),
      });
      limparCodigoAfiliado();

      setConcluido(true);
      await recarregarPerfil();
      router.replace(destinoSeguro(next));
    } catch (erro) {
      console.error(erro);
      if (erro instanceof ApiError && erro.status === 409) {
        await recarregarPerfil();
        router.replace(destinoSeguro(next));
        return;
      }
      if (erro instanceof ApiError && erro.status === 401) {
        router.replace(urlLoginComNext(destinoSeguro(next)));
        return;
      }
      setErroGeral(erro instanceof ApiError ? erro.message : COPY.erroGenerico);
    } finally {
      setSalvando(false);
    }
  };

  return {
    nome,
    setNome,
    moto,
    setMoto,
    codigoAfiliado,
    setCodigoAfiliado,
    codigoVeioDoLink,
    pilotagem,
    setPilotagem,
    foto,
    erros: {
      ...erros,
      codigoAfiliado: codigoInvalido ? COPY.codigoErroFormato : erros.codigoAfiliado,
    },
    salvando,
    concluido,
    erroGeral,
    valido,
    salvar,
  };
};
