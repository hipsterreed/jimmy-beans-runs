import { PLAYABLE_SIDE_QUESTS } from "../../lib/data";
import { useQuestStore } from "../../store/questStore";
import { ModalShell } from "./ModalShell";

const LEGACY_APP_URL =
  import.meta.env.VITE_LEGACY_APP_URL ?? "https://jimbo-and-bean-runs.web.app/";

export function PlayableQuestPlaceholderModal() {
  const modal = useQuestStore((s) => s.modals.playableQuestPlaceholder);
  const close = useQuestStore((s) => s.closePlayableQuestPlaceholder);

  const open = modal !== null;
  const meta = modal ? PLAYABLE_SIDE_QUESTS[modal.questTitle] : null;

  return (
    <ModalShell
      open={open}
      onClose={close}
      ariaLabelledBy="placeholderQuestTitle"
      ariaDescribedBy="placeholderQuestDescription"
    >
      <p className="eyebrow">Playable Side Quest</p>
      <h2 id="placeholderQuestTitle">{meta?.title ?? modal?.questTitle ?? "Side Quest"}</h2>
      <p id="placeholderQuestDescription" className="supporting">
        {meta?.description ??
          "This minigame hasn't been ported to the new app yet."}
      </p>
      <p className="supporting">
        Play it in the legacy April app:{" "}
        <a href={LEGACY_APP_URL} target="_blank" rel="noreferrer">
          {LEGACY_APP_URL}
        </a>
      </p>
      <div className="modal-actions">
        <button type="button" className="ghost-button" onClick={close}>
          Close
        </button>
      </div>
    </ModalShell>
  );
}
