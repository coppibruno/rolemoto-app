import { TelaListaAvaliacoes } from "@/app/(app)/avaliar/components/TelaListaAvaliacoes";

type Props = { params: Promise<{ id: string }> };

const AvaliacoesLocalPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaListaAvaliacoes tipo="local" alvoId={id} />
    </main>
  );
};

export default AvaliacoesLocalPage;
