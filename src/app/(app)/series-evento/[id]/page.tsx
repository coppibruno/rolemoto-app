import { TelaDetalheSerie } from "../components/TelaDetalheSerie";

type Props = {
  params: Promise<{ id: string }>;
};

const SerieEventoPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaDetalheSerie id={id} />
    </main>
  );
};

export default SerieEventoPage;
