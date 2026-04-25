import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { subscribeToCharacters } from "../shared/lib/characters";
import { createChapterApi } from "../shared/lib/firebase";
import { subscribeToUsers } from "../shared/lib/users";
import type { ChapterCharacter, Runner, User } from "../shared/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

type FormState = {
  userId: string;
  displayName: string;
  characterKey: string;
  goalMiles: number;
  imageUrl: string;
  isEdit: boolean;
};

const blank: FormState = {
  userId: "",
  displayName: "",
  characterKey: "",
  goalMiles: 30,
  imageUrl: "",
  isEdit: false,
};

const NEW_USER_VALUE = "__new__";

type Props = { chapterId: string };

export function ParticipantsSection({ chapterId }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [characters, setCharacters] = useState<ChapterCharacter[]>([]);
  const [participants, setParticipants] = useState<Runner[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToUsers(setUsers), []);
  useEffect(() => subscribeToCharacters(chapterId, setCharacters), [chapterId]);

  const chapterApi = useMemo(
    () =>
      createChapterApi({
        chapterId,
        defaultParticipants: [],
        defaultParticipantGoal: 30,
        defaultCharacterKey: "",
      }),
    [chapterId],
  );

  useEffect(() => {
    return chapterApi.subscribeToChapter({
      onParticipants: setParticipants,
      onRuns: () => {},
      onSyncState: () => {},
    });
  }, [chapterApi]);

  function openNew() {
    setForm(blank);
    setError(null);
    setOpen(true);
  }

  function openEdit(p: Runner) {
    setForm({
      userId: p.id,
      displayName: p.name,
      characterKey: p.characterKey,
      goalMiles: p.goalMiles,
      imageUrl: p.imageUrl || "",
      isEdit: true,
    });
    setError(null);
    setOpen(true);
  }

  function pickUser(value: string) {
    if (value === NEW_USER_VALUE) {
      setForm((f) => ({ ...f, userId: "" }));
      return;
    }
    const user = users.find((u) => u.id === value);
    setForm((f) => ({
      ...f,
      userId: value,
      displayName: user?.displayName || f.displayName,
    }));
  }

  async function save() {
    if (!form.displayName || !form.characterKey) {
      setError("Display name and character key are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (form.isEdit) {
        await chapterApi.updateParticipant({
          userId: form.userId,
          displayName: form.displayName,
          characterKey: form.characterKey,
          goalMiles: form.goalMiles,
          imageUrl: form.imageUrl || undefined,
        });
      } else {
        await chapterApi.addParticipant({
          userId: form.userId || undefined,
          displayName: form.displayName,
          characterKey: form.characterKey,
          goalMiles: form.goalMiles,
          imageUrl: form.imageUrl || undefined,
        });
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Runner) {
    if (!window.confirm(`Remove ${p.name} from ${chapterId}?`)) return;
    await chapterApi.deleteParticipant(p.id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
        <CardDescription>
          {participants.length} in this chapter — a user's persona for the quest.
        </CardDescription>
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <Button size="sm" onClick={openNew}>
            <Plus />
            Add participant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {participants.length === 0 ? (
            <ListEmpty>No participants yet.</ListEmpty>
          ) : (
            participants.map((p) => (
              <ListRow
                key={p.id}
                thumbnail={p.imageUrl || null}
                title={p.name}
                subtitle={`${p.id} · character: ${p.characterKey} · goal: ${p.goalMiles} mi`}
                actions={
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(p)}>
                      Remove
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
              {form.isEdit ? "Edit participant" : "Add participant"}
            </DialogTitle>
            <DialogDescription>
              A participant is a user's persona in this chapter.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormGrid>
              <Field
                label="User"
                hint="Leave blank to auto-create a new user from the persona name."
              >
                <Select
                  value={form.userId || NEW_USER_VALUE}
                  onValueChange={pickUser}
                  disabled={form.isEdit}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NEW_USER_VALUE}>— new user —</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Persona display name" hint="e.g. Hipster Sam">
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </Field>
              <Field
                label="Character"
                hint={
                  characters.length === 0
                    ? "No characters yet — add one in this chapter first."
                    : undefined
                }
              >
                <Select
                  value={form.characterKey}
                  onValueChange={(v) => setForm({ ...form, characterKey: v })}
                  disabled={characters.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a character" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Goal miles">
                <Input
                  type="number"
                  value={form.goalMiles}
                  onChange={(e) =>
                    setForm({ ...form, goalMiles: Number(e.target.value) })
                  }
                />
              </Field>
            </FormGrid>
            <Field label="Profile image" hint="Optional. Stored in Firebase Storage.">
              <ImageUpload
                pathPrefix={`chapters/${chapterId}/participants/${form.userId || "new"}`}
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
              {busy ? "Saving…" : form.isEdit ? "Save changes" : "Add participant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
