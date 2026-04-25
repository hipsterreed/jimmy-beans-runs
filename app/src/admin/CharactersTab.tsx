import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  deleteCharacter,
  ensureCharacter,
  subscribeToCharacters,
} from "../shared/lib/characters";
import type { ChapterCharacter } from "../shared/lib/types";
import { ImageUpload } from "./ImageUpload";
import { Field, FormGrid } from "./components/Field";
import { ListEmpty, ListRow } from "./components/ListRow";
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
import { Textarea } from "./components/ui/textarea";

type FormState = {
  key: string;
  label: string;
  flavor: string;
  accent: string;
  imageUrl: string;
  isEdit: boolean;
};

const blank: FormState = {
  key: "",
  label: "",
  flavor: "",
  accent: "warm",
  imageUrl: "",
  isEdit: false,
};

type Props = { chapterId: string };

export function CharactersSection({ chapterId }: Props) {
  const [characters, setCharacters] = useState<ChapterCharacter[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToCharacters(chapterId, setCharacters), [chapterId]);

  function openNew() {
    setForm(blank);
    setError(null);
    setOpen(true);
  }

  function openEdit(c: ChapterCharacter) {
    setForm({
      key: c.key,
      label: c.label,
      flavor: c.flavor,
      accent: c.accent,
      imageUrl: c.imageUrl || "",
      isEdit: true,
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    if (!form.key || !form.label) {
      setError("Key and label are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensureCharacter({
        chapterId,
        key: form.key,
        label: form.label,
        flavor: form.flavor,
        accent: form.accent,
        imageUrl: form.imageUrl || undefined,
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: ChapterCharacter) {
    if (!window.confirm(`Delete character "${c.label}"?`)) return;
    await deleteCharacter(chapterId, c.key);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Characters</CardTitle>
        <CardDescription>
          {characters.length} archetypes available to participants in this chapter.
        </CardDescription>
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <Button size="sm" onClick={openNew}>
            <Plus />
            Add character
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {characters.length === 0 ? (
            <ListEmpty>No characters yet.</ListEmpty>
          ) : (
            characters.map((c) => (
              <ListRow
                key={c.key}
                thumbnail={c.imageUrl || null}
                title={
                  <>
                    {c.label}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({c.key})
                    </span>
                  </>
                }
                subtitle={`accent: ${c.accent}${c.flavor ? ` · ${c.flavor}` : ""}`}
                actions={
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(c)}>
                      Delete
                    </Button>
                  </>
                }
              />
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.isEdit ? `Edit character: ${form.key}` : "Add character"}
            </DialogTitle>
            <DialogDescription>
              Characters are the theme archetypes for this chapter.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormGrid>
              <Field label="Key" hint="Stable slug, e.g. sam, yoda">
                <Input
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  disabled={form.isEdit}
                />
              </Field>
              <Field label="Label">
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </Field>
              <Field label="Accent" hint="warm, green, steel, …">
                <Input
                  value={form.accent}
                  onChange={(e) => setForm({ ...form, accent: e.target.value })}
                />
              </Field>
            </FormGrid>
            <Field label="Flavor text">
              <Textarea
                value={form.flavor}
                onChange={(e) => setForm({ ...form, flavor: e.target.value })}
              />
            </Field>
            <Field label="Character image" hint="Optional. Stored in Firebase Storage.">
              <ImageUpload
                pathPrefix={`chapters/${chapterId}/characters/${form.key || "new"}`}
                currentUrl={form.imageUrl || undefined}
                onUploaded={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : form.isEdit ? "Save changes" : "Add character"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
