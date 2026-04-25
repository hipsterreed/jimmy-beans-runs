import { useRef, useState } from "react";
import { uploadImage } from "../shared/lib/storage";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";

type Props = {
  pathPrefix: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
};

export function ImageUpload({ pathPrefix, currentUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | undefined>(currentUrl);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(pathPrefix, file);
      setPreview(url);
      onUploaded(url);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clear() {
    setPreview(undefined);
    onUploaded("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="bg-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
          {preview ? (
            <img src={preview} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
              none
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={busy}
            className="text-foreground file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <div className="flex items-center gap-2">
            {busy && (
              <span className="text-muted-foreground text-xs">Uploading…</span>
            )}
            {preview && !busy && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
