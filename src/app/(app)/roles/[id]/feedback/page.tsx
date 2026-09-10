import { TelaFeedbackRole } from "./components/TelaFeedbackRole";

type Props = { params: Promise<{ id: string }> };

const FeedbackRolePage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaFeedbackRole roleId={id} />
    </main>
  );
};

export default FeedbackRolePage;
