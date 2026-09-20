import { TelaDetalheLocal } from "./components/TelaDetalheLocal";

type Props = {
  params: Promise<{ id: string }>;
};

const LocalDetalhePage = async ({ params }: Props) => {
  const { id } = await params;
  return <TelaDetalheLocal id={id} />;
};

export default LocalDetalhePage;
