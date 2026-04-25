import { useCallback, useEffect, useRef, useState } from "react";
import { PLAYABLE_QUEST_CONFIGS, type CanvasQuestConfig, type ThreeQuestSession } from "../games/playableQuestConfigs";
import { makeFreshScratch, readInput, type QuestScratch } from "../games/shared";
import { pickHelmsTriviaQuestion, type TriviaQuestion } from "../games/helmsTrivia";

const TRACKED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "a",
  "A",
  "d",
  "D",
  "w",
  "W",
  "s",
  "S",
  " ",
  "Space",
  "Spacebar",
  "Enter",
]);

type QuestPhase = "intro" | "running" | "success" | "failure";

export type QuestController = {
  status: string;
  phase: QuestPhase;
  startLabel: string;
  startDisabled: boolean;
  trivia: { question: TriviaQuestion; strikesRemaining: number; laddersStopped: number; targetLadders: number } | null;
  start: () => void;
  answerTrivia: (option: string) => void;
};

type Args = {
  questKey: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  threeHostRef: React.RefObject<HTMLDivElement | null>;
};

export function useQuestGame({ questKey, canvasRef, threeHostRef }: Args): QuestController {
  const config = questKey ? PLAYABLE_QUEST_CONFIGS[questKey] : null;

  const scratchRef = useRef<QuestScratch>(makeFreshScratch());
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const runningRef = useRef<boolean>(false);
  const threeSessionRef = useRef<ThreeQuestSession | null>(null);
  const triviaStateRef = useRef<{
    strikesRemaining: number;
    laddersStopped: number;
    activeQuestion: TriviaQuestion | null;
    mode: "defense" | "trivia";
  }>({ strikesRemaining: 0, laddersStopped: 0, activeQuestion: null, mode: "defense" });

  const [status, setStatus] = useState<string>("");
  const [phase, setPhase] = useState<QuestPhase>("intro");
  const [trivia, setTrivia] = useState<QuestController["trivia"]>(null);

  const drawFrame = useCallback(() => {
    if (!config || config.engine !== "canvas") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    (config as CanvasQuestConfig).draw(ctx, scratchRef.current);
  }, [config, canvasRef]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    runningRef.current = false;
    lastTickRef.current = 0;
  }, []);

  const finish = useCallback((message: string, success: boolean) => {
    stopLoop();
    setStatus(message);
    setPhase(success ? "success" : "failure");
    setTrivia(null);
  }, [stopLoop]);

  const tick = useCallback(
    (timestamp: number) => {
      if (!runningRef.current || !config || config.engine !== "canvas") return;
      if (!lastTickRef.current) lastTickRef.current = timestamp;
      const deltaMs = Math.min(timestamp - lastTickRef.current, 32);
      lastTickRef.current = timestamp;

      const input = readInput(keysRef.current);
      const result = (config as CanvasQuestConfig).update(deltaMs, scratchRef.current, input);
      drawFrame();

      if (result.status === "success") {
        finish(result.message ?? config.successText, true);
        return;
      }
      if (result.status === "failure") {
        finish(result.message ?? config.failureText, false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [config, drawFrame, finish],
  );

  // Reset scratch + status when the active quest changes or modal closes.
  useEffect(() => {
    stopLoop();
    threeSessionRef.current?.destroy();
    threeSessionRef.current = null;
    keysRef.current.clear();
    triviaStateRef.current = {
      strikesRemaining: 0,
      laddersStopped: 0,
      activeQuestion: null,
      mode: "defense",
    };
    setTrivia(null);

    if (!config) {
      setStatus("");
      setPhase("intro");
      return;
    }

    scratchRef.current = makeFreshScratch();
    if (config.engine === "canvas") {
      (config as CanvasQuestConfig).setup(scratchRef.current);
      // Draw the first frame so the canvas isn't blank before Start.
      requestAnimationFrame(drawFrame);
    }
    setStatus(config.introText);
    setPhase("intro");

    return () => {
      stopLoop();
      threeSessionRef.current?.destroy();
      threeSessionRef.current = null;
      keysRef.current.clear();
    };
  }, [config, drawFrame, stopLoop]);

  // Key tracking for canvas games (the Three.js helm config attaches its own).
  useEffect(() => {
    if (!config || config.engine !== "canvas") return;
    const onDown = (event: KeyboardEvent) => {
      if (TRACKED_KEYS.has(event.key)) {
        event.preventDefault();
        keysRef.current.add(event.key);
      }
    };
    const onUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key);
    };
    document.addEventListener("keydown", onDown);
    document.addEventListener("keyup", onUp);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("keyup", onUp);
      keysRef.current.clear();
    };
  }, [config]);

  const start = useCallback(() => {
    if (!config) return;
    if (config.engine === "three") {
      const host = threeHostRef.current;
      if (!host) return;
      threeSessionRef.current?.destroy();
      triviaStateRef.current = {
        strikesRemaining: 0,
        laddersStopped: 0,
        activeQuestion: null,
        mode: "defense",
      };
      setTrivia(null);
      const session = config.mount(host, {
        onStatus: (message) => setStatus(message),
        onProgress: (count) => {
          triviaStateRef.current.laddersStopped = count;
        },
        onLadderLanded: () => {
          const question = pickHelmsTriviaQuestion();
          triviaStateRef.current = {
            ...triviaStateRef.current,
            mode: "trivia",
            strikesRemaining: 5,
            activeQuestion: question,
          };
          setTrivia({
            question,
            strikesRemaining: 5,
            laddersStopped: triviaStateRef.current.laddersStopped,
            targetLadders: config.targetLadders,
          });
        },
        onComplete: (message) => {
          setStatus(message);
          setTrivia(null);
          setPhase("success");
        },
      });
      threeSessionRef.current = session;
      setPhase("running");
      setStatus(config.runningText);
      session.start();
      return;
    }

    scratchRef.current = makeFreshScratch();
    (config as CanvasQuestConfig).setup(scratchRef.current);
    setPhase("running");
    setStatus(config.runningText);
    runningRef.current = true;
    lastTickRef.current = 0;
    drawFrame();
    rafRef.current = requestAnimationFrame(tick);
  }, [config, drawFrame, tick, threeHostRef]);

  const answerTrivia = useCallback(
    (option: string) => {
      if (!config || config.engine !== "three") return;
      const triviaState = triviaStateRef.current;
      if (triviaState.mode !== "trivia" || !triviaState.activeQuestion) return;

      if (option === triviaState.activeQuestion.answer) {
        triviaState.strikesRemaining -= 1;
        if (triviaState.strikesRemaining <= 0) {
          triviaState.mode = "defense";
          triviaState.laddersStopped += 1;
          triviaState.activeQuestion = null;
          setTrivia(null);
          setStatus(
            `You cleared the wall. ${triviaState.laddersStopped} / ${config.targetLadders} ladders pushed off.`,
          );
          threeSessionRef.current?.clearLadderAfterTrivia?.();
          if (triviaState.laddersStopped >= config.targetLadders) {
            setPhase("success");
            setStatus(config.successText);
          }
          return;
        }
        const next = pickHelmsTriviaQuestion();
        triviaState.activeQuestion = next;
        setTrivia({
          question: next,
          strikesRemaining: triviaState.strikesRemaining,
          laddersStopped: triviaState.laddersStopped,
          targetLadders: config.targetLadders,
        });
        setStatus(`Good hit. ${triviaState.strikesRemaining} enemies left on the ladder.`);
        return;
      }
      setStatus("Wrong answer. The attackers keep pressing the wall.");
    },
    [config],
  );

  let startLabel = "Start Quest";
  let startDisabled = false;
  if (phase === "running") {
    startLabel = "Quest Running";
    startDisabled = true;
  } else if (phase === "success") {
    startLabel = "Play Again";
  } else if (phase === "failure") {
    startLabel = "Retry Quest";
  }

  return {
    status,
    phase,
    startLabel,
    startDisabled,
    trivia,
    start,
    answerTrivia,
  };
}
