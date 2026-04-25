import { useCallback, useEffect, useRef, useState } from "react";
import { drawEndingFrame, ENDING_DURATION_MS } from "../games/endingVideo";

type Args = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  open: boolean;
  autoPlay: boolean;
};

export type EndingController = {
  status: string;
  progressRatio: number;
  playLabel: string;
  playDisabled: boolean;
  play: () => void;
};

export function useEndingVideo({ canvasRef, open, autoPlay }: Args): EndingController {
  const frameMsRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef<boolean>(false);

  const [status, setStatus] = useState<string>("Ready to play the finale.");
  const [progressRatio, setProgressRatio] = useState<number>(0);
  const [playLabel, setPlayLabel] = useState<string>("Play Finale");
  const [playDisabled, setPlayDisabled] = useState<boolean>(false);

  const drawCurrent = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawEndingFrame(ctx, frameMsRef.current);
  }, [canvasRef]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    playingRef.current = false;
    setPlayDisabled(false);
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      if (!playingRef.current) return;
      if (!startedAtRef.current) {
        startedAtRef.current = timestamp - frameMsRef.current;
      }
      frameMsRef.current = Math.min(timestamp - startedAtRef.current, ENDING_DURATION_MS);
      drawCurrent();
      setProgressRatio(frameMsRef.current / ENDING_DURATION_MS);

      if (frameMsRef.current >= ENDING_DURATION_MS) {
        stop();
        setPlayLabel("Replay Finale");
        setStatus("Finale complete. Replay any time.");
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [drawCurrent, stop],
  );

  const play = useCallback(
    (restart = true) => {
      if (restart) {
        frameMsRef.current = 0;
        startedAtRef.current = 0;
        setProgressRatio(0);
      }
      stop();
      playingRef.current = true;
      setPlayLabel("Playing...");
      setPlayDisabled(true);
      setStatus("Hipster Sam and Frodo Bean carry the ring to Mount Doom.");
      startedAtRef.current = performance.now() - frameMsRef.current;
      tick(startedAtRef.current);
    },
    [stop, tick],
  );

  useEffect(() => {
    if (!open) {
      stop();
      return;
    }
    drawCurrent();
    setProgressRatio(frameMsRef.current / ENDING_DURATION_MS);
    setPlayLabel(frameMsRef.current > 0 ? "Replay Finale" : "Play Finale");
    setStatus(autoPlay ? "Playing the dev-mode finale reel." : "Ready to play the finale.");
    if (autoPlay) {
      play(true);
    }
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return {
    status,
    progressRatio,
    playLabel,
    playDisabled,
    play: () => play(true),
  };
}
