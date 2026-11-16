import { TelaAtividade } from "./components/TelaAtividade";

type Props = { params: Promise<{ id: string }> };

const AtividadePage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaAtividade atividadeId={id} />
    </main>
  );
};

export default AtividadePage;
