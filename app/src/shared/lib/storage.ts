import { getApp } from "firebase/app";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";
import { getDb } from "./firebase";

let storage: FirebaseStorage | null = null;

function getStorageInstance(): FirebaseStorage {
  // Force firebase app initialization via getDb side effect.
  getDb();
  if (!storage) {
    storage = getStorage(getApp());
  }
  return storage;
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadImage(
  pathPrefix: string,
  file: File,
): Promise<string> {
  const stamp = Date.now();
  const objectRef = ref(
    getStorageInstance(),
    `${pathPrefix}/${stamp}-${safeFilename(file.name)}`,
  );
  const snap = await uploadBytes(objectRef, file, { contentType: file.type });
  return await getDownloadURL(snap.ref);
}
