import { TelaFormularioOferta } from "../components/TelaFormularioOferta";

type Props = {
  params: Promise<{ id: string; ofertaId: string }>;
};

const EditarOfertaPage = async ({ params }: Props) => {
  const { id, ofertaId } = await params;
  return <TelaFormularioOferta localId={id} ofertaId={ofertaId} />;
};

export default EditarOfertaPage;
