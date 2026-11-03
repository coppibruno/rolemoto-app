import { TelaEditarSerie } from "./components/TelaEditarSerie";

type Props = {
  params: Promise<{ id: string }>;
};

const EditarSeriePage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaEditarSerie id={id} />
    </main>
  );
};

export default EditarSeriePage;
