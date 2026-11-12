import { TelaPlacar } from "../components/TelaPlacar";

type Props = {
  params: Promise<{ id: string }>;
};

const PlacarPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaPlacar conquistaId={typeof id === "string" ? id.trim() : ""} />
    </main>
  );
};

export default PlacarPage;
