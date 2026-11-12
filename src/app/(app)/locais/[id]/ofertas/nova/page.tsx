import { TelaFormularioOferta } from "../components/TelaFormularioOferta";

type Props = {
  params: Promise<{ id: string }>;
};

const NovaOfertaPage = async ({ params }: Props) => {
  const { id } = await params;
  return <TelaFormularioOferta localId={id} ofertaId={null} />;
};

export default NovaOfertaPage;
