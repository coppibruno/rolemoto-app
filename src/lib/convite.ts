import { formatarFaixaHero } from "@/app/(app)/feed/formatar-horario";
import { tituloLocal } from "@/lib/localizacao";

export type DadosConvite = {
  id: string;
  titulo: string;
  dataHoraSaida: string;
  localSaidaEndereco: string;
  localSaidaNome?: string;
};

export const urlConvite = (id: string): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/r/${id}`;
};

export const textoConvite = (dados: DadosConvite): string => {
  const url = urlConvite(dados.id);
  const local = tituloLocal({
    nome: dados.localSaidaNome ?? "",
    endereco: dados.localSaidaEndereco,
  });
  return [
    `🏍️ ${dados.titulo}`,
    `📅 ${formatarFaixaHero(dados.dataHoraSaida)}`,
    `📍 ${local}`,
    "",
    "Abre o convite:",
    url,
  ].join("\n");
};
