import { useEffect, useState } from "react";
import {
  deleteUser,
  ensureUser,
  subscribeToUsers,
  updateUser,
} from "../shared/lib/users";
import type { User } from "../shared/lib/types";
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
import { Input } from "./components/ui/input";

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [id, setId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToUsers(setUsers), []);

  async function save() {
    if (!id || !displayName) {
      setError("ID and display name are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensureUser({ id, displayName });
      setId("");
      setDisplayName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function rename(user: User) {
    const next = window.prompt("New display name", user.displayName);
    if (!next || next === user.displayName) return;
    await updateUser({ id: user.id, displayName: next });
  }

  async function remove(user: User) {
    if (
      !window.confirm(
        `Delete user ${user.id}? Their participant records in chapters are not removed.`,
      )
    )
      return;
    await deleteUser(user.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
          <CardDescription>
            Users represent real people across chapters. Each chapter can give them a
            different persona under the Participants tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormGrid>
            <Field label="User ID" hint="Stable slug, e.g. user-jimmy">
              <Input value={id} onChange={(e) => setId(e.target.value)} />
            </Field>
            <Field label="Display name">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Field>
          </FormGrid>
          <div>
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Create user"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>{users.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {users.length === 0 ? (
              <ListEmpty>No users yet.</ListEmpty>
            ) : (
              users.map((u) => (
                <ListRow
                  key={u.id}
                  title={u.displayName}
                  subtitle={u.id}
                  actions={
                    <>
                      <Button variant="outline" size="sm" onClick={() => rename(u)}>
                        Rename
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(u)}>
                        Delete
                      </Button>
                    </>
                  }
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
