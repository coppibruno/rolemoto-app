import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LABELS_CATEGORIA_LOCAL } from "@/app/(app)/feed/constants";
import { TelaConviteLocal } from "./components/TelaConviteLocal";
import { obterLocalPublico } from "./services/local-publico.service";

type Props = { params: Promise<{ id: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { id } = await params;
  const local = await obterLocalPublico(id);
  if (!local) return { title: "Local não encontrado · Rolê Moto" };

  const descricao = `${LABELS_CATEGORIA_LOCAL[local.categoria]} · ${local.endereco}`;

  return {
    title: `${local.nome} · Rolê Moto`,
    description: descricao,
    openGraph: {
      title: local.nome,
      description: descricao,
      url: `/l/${id}`,
      images: local.fotoFachadaUrl ? [{ url: local.fotoFachadaUrl }] : undefined,
      locale: "pt_BR",
      type: "website",
    },
  };
};

const ConviteLocalPage = async ({ params }: Props) => {
  const { id } = await params;
  const local = await obterLocalPublico(id);
  if (!local) notFound();

  return (
    <main>
      <TelaConviteLocal local={local} />
    </main>
  );
};

export default ConviteLocalPage;
