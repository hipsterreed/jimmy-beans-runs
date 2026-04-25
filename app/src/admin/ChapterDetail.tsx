import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { ensureChapter, type EnsureChapterInput } from "../shared/lib/chapters";
import type { Chapter, ChapterStatus } from "../shared/lib/types";
import { CharactersSection } from "./CharactersTab";
import { ParticipantsSection } from "./ParticipantsTab";
import { Field, FormGrid } from "./components/Field";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

const STATUS_OPTIONS: ChapterStatus[] = ["upcoming", "active", "complete"];

type Props = {
  chapter: Chapter;
  onBack: () => void;
};

export function ChapterDetail({ chapter, onBack }: Props) {
  const [form, setForm] = useState<EnsureChapterInput>(toForm(chapter));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setForm(toForm(chapter));
  }, [chapter]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await ensureChapter(form);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft />
          All chapters
        </Button>
        <div>
          <h2 className="text-foreground text-xl font-semibold">{chapter.title}</h2>
          <p className="text-muted-foreground text-xs">
            {chapter.id} · {chapter.month}/{chapter.year} · {chapter.status}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chapter details</CardTitle>
          <CardDescription>
            Edit the chapter metadata. The ID is the document key in Firestore and
            cannot be changed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormGrid>
            <Field label="ID">
              <Input value={form.id} disabled />
            </Field>
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Theme key" hint="lotr, star-wars, …">
              <Input
                value={form.themeKey}
                onChange={(e) => setForm({ ...form, themeKey: e.target.value })}
              />
            </Field>
            <Field label="Order">
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </Field>
            <Field label="Month">
              <Input
                type="number"
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
              />
            </Field>
            <Field label="Year">
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </Field>
            <Field label="Default goal miles">
              <Input
                type="number"
                value={form.defaultGoalMiles}
                onChange={(e) =>
                  setForm({ ...form, defaultGoalMiles: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status || "upcoming"}
                onValueChange={(v) => setForm({ ...form, status: v as ChapterStatus })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Start date">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="End date">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </FormGrid>
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
            {savedAt && !busy && (
              <span className="text-muted-foreground text-xs">
                Saved {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <CharactersSection chapterId={chapter.id} />
      <ParticipantsSection chapterId={chapter.id} />
    </div>
  );
}

function toForm(c: Chapter): EnsureChapterInput {
  return {
    id: c.id,
    title: c.title,
    themeKey: c.themeKey,
    order: c.order,
    month: c.month,
    year: c.year,
    startDate: c.startDate,
    endDate: c.endDate,
    defaultGoalMiles: c.defaultGoalMiles,
    status: c.status,
  };
}
