import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { ChapterCharacter, ChapterCharacterDoc } from "./types";

function charactersCollection(chapterId: string) {
  return collection(getDb(), "chapters", chapterId, "characters");
}

function characterDocRef(chapterId: string, key: string) {
  return doc(getDb(), "chapters", chapterId, "characters", key);
}

function hydrate(key: string, data: ChapterCharacterDoc): ChapterCharacter {
  return {
    key,
    label: data.label || key,
    flavor: data.flavor || "",
    accent: data.accent || "warm",
    imageUrl: data.imageUrl,
    createdAtMs: Number(data.createdAtMs) || 0,
  };
}

export function subscribeToCharacters(
  chapterId: string,
  cb: (characters: ChapterCharacter[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    charactersCollection(chapterId),
    (snapshot) => {
      const characters = snapshot.docs
        .map((d) => hydrate(d.id, d.data() as ChapterCharacterDoc))
        .sort((a, b) => a.label.localeCompare(b.label));
      cb(characters);
    },
    (error) => {
      console.error(error);
      onError?.(error);
    },
  );
}

export type EnsureCharacterInput = {
  chapterId: string;
  key: string;
  label: string;
  flavor: string;
  accent: string;
  imageUrl?: string;
};

export async function ensureCharacter(input: EnsureCharacterInput): Promise<void> {
  const payload: ChapterCharacterDoc = {
    label: input.label,
    flavor: input.flavor,
    accent: input.accent,
    createdAtMs: Date.now(),
  };
  if (input.imageUrl) payload.imageUrl = input.imageUrl;
  await setDoc(characterDocRef(input.chapterId, input.key), payload, {
    merge: true,
  });
}

export async function deleteCharacter(
  chapterId: string,
  key: string,
): Promise<void> {
  await deleteDoc(characterDocRef(chapterId, key));
}
