import { TelaPostFoto } from "./components/TelaPostFoto";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ uid: string; postId: string }>;
};

const PostFotoPage = async ({ params }: Props) => {
  const { uid, postId } = await params;

  return (
    <main>
      <TelaPostFoto autorUid={uid.trim()} postId={postId.trim()} />
    </main>
  );
};

export default PostFotoPage;
