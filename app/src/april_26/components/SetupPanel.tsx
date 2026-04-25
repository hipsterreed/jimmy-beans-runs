type Props = {
  hidden?: boolean;
};

export function SetupPanel({ hidden }: Props) {
  return (
    <section id="setupPanel" className="setup-panel" hidden={hidden}>
      <p className="eyebrow">Firebase Setup</p>
      <h2>Shared tracking needs your project keys</h2>
      <p className="supporting">
        Set the <code>VITE_FIREBASE_*</code> env vars and reload from a local server or hosted URL.
      </p>
    </section>
  );
}
