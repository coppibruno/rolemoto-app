import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatarFaixaHero } from "@/app/(app)/feed/formatar-horario";
import { TelaConviteRole } from "./components/TelaConviteRole";
import { obterRolePublico } from "./services/role-publico.service";

type Props = { params: Promise<{ id: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { id } = await params;
  const role = await obterRolePublico(id);
  if (!role) return { title: "Rolê não encontrado · Rolê Moto" };

  const descricao = `${formatarFaixaHero(role.dataHoraSaida)} · ${role.localSaidaEndereco}`;

  return {
    title: `${role.titulo} · Rolê Moto`,
    description: descricao,
    openGraph: {
      title: role.titulo,
      description: descricao,
      url: `/r/${id}`,
      images: role.fotoCapaUrl ? [{ url: role.fotoCapaUrl }] : undefined,
      locale: "pt_BR",
      type: "website",
    },
  };
};

const ConviteRolePage = async ({ params }: Props) => {
  const { id } = await params;
  const role = await obterRolePublico(id);
  if (!role) notFound();

  return (
    <main>
      <TelaConviteRole role={role} />
    </main>
  );
};

export default ConviteRolePage;
