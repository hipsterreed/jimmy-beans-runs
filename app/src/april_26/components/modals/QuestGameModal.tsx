import { useEffect, useRef } from "react";
import { PLAYABLE_SIDE_QUESTS } from "../../lib/data";
import { PLAYABLE_QUEST_CONFIGS } from "../../games/playableQuestConfigs";
import {
  QUEST_GAME_CANVAS_HEIGHT,
  QUEST_GAME_CANVAS_WIDTH,
} from "../../games/shared";
import { useQuestGame } from "../../hooks/useQuestGame";
import { useQuestStore } from "../../store/questStore";
import { ModalShell } from "./ModalShell";

export function QuestGameModal() {
  const modal = useQuestStore((s) => s.modals.questGame);
  const close = useQuestStore((s) => s.closeQuestGame);

  const open = modal !== null;
  const questKey = modal?.questTitle ?? null;
  const meta = questKey ? PLAYABLE_SIDE_QUESTS[questKey] : null;
  const config = questKey ? PLAYABLE_QUEST_CONFIGS[questKey] : null;
  const isThree = config?.engine === "three";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeHostRef = useRef<HTMLDivElement | null>(null);

  const controller = useQuestGame({
    questKey: open ? questKey : null,
    canvasRef,
    threeHostRef,
  });

  // ESC closes are handled by ModalShell; gameplay key tracking is handled by useQuestGame.
  useEffect(() => {
    if (!open) return;
    // No-op — kept to make the modal lifecycle explicit.
  }, [open]);

  return (
    <ModalShell
      open={open}
      onClose={close}
      ariaLabelledBy="questGameTitle"
      ariaDescribedBy="questGameDescription"
      cardClassName="quest-game-card"
    >
      <p className="eyebrow">Playable Side Quest</p>
      <h2 id="questGameTitle">{meta?.title ?? questKey ?? "Side Quest"}</h2>
      <p id="questGameDescription" className="supporting">
        {meta?.description ?? ""}
      </p>
      <div className="quest-game-shell">
        <div
          ref={threeHostRef}
          id="questGameThreeHost"
          className="quest-game-viewport"
          aria-label="Quest 3D minigame"
          hidden={!isThree}
        />
        <canvas
          ref={canvasRef}
          id="questGameCanvas"
          width={QUEST_GAME_CANVAS_WIDTH}
          height={QUEST_GAME_CANVAS_HEIGHT}
          aria-label="Quest minigame"
          hidden={isThree}
        />
        <div className="quest-game-sidebar">
          <div className="quest-game-panel">
            <p className="quest-game-label">Controls</p>
            <p id="questGameControls" className="supporting">
              {config?.controlsText ?? ""}
            </p>
          </div>
          <div className="quest-game-panel">
            <p className="quest-game-label">Objective</p>
            <p id="questGameObjective" className="supporting">
              {config?.objectiveText ?? ""}
            </p>
          </div>
          <div className="quest-game-panel">
            <p className="quest-game-label">Quest State</p>
            <p id="questGameStatus" className="quest-game-status">
              {controller.status}
            </p>
          </div>
          {controller.trivia && (
            <div id="questTriviaPanel" className="quest-game-panel quest-trivia-panel">
              <p className="quest-game-label">Wall Fight</p>
              <p id="questTriviaPrompt" className="supporting">
                {controller.trivia.question.prompt}
              </p>
              <div id="questTriviaOptions" className="quest-trivia-options">
                {controller.trivia.question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="quest-trivia-option"
                    data-trivia-option={option}
                    onClick={() => controller.answerTrivia(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="modal-actions quest-game-actions">
            <button
              id="closeQuestGameButton"
              type="button"
              className="ghost-button"
              onClick={close}
            >
              Close
            </button>
            <button
              id="startQuestGameButton"
              type="button"
              onClick={controller.start}
              disabled={controller.startDisabled}
            >
              {controller.startLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
