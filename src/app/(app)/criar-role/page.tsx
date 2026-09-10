import { TelaCriarRole } from "./components/TelaCriarRole";

type Props = { searchParams: Promise<{ origem?: string }> };

const CriarRolePage = async ({ searchParams }: Props) => {
  const { origem } = await searchParams;
  const origemId =
    typeof origem === "string" && origem.trim() ? origem.trim() : undefined;

  return (
    <main>
      <TelaCriarRole origemId={origemId} />
    </main>
  );
};

export default CriarRolePage;
