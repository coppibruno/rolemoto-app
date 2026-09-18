import { TelaAvaliarExperiencia } from "@/app/(app)/avaliar/components/TelaAvaliarExperiencia";

type Props = { params: Promise<{ id: string }> };

const AvaliarEventoPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaAvaliarExperiencia tipo="evento" alvoId={id} />
    </main>
  );
};

export default AvaliarEventoPage;
