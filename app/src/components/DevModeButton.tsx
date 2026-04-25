type Props = {
  enabled: boolean;
  onToggle: () => void;
};

export function DevModeButton({ enabled, onToggle }: Props) {
  return (
    <button
      id="devModeButton"
      className={`dev-mode-button${enabled ? " is-on" : ""}`}
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
    >
      &lt; DEV MODE &gt;
    </button>
  );
}
