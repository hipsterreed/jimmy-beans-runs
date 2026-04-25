import type { Chapter } from "../../shared/lib/types";
import { Field } from "./Field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Props = {
  chapters: Chapter[];
  value: string;
  onChange: (chapterId: string) => void;
};

export function ChapterPicker({ chapters, value, onChange }: Props) {
  return (
    <Field label="Chapter">
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a chapter" />
        </SelectTrigger>
        <SelectContent>
          {chapters.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.title} <span className="text-muted-foreground">({c.id})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
