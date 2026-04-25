import { DevModeButton } from "./components/DevModeButton";
import { HeroPanel } from "./components/HeroPanel";
import { ProgressChart } from "./components/ProgressChart";
import { RosterPanel } from "./components/RosterPanel";
import { SetupPanel } from "./components/SetupPanel";
import { SideQuestsPanel } from "./components/SideQuestsPanel";
import { DeleteRunModal } from "./components/modals/DeleteRunModal";
import { EndingModal } from "./components/modals/EndingModal";
import { QuestGameModal } from "./components/modals/QuestGameModal";
import { ResetQuestModal } from "./components/modals/ResetQuestModal";
import { RunnerModal } from "./components/modals/RunnerModal";
import { useEndingSync } from "./hooks/useEndingSync";
import { useFirestoreQuest } from "./hooks/useFirestoreQuest";
import { useQuestStore } from "./store/questStore";

export default function App() {
  const runners = useQuestStore((s) => s.runners);
  const runs = useQuestStore((s) => s.runs);
  const devMode = useQuestStore((s) => s.devMode);
  const toggleDevMode = useQuestStore((s) => s.toggleDevMode);

  const { configured } = useFirestoreQuest();
  useEndingSync();

  const state = { runners, runs };

  return (
    <main className="app-shell">
      <HeroPanel state={state} />
      <RosterPanel runners={runners} runs={runs} />
      <SideQuestsPanel state={state} devMode={devMode} />
      <ProgressChart state={state} />
      <SetupPanel hidden={configured} />
      <DevModeButton enabled={devMode} onToggle={toggleDevMode} />

      <RunnerModal />
      <DeleteRunModal />
      <ResetQuestModal />
      <QuestGameModal />
      <EndingModal />
    </main>
  );
}
