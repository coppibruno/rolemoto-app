import { Suspense } from "react";
import { TelaAprovacoes } from "./components/TelaAprovacoes";

const AprovacoesPage = () => {
  return (
    <main>
      <Suspense>
        <TelaAprovacoes />
      </Suspense>
    </main>
  );
};

export default AprovacoesPage;
