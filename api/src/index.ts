import { Elysia } from "elysia";
import { initFirebase, listenForNewRuns, getRunner, getDb } from "./firebase";
import { sendRunSlackNotification } from "./slack";
import { generateRunNarration } from "./groq";

const QUEST_ID = "april-quest";

const CHARACTER_NAMES: Record<string, string> = {
  sam: "Samwise",
  frodo: "Frodo",
  aragorn: "Aragorn",
  gimli: "Gimli",
  legolas: "Legolas",
  gandalf: "Gandalf",
  eowyn: "Eowyn",
  merry: "Merry",
  pippin: "Pippin",
  sauron: "Sauron",
  "tom-bombadil": "Tom Bombadil",
  treebeard: "Treebeard",
  gollum: "Gollum",
  balrog: "Balrog",
};

initFirebase();

async function handleNewRun(run: {
  id: string;
  runnerId: string;
  miles: number;
  runDate: string;
  createdAtMs: number;
}) {
  console.log(`[run] New run detected: ${run.id} — ${run.miles} miles by ${run.runnerId}`);

  const db = getDb();

  const [runner, allRunsSnapshot, allRunnersSnapshot] = await Promise.all([
    getRunner(run.runnerId),
    db.collection("quests").doc(QUEST_ID).collection("runs").get(),
    db.collection("quests").doc(QUEST_ID).collection("runners").get(),
  ]);

  if (!runner) {
    console.warn(`[run] Could not find runner ${run.runnerId}, skipping Slack notification`);
    return;
  }

  const combinedMiles = allRunsSnapshot.docs.reduce(
    (sum, doc) => sum + (Number(doc.data().miles) || 0),
    0,
  );

  const totalGoalMiles = allRunnersSnapshot.docs.reduce(
    (sum, doc) => sum + (Number(doc.data().goalMiles) || 0),
    0,
  );

  const milesRemaining = Math.max(totalGoalMiles - combinedMiles, 0);
  const characterName = CHARACTER_NAMES[runner.characterKey] ?? runner.characterKey;

  const narration = await generateRunNarration({
    runnerName: runner.name,
    characterName,
    distanceMiles: run.miles,
    totalProgressMiles: combinedMiles,
    goalMiles: totalGoalMiles,
    milesRemaining,
  });

  await sendRunSlackNotification({
    runnerId: run.runnerId,
    runnerName: runner.name,
    characterKey: runner.characterKey,
    miles: run.miles,
    runDate: run.runDate,
    combinedMiles,
    totalGoalMiles,
    narration,
  });
}

listenForNewRuns(handleNewRun);
console.log("[firebase] Listening for new runs on quests/april-quest/runs...");

const app = new Elysia()
  .get("/", () => ({ status: "ok", service: "jimmy-beans-runs-api" }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .listen(process.env.PORT ?? 3001);

console.log(`[elysia] Server running at http://localhost:${app.server?.port}`);
