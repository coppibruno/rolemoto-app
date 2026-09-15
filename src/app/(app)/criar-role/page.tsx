import { TelaCriarRole } from "./components/TelaCriarRole";

type Props = { searchParams: Promise<{ origem?: string; editar?: string }> };

const CriarRolePage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const editarId =
    typeof params.editar === "string" && params.editar.trim()
      ? params.editar.trim()
      : undefined;
  const origemId =
    !editarId && typeof params.origem === "string" && params.origem.trim()
      ? params.origem.trim()
      : undefined;

  return (
    <main>
      <TelaCriarRole origemId={origemId} editarId={editarId} />
    </main>
  );
};

export default CriarRolePage;
