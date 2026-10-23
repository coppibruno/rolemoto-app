import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatarPeriodoEvento } from "@/app/(app)/feed/formatar-horario";
import { tituloLocal } from "@/lib/localizacao";
import { TelaConviteEvento } from "./components/TelaConviteEvento";
import { obterEventoPublico } from "./services/evento-publico.service";

type Props = { params: Promise<{ id: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { id } = await params;
  const evento = await obterEventoPublico(id);
  if (!evento) return { title: "Evento não encontrado · Rolê Moto" };

  const local = tituloLocal({
    nome: evento.localNome,
    endereco: evento.localEndereco,
  });
  const descricao = `${formatarPeriodoEvento(
    evento.dataHoraAbertura,
    evento.dataHoraEncerramento,
  )} · ${local}`;

  return {
    title: `${evento.titulo} · Rolê Moto`,
    description: descricao,
    openGraph: {
      title: evento.titulo,
      description: descricao,
      url: `/e/${id}`,
      images: evento.fotoCapaUrl ? [{ url: evento.fotoCapaUrl }] : undefined,
      locale: "pt_BR",
      type: "website",
    },
  };
};

const ConviteEventoPage = async ({ params }: Props) => {
  const { id } = await params;
  const evento = await obterEventoPublico(id);
  if (!evento) notFound();

  return (
    <main>
      <TelaConviteEvento evento={evento} />
    </main>
  );
};

export default ConviteEventoPage;
