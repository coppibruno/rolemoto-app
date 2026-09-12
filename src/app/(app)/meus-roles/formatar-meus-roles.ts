import { formatarHora } from "@/app/(app)/feed/formatar-horario";
import type { DadosConvite } from "@/lib/convite";
import type { MeuRoleItem } from "@/types/meus-roles";

const TZ = "America/Sao_Paulo";

const ymdSaoPaulo = (data: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);

const somarDiasYmd = (ymd: string, dias: number): string => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return dt.toISOString().slice(0, 10);
};

const formatarDiaMes = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));

export const formatarPedidoRelativo = (iso: string): string => {
  const data = new Date(iso);
  const hora = formatarHora(iso);
  const ymd = ymdSaoPaulo(data);
  const hoje = ymdSaoPaulo(new Date());
  if (ymd === hoje) return `Enviada hoje • ${hora}`;
  if (ymd === somarDiasYmd(hoje, -1)) return `Enviada ontem • ${hora}`;
  return `Enviada em ${formatarDiaMes(iso)} • ${hora}`;
};

export const formatarDataConcluido = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

export const formatarKm = (km: number): string =>
  `${km.toLocaleString("pt-BR")} km`;

export const dadosConviteDe = (item: MeuRoleItem): DadosConvite => ({
  id: item.roleId,
  titulo: item.titulo,
  dataHoraSaida: item.dataHoraSaida,
  localSaidaEndereco: item.localSaidaEndereco,
});
