import { TelaPrimeiroAcesso } from "./components/TelaPrimeiroAcesso";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

const PrimeiroAcessoPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;

  return (
    <main>
      <TelaPrimeiroAcesso next={next} />
    </main>
  );
};

export default PrimeiroAcessoPage;
