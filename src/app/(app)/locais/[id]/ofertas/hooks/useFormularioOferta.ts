"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  campoDoErroOferta,
  escreverValorOferta,
  lerValorOferta,
  type CampoOferta,
} from "@/lib/oferta-local";
import type { OfertaLocal, OfertaLocalDados, TipoOfertaLocal } from "@/types/oferta-local";
import { ofertaLocalService } from "../../../services/oferta-local.service";

export type FormOferta = {
  tipo: TipoOfertaLocal;
  titulo: string;
  valor: string;
  codigo: string;
  regra: string;
  tetoDia: string;
  dias: number[];
  horaInicio: string;
  horaFim: string;
};

export type ErrosOferta = Partial<Record<CampoOferta, string>>;

const VAZIO: FormOferta = {
  tipo: "preco",
  titulo: "",
  valor: "",
  codigo: "",
  regra: "",
  tetoDia: "",
  dias: [],
  horaInicio: "",
  horaFim: "",
};

const doServidor = (o: OfertaLocal): FormOferta => ({
  tipo: o.tipo,
  titulo: o.titulo,
  valor: escreverValorOferta(o.tipo, o.valor),
  codigo: o.codigo ?? "",
  regra: o.regra,
  tetoDia: o.tetoDia ? String(o.tetoDia) : "",
  dias: o.dias,
  horaInicio: o.horaInicio ?? "",
  horaFim: o.horaFim ?? "",
});

const paraDados = (f: FormOferta): OfertaLocalDados => ({
  titulo: f.titulo,
  tipo: f.tipo,
  valor: f.tipo === "brinde" ? null : lerValorOferta(f.valor),
  codigo: f.codigo,
  regra: f.regra,
  tetoDia: f.tetoDia.trim() ? Number(f.tetoDia) : null,
  dias: f.dias,
  horaInicio: f.horaInicio || null,
  horaFim: f.horaFim || null,
});

/** Dono ou admin; o resto volta ao detalhe do local. */
export const useFormularioOferta = (localId: string, ofertaId: string | null) => {
  const router = useRouter();
  const [form, setForm] = useState<FormOferta>(VAZIO);
  const [ativa, setAtiva] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<ErrosOferta>({});
  const hrefBalcao = `/locais/${localId}/balcao`;

  useEffect(() => {
    ofertaLocalService
      .balcao(localId)
      .then(({ ofertas }) => {
        if (!ofertaId) return;
        const atual = ofertas.find((o) => o.id === ofertaId);
        if (!atual) {
          router.replace(hrefBalcao);
          return;
        }
        setForm(doServidor(atual));
        setAtiva(atual.ativa);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) router.replace(`/locais/${localId}`);
        else setErros({ geral: e instanceof ApiError ? e.message : "Não foi possível carregar" });
      })
      .finally(() => setCarregando(false));
  }, [hrefBalcao, localId, ofertaId, router]);

  const alterar = <K extends keyof FormOferta>(campo: K, valor: FormOferta[K]) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const salvar = async () => {
    const dados = paraDados(form);
    if (dados.tetoDia !== null && !Number.isFinite(dados.tetoDia)) {
      setErros({ tetoDia: "O teto por dia é de 1 a 999" });
      return;
    }
    setSalvando(true);
    setErros({});
    try {
      if (ofertaId) await ofertaLocalService.atualizar(localId, ofertaId, { ...dados, ativa });
      else await ofertaLocalService.criar(localId, dados);
      router.push(hrefBalcao);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Não foi possível salvar. Tente de novo.";
      setErros({ [campoDoErroOferta(msg)]: msg });
      setSalvando(false);
    }
  };

  return { form, alterar, erros, carregando, salvando, salvar, hrefBalcao };
};
