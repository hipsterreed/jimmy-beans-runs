import { useState } from "react";
import { todayIsoDate } from "../lib/utils";

type Props = {
  runnerId: string;
  onSubmit?: (runnerId: string, miles: number, runDate: string) => Promise<void> | void;
};

export function LogRunForm({ runnerId, onSubmit }: Props) {
  const [miles, setMiles] = useState("");
  const [runDate, setRunDate] = useState(todayIsoDate);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number.parseFloat(miles);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit?.(runnerId, value, runDate || todayIsoDate());
      setMiles("");
      setRunDate(todayIsoDate());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mile-form" data-runner-id={runnerId} onSubmit={handleSubmit}>
      <label>Log a run</label>
      <div className="form-grid">
        <input
          name="miles"
          type="number"
          min="0.1"
          step="0.1"
          placeholder="3.1"
          required
          value={miles}
          onChange={(event) => setMiles(event.target.value)}
        />
        <input
          name="runDate"
          type="date"
          required
          value={runDate}
          onChange={(event) => setRunDate(event.target.value)}
        />
      </div>
      <button type="submit" disabled={submitting}>
        Log Quest
      </button>
    </form>
  );
}
