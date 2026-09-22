import { TelaListaAvaliacoes } from "@/app/(app)/avaliar/components/TelaListaAvaliacoes";

type Props = { params: Promise<{ id: string }> };

const AvaliacoesEventoPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaListaAvaliacoes tipo="evento" alvoId={id} />
    </main>
  );
};

export default AvaliacoesEventoPage;
