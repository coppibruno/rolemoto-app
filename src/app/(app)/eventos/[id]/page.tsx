import { Suspense } from "react";
import { TelaDetalheEvento } from "./components/TelaDetalheEvento";

type Props = {
  params: Promise<{ id: string }>;
};

const EventoDetalhePage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <Suspense>
      <TelaDetalheEvento id={id} />
    </Suspense>
  );
};

export default EventoDetalhePage;
