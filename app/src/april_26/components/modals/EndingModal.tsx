import { useRef } from "react";
import {
  ENDING_CANVAS_HEIGHT,
  ENDING_CANVAS_WIDTH,
} from "../../games/endingVideo";
import { useEndingVideo } from "../../hooks/useEndingVideo";
import { useQuestStore } from "../../store/questStore";
import { ModalShell } from "./ModalShell";

export function EndingModal() {
  const modal = useQuestStore((s) => s.modals.ending);
  const close = useQuestStore((s) => s.closeEndingModal);
  const open = modal !== null;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controller = useEndingVideo({
    canvasRef,
    open,
    autoPlay: modal?.auto ?? false,
  });

  return (
    <ModalShell
      open={open}
      onClose={close}
      ariaLabelledBy="endingTitle"
      ariaDescribedBy="endingDescription"
      cardClassName="ending-card"
    >
      <button
        id="closeEndingIconButton"
        className="modal-icon-close"
        type="button"
        aria-label="Close ending player"
        onClick={close}
      >
        X
      </button>
      <p className="eyebrow">Dev Mode Finale</p>
      <h2 id="endingTitle">Mount Doom Ending Reel</h2>
      <p id="endingDescription" className="supporting">
        An 8-bit ending cutscene of the fellowship finishing the quest.
      </p>
      <div className="ending-player">
        <canvas
          ref={canvasRef}
          id="endingCanvas"
          width={ENDING_CANVAS_WIDTH}
          height={ENDING_CANVAS_HEIGHT}
          aria-label="Quest ending video"
        />
        <div className="ending-controls">
          <div className="ending-meta">
            <span className="ending-chip">PIXEL REEL</span>
            <span id="endingStatus" className="supporting">
              {controller.status}
            </span>
          </div>
          <div className="ending-progress">
            <div
              id="endingProgressFill"
              className="ending-progress-fill"
              style={{ width: `${Math.max(0, Math.min(controller.progressRatio, 1)) * 100}%` }}
            />
          </div>
          <div className="modal-actions ending-actions">
            <button
              id="closeEndingButton"
              type="button"
              className="ghost-button"
              onClick={close}
            >
              Close
            </button>
            <button
              id="playEndingButton"
              type="button"
              onClick={controller.play}
              disabled={controller.playDisabled}
            >
              {controller.playLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
