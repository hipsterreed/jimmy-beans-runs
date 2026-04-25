import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ensureChapter,
  subscribeToChapters,
  type EnsureChapterInput,
} from "../shared/lib/chapters";
import type { Chapter, ChapterStatus } from "../shared/lib/types";
import { ChapterDetail } from "./ChapterDetail";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";

const STATUS_OPTIONS: ChapterStatus[] = ["upcoming", "active", "complete"];

const blankForm: EnsureChapterInput = {
  id: "",
  title: "",
  themeKey: "",
  order: 0,
  month: 1,
  year: new Date().getFullYear(),
  startDate: "",
  endDate: "",
  defaultGoalMiles: 30,
  status: "upcoming",
};

const STATUS_BADGE: Record<ChapterStatus, string> = {
  active: "bg-green-100 text-green-800",
  upcoming: "bg-blue-100 text-blue-800",
  complete: "bg-gray-200 text-gray-700",
};

export function ChaptersTab() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EnsureChapterInput>(blankForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToChapters(setChapters), []);

  const selected = selectedId
    ? chapters.find((c) => c.id === selectedId) || null
    : null;

  if (selected) {
    return <ChapterDetail chapter={selected} onBack={() => setSelectedId(null)} />;
  }

  function openNew() {
    setForm(blankForm);
    setError(null);
    setOpen(true);
  }

  async function save() {
    if (!form.id) {
      setError("Chapter ID is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensureChapter(form);
      setOpen(false);
      setSelectedId(form.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chapters</CardTitle>
        <CardDescription>{chapters.length} total · click a row to manage.</CardDescription>
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <Button onClick={openNew}>
            <Plus />
            New chapter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {chapters.length === 0 ? (
          <div className="text-muted-foreground px-6 py-12 text-center text-sm">
            No chapters yet —{" "}
            <button onClick={openNew} className="underline underline-offset-2">
              create the first one
            </button>
            .
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Chapter</TableHead>
                <TableHead>Theme</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapters.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(c.id)}
                >
                  <TableCell className="pl-6 font-medium">{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{c.themeKey}</TableCell>
                  <TableCell>
                    {c.month}/{c.year}
                  </TableCell>
                  <TableCell>{c.order}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground pr-6 text-right text-xs">
                    {c.id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create chapter</DialogTitle>
            <DialogDescription>
              Fill in the basics — you can finish setting things up on the chapter's
              page after saving.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormGrid>
              <Field label="ID" hint="Lowercase slug, e.g. chapter-3">
                <Input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  autoFocus
                />
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
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as ChapterStatus })
                  }
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
            </FormGrid>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Create & open"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
