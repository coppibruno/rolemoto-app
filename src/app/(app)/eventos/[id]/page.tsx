import { TelaDetalheEvento } from "./components/TelaDetalheEvento";

type Props = {
  params: Promise<{ id: string }>;
};

const EventoDetalhePage = async ({ params }: Props) => {
  const { id } = await params;
  return <TelaDetalheEvento id={id} />;
};

export default EventoDetalhePage;
