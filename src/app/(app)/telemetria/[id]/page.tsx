import { TelaTelemetriaDetalhe } from "./components/TelaTelemetriaDetalhe";

type Props = {
  params: Promise<{ id: string }>;
};

const TelemetriaDetalhePage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaTelemetriaDetalhe id={id} />
    </main>
  );
};

export default TelemetriaDetalhePage;
