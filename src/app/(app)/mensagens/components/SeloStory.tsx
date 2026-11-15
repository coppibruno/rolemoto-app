import type { StoryDaMensagem } from "@/types/conversa";
import { COPY_SELO_STORY, COPY_SELO_STORY_EXPIRADA } from "../constants";
import styles from "../mensagens.module.css";

type Props = {
  story: StoryDaMensagem;
};

export const SeloStory = ({ story }: Props) => {
  if (story.ativa && story.fotoUrl) {
    return (
      <span className={styles.seloStory}>
        <img src={story.fotoUrl} alt="" className={styles.seloStoryFoto} />
        {COPY_SELO_STORY}
      </span>
    );
  }
  return (
    <span className={`${styles.seloStory} ${styles.seloStoryExpirada}`}>
      <span className="material-symbols-outlined" aria-hidden>
        history_toggle_off
      </span>
      {COPY_SELO_STORY_EXPIRADA}
    </span>
  );
};
