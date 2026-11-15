import { TelaMapaViagem } from "./components/TelaMapaViagem";

type Props = { params: Promise<{ id: string }> };

const MapaViagemPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaMapaViagem roleId={id} />
    </main>
  );
};

export default MapaViagemPage;
