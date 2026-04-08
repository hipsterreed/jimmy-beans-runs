# Jimmy Bean Runs

This app now uses Firebase Firestore so Hipster Sam and Frodo Bean can log miles against the same shared quest.

## Setup

1. Create a Firebase project in the Firebase console.
2. Add a Web app to that project and copy its config values into [firebase-config.js](/Users/bennettgleave/Documents/CodeEx/jimmy-bean-runs/firebase-config.js).
3. Enable Cloud Firestore in the Firebase console.
4. Start a local server from this folder:

```bash
cd /Users/bennettgleave/Documents/CodeEx/jimmy-bean-runs
python3 -m http.server 8000
```

5. Open `http://localhost:8000`.

## Firestore Rules

For a quick two-person prototype, these rules will let the app read and write:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quests/{questId}/runs/{runId} {
      allow read, write: if true;
    }
  }
}
```

Tighten these before using the app more broadly.

## Hosting

You can host the static files on Firebase Hosting, Vercel, or Netlify. The app only needs standard static hosting plus access to your Firestore project.
