const env = import.meta.env;

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? "AIzaSyB58ZQFETam3JghgTW16swgG8FNADXEu_Y",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? "jimbo-and-bean-runs.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? "jimbo-and-bean-runs",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? "jimbo-and-bean-runs.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "445321846669",
  appId: env.VITE_FIREBASE_APP_ID ?? "1:445321846669:web:2e6e25f49c3131caa7a7c4",
};

export function hasFirebaseConfig(): boolean {
  const required = [
    FIREBASE_CONFIG.apiKey,
    FIREBASE_CONFIG.projectId,
    FIREBASE_CONFIG.appId,
  ];
  return required.every((value) => typeof value === "string" && value.length > 0);
}
