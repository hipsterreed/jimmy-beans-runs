type Props = {
  size: number;
  radius: number;
  ratio: number;
};

export function ProgressRing({ size, radius, ratio }: Props) {
  const circ = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      className="progress-ring"
      aria-hidden="true"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        className="progress-ring-bg"
        strokeDasharray={circ}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        className="progress-ring-fill"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.max(0, Math.min(ratio, 1)))}
      />
    </svg>
  );
}
