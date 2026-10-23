import { formatarPeriodoEvento } from "@/app/(app)/feed/formatar-horario";
import { tituloLocal } from "@/lib/localizacao";

export type DadosConviteEvento = {
  id: string;
  titulo: string;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  localNome?: string;
  localEndereco: string;
};

export const urlConviteEvento = (id: string): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/e/${id}`;
};

export const textoConviteEvento = (dados: DadosConviteEvento): string => {
  const url = urlConviteEvento(dados.id);
  const local = tituloLocal({
    nome: dados.localNome ?? "",
    endereco: dados.localEndereco,
  });
  return [
    `🏍️ ${dados.titulo}`,
    `📅 ${formatarPeriodoEvento(dados.dataHoraAbertura, dados.dataHoraEncerramento)}`,
    `📍 ${local}`,
    "",
    "Abre o convite:",
    url,
  ].join("\n");
};
