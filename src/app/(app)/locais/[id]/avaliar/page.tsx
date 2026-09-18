import { TelaAvaliarExperiencia } from "@/app/(app)/avaliar/components/TelaAvaliarExperiencia";

type Props = { params: Promise<{ id: string }> };

const AvaliarLocalPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaAvaliarExperiencia tipo="local" alvoId={id} />
    </main>
  );
};

export default AvaliarLocalPage;
