import { useLayoutEffect, useRef } from "react";

type Props = {
  progressRatio: number;
};

export function JourneyScene({ progressRatio }: Props) {
  const markerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const marker = markerRef.current;
    const fill = fillRef.current;
    if (!marker || !fill) return;

    const target = `${Math.max(0, Math.min(progressRatio, 1)) * 100}%`;
    marker.style.left = "0%";
    fill.style.width = "0%";

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        marker.style.left = target;
        fill.style.width = target;
      });
      cleanup.push(raf2);
    });
    const cleanup: number[] = [raf1];

    return () => {
      cleanup.forEach((id) => cancelAnimationFrame(id));
    };
  }, [progressRatio]);

  return (
    <div id="journeyScene" className="journey-scene">
      <div id="journeyMarker" ref={markerRef} className="journey-marker" />
      <div className="journey-progress-strip">
        <div id="progressFill" ref={fillRef} className="progress-fill" />
      </div>
    </div>
  );
}
