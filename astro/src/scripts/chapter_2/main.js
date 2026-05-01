import "./lightsaber.js";
import { createChapterApi } from "../lib/chapterApi.js";
import { hasFirebaseConfig } from "../lib/firebaseConfig.js";
import {
  ACTIVITY_TYPES,
  BATTLE_OUTCOME_TIERS,
  BATTLE_READINESS_WEIGHTS,
  calculateWorkoutPoints,
  CHAPTER_ID,
  CHAPTER_THEME,
  CHARACTER_OPTIONS,
  DEFAULT_CHARACTER_KEY,
  DEFAULT_PARTICIPANTS,
  DEFAULT_RUNNER_GOAL,
  FINAL_BATTLE_DATE,
  GOAL_PRESETS,
  LEGACY_PARTICIPANT_ID_MAP,
  levelForPoints,
  nextLevelPoints,
  PLANET_UNLOCKS,
  pointsForLevel,
  supportUnlocksForCharacter,
} from "./data.js";

const api = createChapterApi({
  chapterId: CHAPTER_ID,
  defaultParticipants: DEFAULT_PARTICIPANTS,
  defaultParticipantGoal: DEFAULT_RUNNER_GOAL,
  defaultCharacterKey: DEFAULT_CHARACTER_KEY,
  legacyParticipantIdMap: LEGACY_PARTICIPANT_ID_MAP,
  connectedMessage: "Rebel command sync active.",
});

const BUTTON_CLICK_SOUND_PATH = "/chapter_2/star-wars-blaster.mp3";
const BUTTON_CLICK_AUDIO_POOL_SIZE = 4;
const BUTTON_SOUND_MUTED_STORAGE_KEY = "chapter2-button-sound-muted";
const HYPERSPACE_CLASS_NAME = "is-hyperspace-jump";
const HYPERSPACE_DURATION_MS = 980;
const IMPERIAL_MARCH_VOLUME = 0.035;
const buttonClickAudioPool = Array.from({ length: BUTTON_CLICK_AUDIO_POOL_SIZE }, () =>
  typeof Audio === "function" ? new Audio(BUTTON_CLICK_SOUND_PATH) : null,
).filter(Boolean);
let buttonClickAudioIndex = 0;
let isButtonSoundMuted = window.localStorage.getItem(BUTTON_SOUND_MUTED_STORAGE_KEY) === "true";
let imperialMarchAudioContext = null;
let hyperspaceTimeoutId = null;

buttonClickAudioPool.forEach((audio) => {
  audio.preload = "auto";
  audio.load();
});

const state = {
  participants: [],
  runs: [],
  pendingDeleteRunId: null,
  participantModalMode: "create",
};

const els = {
  syncBanner: document.getElementById("syncBanner"),
  chapterEyebrow: document.getElementById("chapterEyebrow"),
  chapterDescription: document.getElementById("chapterDescription"),
  pointsExplanation: document.getElementById("pointsExplanation"),
  totalPoints: document.getElementById("totalPoints"),
  goalPoints: document.getElementById("goalPoints"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  activeTime: document.getElementById("activeTime"),
  rebelLevel: document.getElementById("rebelLevel"),
  levelCurrent: document.getElementById("levelCurrent"),
  levelRemaining: document.getElementById("levelRemaining"),
  levelFill: document.getElementById("levelFill"),
  levelProgressText: document.getElementById("levelProgressText"),
  addParticipantButton: document.getElementById("addParticipantButton"),
  resetRunsButton: document.getElementById("resetRunsButton"),
  runnerGrid: document.getElementById("runnerGrid"),
  flightPath: document.getElementById("flightPath"),
  shipGrid: document.getElementById("shipGrid"),
  battleIntro: document.getElementById("battleIntro"),
  battleScore: document.getElementById("battleScore"),
  battleStatus: document.getElementById("battleStatus"),
  battleScoreFill: document.getElementById("battleScoreFill"),
  battleOutcomeTitle: document.getElementById("battleOutcomeTitle"),
  battleOutcomeDescription: document.getElementById("battleOutcomeDescription"),
  battleXpPercent: document.getElementById("battleXpPercent"),
  battleXpFill: document.getElementById("battleXpFill"),
  battleTargetPercent: document.getElementById("battleTargetPercent"),
  battleTargetFill: document.getElementById("battleTargetFill"),
  battleUnlockPercent: document.getElementById("battleUnlockPercent"),
  battleUnlockFill: document.getElementById("battleUnlockFill"),
  participantModal: document.getElementById("participantModal"),
  participantModalEyebrow: document.getElementById("participantModalEyebrow"),
  participantModalTitle: document.getElementById("participantModalTitle"),
  participantForm: document.getElementById("participantForm"),
  participantPresetGuide: document.getElementById("participantPresetGuide"),
  participantId: document.getElementById("participantId"),
  participantName: document.getElementById("participantName"),
  participantCharacter: document.getElementById("participantCharacter"),
  participantGoalPreset: document.getElementById("participantGoalPreset"),
  participantGoalPresetCopy: document.getElementById("participantGoalPresetCopy"),
  participantGoalWrap: document.getElementById("participantGoalWrap"),
  participantGoal: document.getElementById("participantGoal"),
  cancelParticipantButton: document.getElementById("cancelParticipantButton"),
  deleteRunModal: document.getElementById("deleteRunModal"),
  deleteRunDescription: document.getElementById("deleteRunDescription"),
  cancelDeleteRunButton: document.getElementById("cancelDeleteRunButton"),
  confirmDeleteRunButton: document.getElementById("confirmDeleteRunButton"),
  resetModal: document.getElementById("resetModal"),
  cancelResetButton: document.getElementById("cancelResetButton"),
  confirmResetButton: document.getElementById("confirmResetButton"),
  muteToggle: document.getElementById("muteToggle"),
  avatarViewerModal: document.getElementById("avatarViewerModal"),
  avatarViewerFrame: document.getElementById("avatarViewerFrame"),
  closeAvatarViewerButton: document.getElementById("closeAvatarViewerButton"),
};

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function chapterDefaultDate() {
  return "2026-05-01";
}

function formatPoints(value) {
  return String(Math.round(Number(value || 0)));
}

function formatMinutes(value) {
  const minutes = Math.max(0, Math.round(Number(value || 0)));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function parseDateLabel(isoDate) {
  if (!isoDate) return "Unknown";
  const [year, month, day] = isoDate.split("-").map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsed);
}

function parseIsoDate(isoDate) {
  const [year, month, day] = String(isoDate || "").split("-").map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1);
}

function normalizeNameInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase();
}

function characterFor(key) {
  return CHARACTER_OPTIONS.find((character) => character.key === key) || CHARACTER_OPTIONS[0];
}

function selectionCharacters() {
  return [
    ...CHARACTER_OPTIONS.filter((character) => character.key !== "salacious-crumb"),
    {
      key: "salacious-crumb",
      label: "Mace Windu",
      flavor: "Purple-blade legend. Definitely not a tiny cackling lizard.",
    },
  ];
}

function activityFor(key) {
  return ACTIVITY_TYPES.find((activity) => activity.key === key) || ACTIVITY_TYPES[0];
}

function characterImageUrlFor(key) {
  if (key === "salacious-crumb" || key === "mace-windu") {
    return "/chapter_2/mace_windu.png";
  }
  return "";
}

function openAvatarViewer(imageUrl) {
  if (!imageUrl || !els.avatarViewerModal || !els.avatarViewerFrame) return;
  const safeUrl = String(imageUrl).replace(/"/g, "&quot;");
  els.avatarViewerFrame.srcdoc = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        html, body {
          margin: 0;
          min-height: 100%;
          background: #040813;
        }
        body {
          display: grid;
          place-items: center;
          padding: 16px;
          box-sizing: border-box;
        }
        img {
          display: block;
          max-width: min(92vw, 860px);
          max-height: min(82vh, 720px);
          width: auto;
          height: auto;
          border-radius: 18px;
          box-shadow: 0 18px 36px rgba(0,0,0,0.45);
        }
      </style>
    </head>
    <body>
      <img src="${safeUrl}" alt="Expanded character portrait" />
    </body>
  </html>`;
  els.avatarViewerModal.showModal();
}

function closeAvatarViewer() {
  if (!els.avatarViewerModal || !els.avatarViewerFrame) return;
  els.avatarViewerFrame.removeAttribute("src");
  els.avatarViewerFrame.srcdoc = "";
  els.avatarViewerModal.close();
}

function pixelSvg(sprite, className = "pixel-sprite", options = {}) {
  const pixel = sprite.pixel || 4;
  const width = sprite.width || sprite.rows[0].length * pixel;
  const height = sprite.height || sprite.rows.length * pixel;
  const rects = [];
  const rounded = Boolean(options.rounded);
  const bleed = rounded ? pixel * 0.14 : 0;
  const radius = rounded ? pixel * 0.38 : 0;

  sprite.rows.forEach((row, rowIndex) => {
    [...row].forEach((token, columnIndex) => {
      if (token === ".") return;
      const fill = sprite.colors[token];
      if (!fill) return;
      rects.push(
        `<rect x="${columnIndex * pixel - bleed}" y="${rowIndex * pixel - bleed}" width="${pixel + bleed * 2}" height="${pixel + bleed * 2}" rx="${radius}" ry="${radius}" fill="${fill}"></rect>`,
      );
    });
  });

  return `<svg class="${className}" viewBox="0 0 ${width} ${height}" aria-hidden="true">${rects.join("")}</svg>`;
}

function planetIllustration(type, className = "planet-illustration") {
  const defs = {
    "forest-moon": {
      base: ["#79d08f", "#29563f"],
      overlay: `<path d="M42 18c9 1 16 8 19 16-8 0-13 3-17 8-5 6-12 8-21 6 2-6 0-10-5-13 4-10 12-17 24-17Z" fill="#aef7b9" opacity=".9"/><path d="M23 47c5-4 11-6 17-5-4 4-4 10-2 16-6 0-12-4-15-11Z" fill="#4d8f63"/><path d="M44 56c7-1 13-4 17-10 2 9-6 18-16 20-6 1-12 0-18-3 7 0 12-2 17-7Z" fill="#2e6a48"/>`,
    },
    desert: {
      base: ["#f7d990", "#b7773d"],
      overlay: `<path d="M18 30c10-4 22-4 34 0-7 4-8 8-4 12-11 3-23 3-35 0 5-3 7-7 5-12Z" fill="#e8b96b"/><path d="M20 47c12 4 24 4 37 0-7 8-16 12-27 12-8 0-15-2-21-7 5 0 9-2 11-5Z" fill="#fff1be" opacity=".8"/><circle cx="54" cy="24" r="5" fill="#d89d57" opacity=".75"/>`,
    },
    grassland: {
      base: ["#c1f786", "#3b7b45"],
      overlay: `<path d="M24 20c10-3 20-2 29 4-6 2-10 6-11 12-8 1-15 4-20 10-4-6-5-14 2-26Z" fill="#98df71"/><path d="M38 38c7-1 14 1 21 7-4 10-14 17-25 17-7 0-13-3-18-7 12 0 20-6 22-17Z" fill="#78ba5f"/><path d="M49 18c7 2 12 7 14 13-5-1-9 0-13 3-1-6-1-11-1-16Z" fill="#e2ffbc" opacity=".8"/>`,
    },
    ice: {
      base: ["#eefaff", "#6fb6e7"],
      overlay: `<path d="M21 28c7-8 16-12 26-11-4 5-4 10 0 15-8 0-14 4-20 10-6-3-9-8-6-14Z" fill="#dff7ff"/><path d="M37 36c8-2 16 0 25 5-5 11-14 18-26 18-7 0-13-2-18-7 11 1 17-4 19-16Z" fill="#a7dcfb"/><path d="M49 20c7 2 12 6 15 12-5-1-9 1-13 5-2-6-3-11-2-17Z" fill="#ffffff" opacity=".85"/>`,
    },
    "gas-giant": {
      base: ["#f4d5a1", "#9c5a43"],
      overlay: `<path d="M13 26c14-6 28-6 43 0-15 3-16 8-4 14-13 5-28 5-44 0 10-5 11-10 5-14Z" fill="#e6b678"/><path d="M16 43c13 5 27 5 42 0-11 10-23 15-36 14-8-1-14-4-19-9 6 0 10-2 13-5Z" fill="#d39a5d"/><ellipse cx="53" cy="24" rx="7" ry="4" fill="#fff0c9" opacity=".55"/>`,
    },
    forest: {
      base: ["#7fd36d", "#324f2f"],
      overlay: `<path d="M22 22c11-4 21-3 31 3-6 3-10 7-11 12-10 1-17 4-22 9-5-6-6-14 2-24Z" fill="#61ab57"/><path d="M43 38c8-1 16 2 22 8-4 10-13 16-25 17-8 1-15-1-21-6 13 0 20-6 24-19Z" fill="#8f6b43"/><path d="M49 20c7 1 12 5 15 11-5 0-9 2-13 6-2-6-2-11-2-17Z" fill="#a3ec8d" opacity=".8"/>`,
    },
    tropical: {
      base: ["#76e7de", "#1f74a6"],
      overlay: `<path d="M19 27c8-8 18-11 30-9-5 5-5 10-2 15-9 1-16 4-22 10-6-4-8-9-6-16Z" fill="#5fd0e8"/><path d="M40 40c7-1 15 1 23 6-4 10-13 17-25 18-8 0-14-3-19-7 12 0 20-6 21-17Z" fill="#f3d985"/><path d="M51 17c7 1 13 5 17 11-6 0-10 2-14 6-2-6-3-11-3-17Z" fill="#b6fff2" opacity=".85"/>`,
    },
    "death-star": {
      base: ["#8f97a1", "#2a3138"],
      overlay: `<circle cx="48" cy="31" r="9" fill="#303840"/><path d="M20 26c12-9 28-12 42-7-9 3-15 8-18 15-8-1-16 1-25 6-3-5-3-10 1-14Z" fill="#727b85"/><path d="M24 46c13 3 25 3 37-2-7 10-17 16-30 17-7 0-13-2-19-6 5 0 9-3 12-9Z" fill="#58616c"/><path d="M50 17c8 2 13 7 15 14-5-1-10 1-14 6-3-7-3-13-1-20Z" fill="#c5ccd4" opacity=".55"/>`,
    },
  }[type];

  if (!defs) return "";
  const gradientId = `planet-grad-${type}`;
  const glowId = `planet-glow-${type}`;

  return `
    <svg class="${className}" viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <radialGradient id="${gradientId}" cx="34%" cy="28%" r="70%">
          <stop offset="0%" stop-color="${defs.base[0]}"></stop>
          <stop offset="60%" stop-color="${defs.base[0]}"></stop>
          <stop offset="100%" stop-color="${defs.base[1]}"></stop>
        </radialGradient>
        <filter id="${glowId}" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.6" result="blur"></feGaussianBlur>
          <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
        </filter>
      </defs>
      <circle cx="40" cy="40" r="27" fill="url(#${gradientId})" filter="url(#${glowId})"></circle>
      <circle cx="30" cy="28" r="7" fill="rgba(255,255,255,.14)"></circle>
      ${defs.overlay}
      <ellipse cx="26" cy="23" rx="14" ry="8" fill="rgba(255,255,255,.12)" transform="rotate(-22 26 23)"></ellipse>
    </svg>
  `;
}

function shipIllustration(key, className = "ship-illustration") {
  const shipMarkup = {
    gr75: `<path d="M14 40c5-9 15-14 30-15h17c7 0 13 3 18 8l6 6-6 6c-5 5-11 8-18 8H44c-15-1-25-6-30-13Z" fill="#d8dbd6"/><path d="M18 40c4-7 13-11 26-12h16c6 0 11 2 15 6l4 5-4 5c-4 4-9 6-15 6H44c-13-1-22-5-26-10Z" fill="#c2c6c1"/><path d="M18 40h49" stroke="#9aa09f" stroke-width="2.2" stroke-linecap="round" opacity=".65"/><path d="M24 33h37M22 46h40" stroke="#a9aeab" stroke-width="1.8" stroke-linecap="round" opacity=".6"/><path d="M18 36c10-4 23-5 38-4" stroke="#8a8f8e" stroke-width="1.8" stroke-linecap="round"/><path d="M18 44c11 3 23 4 37 3" stroke="#8a8f8e" stroke-width="1.8" stroke-linecap="round"/><path d="M68 32h8l4 7-4 7h-8Z" fill="#8f9495"/><path d="M71 35h8l3 4-3 4h-8Z" fill="#5f6669"/><path d="M17 34 12 31h6l2 3ZM17 46 12 49h6l2-3Z" fill="#7d8588"/><path d="M22 28h5l2 4h-7Z" fill="#9ea5a7"/><path d="M72 36h5M72 42h5" stroke="#9be8ff" stroke-width="2.6" stroke-linecap="round"/><path d="M72 36h5M72 42h5" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" opacity=".55"/><path d="M25 26h3v4h-3Z" fill="#cfd6d3"/><path d="M23 51h5" stroke="#6d7578" stroke-width="1.6" stroke-linecap="round"/>`,
    landspeeder: `<path d="M14 46c0-7 6-13 13-13h28c9 0 18 5 23 12l5 7H18c-3-2-4-4-4-6Z" fill="#d08f77"/><path d="M18 52h58c-2 6-7 10-14 10H25c-5 0-9-4-7-10Z" fill="#bc775e"/><path d="M25 37h31c6 0 12 3 16 8H21c1-4 2-6 4-8Z" fill="#e7ab95"/><path d="M44 30c4 0 8 2 11 5l4 5H40l2-6c0-3 1-4 2-4Z" fill="#8db5d8"/><path d="M44 31c3 0 6 1 8 4l2 3H42l1-4c0-2 0-3 1-3Z" fill="#d9f2ff" opacity=".7"/><rect x="23" y="44" width="17" height="6" rx="3" fill="#3c2b2a"/><rect x="55" y="44" width="12" height="5" rx="2.5" fill="#423536"/><path d="M21 41 18 27h9l4 14Z" fill="#8f6f59"/><rect x="16" y="23" width="12" height="6" rx="2" fill="#6a85a3"/><path d="M18 50c4 7 0 11-4 11" stroke="#5fd6ff" stroke-width="2.8" stroke-linecap="round"/><path d="M69 50c4 7 0 11-4 11" stroke="#5fd6ff" stroke-width="2.8" stroke-linecap="round"/><path d="M28 36h32" stroke="#f3c6ae" stroke-width="1.8" stroke-linecap="round" opacity=".65"/><path d="M24 57h37" stroke="#8a8f93" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>`,
    xwing: `<path d="M37 30 43 30 46 50 40 63 34 50Z" fill="#e9edf1"/><path d="M38 31h4l1 20-3 8-3-8Z" fill="#cfd6de"/><path d="M36 33 32 24 18 11 12 9 18 17 29 29Z" fill="#dfe5eb"/><path d="M44 33 48 24 62 11 68 9 62 17 51 29Z" fill="#dfe5eb"/><path d="M36 43 31 49 18 65 14 71 22 66 34 52Z" fill="#aeb8c2"/><path d="M44 43 49 49 62 65 66 71 58 66 46 52Z" fill="#aeb8c2"/><path d="M27 27 31 24 35 30 31 33Z" fill="#707f8f"/><path d="M45 30 49 24 53 27 49 33Z" fill="#707f8f"/><path d="M29 48 33 45 36 50 33 54Z" fill="#5d6976"/><path d="M44 50 47 45 51 48 47 54Z" fill="#5d6976"/><circle cx="30" cy="29" r="4.6" fill="#2e353d"/><circle cx="50" cy="29" r="4.6" fill="#2e353d"/><circle cx="34" cy="49" r="4.2" fill="#2e353d"/><circle cx="46" cy="49" r="4.2" fill="#2e353d"/><circle cx="30" cy="29" r="2.2" fill="#0b1016"/><circle cx="50" cy="29" r="2.2" fill="#0b1016"/><circle cx="34" cy="49" r="2" fill="#0b1016"/><circle cx="46" cy="49" r="2" fill="#0b1016"/><path d="M39 34h2v8h-2Z" fill="#161d26"/><path d="M36 33 38 31M44 33 42 31" stroke="#ef5350" stroke-width="2.2" stroke-linecap="round"/><path d="M30 22 18 12M50 22 62 12M33 55 22 66M47 55 58 66" stroke="#ef5350" stroke-width="1.8" stroke-linecap="round"/><path d="M39 58h2l1 4h-4Z" fill="#ffd24c"/>`,
    snowspeeder: `<path d="M13 49 28 39 45 34 60 36 69 43 63 55 36 58 16 55Z" fill="#edf2f6"/><path d="M21 50 34 42 46 39 57 41 51 52 34 55 20 54Z" fill="#d2d9e0"/><path d="M35 38h12l7 6H31Z" fill="#b9c5cf"/><path d="M33 38 36 30h16l4 8Z" fill="#eef5fb"/><path d="M35 39h5l-2 7h-6Z" fill="#202733"/><path d="M42 38h6l2 7h-7Z" fill="#202733"/><path d="M19 53 14 62M47 50 52 60" stroke="#8f9aa6" stroke-width="2.4" stroke-linecap="round"/><path d="M25 42 15 27M51 41 63 29" stroke="#aeb9c4" stroke-width="5.2" stroke-linecap="round"/><path d="M25 42 15 27M51 41 63 29" stroke="#3b424a" stroke-width="2.1" stroke-linecap="round"/><circle cx="24" cy="42" r="3.8" fill="#aab6c2"/><circle cx="50" cy="41" r="3.8" fill="#aab6c2"/><path d="M25 34h11" stroke="#ff6b3d" stroke-width="3.6" stroke-linecap="round"/><path d="M52 37h10" stroke="#ff6b3d" stroke-width="3.6" stroke-linecap="round"/><path d="M56 46 60 49V58" stroke="#6f7780" stroke-width="3" stroke-linecap="round"/><path d="M40 29h10" stroke="#ff6b3d" stroke-width="3" stroke-linecap="round"/>`,
    falcon: `<path d="M18 28c6-8 17-13 28-13 12 0 22 4 28 12l2 6-8 8 2 7-8 9-14 6-17-2-15-8-2-8 5-6-2-5Z" fill="#e2e4df"/><path d="M20 31c6-7 16-11 26-11 11 0 20 3 26 10l1 3-7 7 2 6-7 7-13 5-15-2-12-7-2-6 5-6-2-4Z" fill="#cfd3cf"/><path d="M46 20c7 0 14 2 20 6l-3 7-9 4H43l-8-5-1-7c4-3 8-5 12-5Z" fill="#eceee8"/><path d="M44 37h14l4 5-4 5H45l-6-5Z" fill="#7e858b"/><path d="M56 31h9l6 6-7 7h-7Z" fill="#c8cfcc"/><path d="M56 31h6l4 4-4 5h-5Z" fill="#9fb2c4"/><path d="M19 29h8l3 8-3 8h-8l-4-8Z" fill="#c3c7c3"/><path d="M17 29h5l2 8-2 8h-5l-3-8Z" fill="#9ca3aa"/><path d="M32 27h10l4 3-4 5H31l-4-4Z" fill="#f5f7f1"/><circle cx="46" cy="29" r="4.8" fill="#c4c8c3"/><circle cx="46" cy="29" r="2.5" fill="#70787f"/><circle cx="46" cy="50" r="4.2" fill="#c4c8c3"/><circle cx="46" cy="50" r="2.2" fill="#70787f"/><path d="M30 52 40 47M33 56 43 51" stroke="#8d959a" stroke-width="2" stroke-linecap="round"/><path d="M52 23 60 20M57 49 64 53M40 16 44 13M25 46 18 50" stroke="#a4a9a5" stroke-width="2" stroke-linecap="round"/><path d="M60 24h8M61 26h7M62 28h6" stroke="#c85e48" stroke-width="1.8" stroke-linecap="round"/><path d="M30 24h6M28 49h6M50 55h6" stroke="#c85e48" stroke-width="1.6" stroke-linecap="round"/><path d="M24 35h12M58 42h8" stroke="#6c7379" stroke-width="2" stroke-linecap="round"/>`,
    awing: `<path d="M12 48 29 31 45 29 63 34 70 40 64 52 44 58 24 56 14 52Z" fill="#f1f3ee"/><path d="M18 49 31 35 45 33 58 36 63 40 58 50 44 54 27 53 19 50Z" fill="#a44a4a"/><path d="M30 35h16l4 6H27Z" fill="#f6f8f3"/><path d="M34 34 37 28h8l3 6Z" fill="#b4bdc7"/><path d="M36 35h4l-1 6h-5Z" fill="#232c37"/><path d="M41 35h5l1 6h-5Z" fill="#232c37"/><path d="M20 45 15 36 17 31 22 37Z" fill="#2e3031"/><path d="M58 41 65 34 67 28 62 32Z" fill="#2e3031"/><path d="M25 33 22 24h8l3 9Z" fill="#b53f3d"/><path d="M49 33 54 24h8l-6 11Z" fill="#b53f3d"/><path d="M24 30h7" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M51 30h8" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M15 52 12 57M61 53 64 58" stroke="#262e38" stroke-width="3" stroke-linecap="round"/><path d="M39 29h6" stroke="#d7e0e8" stroke-width="2" stroke-linecap="round"/>`,
    uwing: `<path d="M12 37 29 34 36 33 34 47 14 61 10 61 26 47Z" fill="#dbe1e5"/><path d="M68 39 51 35 44 34 46 49 66 61 70 61 54 49Z" fill="#dbe1e5"/><path d="M32 32h16l8 8-7 10H31l-7-9Z" fill="#c7ced4"/><path d="M34 33 37 27h12l3 6Z" fill="#eef3f7"/><path d="M36 34h6l-2 7h-6Z" fill="#24303d"/><path d="M43 34h5l1 7h-5Z" fill="#24303d"/><path d="M28 43h24l-3 8H31Z" fill="#7a8794"/><path d="M26 47 17 58M54 48 63 58" stroke="#6b7480" stroke-width="3" stroke-linecap="round"/><path d="M22 31h10M49 31h10" stroke="#95a8bd" stroke-width="3" stroke-linecap="round"/><circle cx="23" cy="31" r="4.5" fill="#aeb9c5"/><circle cx="57" cy="31" r="4.5" fill="#aeb9c5"/><circle cx="20" cy="40" r="4.5" fill="#aeb9c5"/><circle cx="60" cy="40" r="4.5" fill="#aeb9c5"/><circle cx="23" cy="31" r="2.1" fill="#10161d"/><circle cx="57" cy="31" r="2.1" fill="#10161d"/><circle cx="20" cy="40" r="2.1" fill="#10161d"/><circle cx="60" cy="40" r="2.1" fill="#10161d"/><path d="M18 38 12 38M62 38 68 38" stroke="#9db1c8" stroke-width="2.4" stroke-linecap="round"/><path d="M39 28h10" stroke="#5f86c7" stroke-width="2.2" stroke-linecap="round"/><path d="M18 56h8M54 56h8" stroke="#5f86c7" stroke-width="1.8" stroke-linecap="round"/>`,
    red5: `<path d="M20 43 33 35 39 31 44 18 49 31 60 37 71 49 59 46 51 42 55 59 47 53 42 43 34 58 28 51 31 40Z" fill="#f5f6f4"/><path d="M21 42 34 35 38 32 43 22 47 32 58 37 67 47 57 45 50 41 53 55 47 50 42 41 35 54 30 48 32 39Z" fill="#cfd7df"/><path d="M34 35 37 30h11l4 7-5 5H36l-4-5Z" fill="#dde5ec"/><path d="M37 35h4l-1 6h-5Z" fill="#1d2732"/><path d="M42 34h6l1 7h-6Z" fill="#1d2732"/><path d="M19 42 12 33M58 37 67 25M33 53 28 67M53 55 61 69" stroke="#d7dde3" stroke-width="5.4" stroke-linecap="round"/><path d="M19 42 12 33M58 37 67 25M33 53 28 67M53 55 61 69" stroke="#5f6f80" stroke-width="2.1" stroke-linecap="round"/><circle cx="20" cy="42" r="4.1" fill="#b7c4d1"/><circle cx="58" cy="37" r="4.3" fill="#b7c4d1"/><circle cx="33" cy="53" r="4.1" fill="#b7c4d1"/><circle cx="53" cy="55" r="4.1" fill="#b7c4d1"/><circle cx="20" cy="42" r="2.2" fill="#0f151d"/><circle cx="58" cy="37" r="2.2" fill="#0f151d"/><circle cx="33" cy="53" r="2.1" fill="#0f151d"/><circle cx="53" cy="55" r="2.1" fill="#0f151d"/><path d="M23 40h10M49 35h11M34 49h8" stroke="#cf4747" stroke-width="3" stroke-linecap="round"/><path d="M26 28 34 30M46 20 53 23" stroke="#cf4747" stroke-width="2.2" stroke-linecap="round"/><path d="M62 38h9M63 41h12" stroke="#6cff6c" stroke-width="2.6" stroke-linecap="round"/><path d="M67 37h8M68 40h10" stroke="#d8ffd8" stroke-width="1.2" stroke-linecap="round" opacity=".7"/><circle cx="76" cy="40" r="1.8" fill="#6cff6c"/><circle cx="78" cy="37" r="1.5" fill="#6cff6c"/><path d="M44 18h5" stroke="#ffd24c" stroke-width="2" stroke-linecap="round"/>`,
  }[key];

  if (!shipMarkup) return "";
  const gradientId = `ship-bg-${key}`;

  return `
    <svg class="${className}" viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <radialGradient id="${gradientId}" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stop-color="rgba(255,255,255,.12)"></stop>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"></stop>
        </radialGradient>
      </defs>
      <ellipse cx="40" cy="40" rx="27" ry="17" fill="url(#${gradientId})"></ellipse>
      ${shipMarkup}
    </svg>
  `;
}

function supportIllustration(key, className = "support-illustration") {
  const markup = {
    comlink: `<rect x="29" y="18" width="22" height="34" rx="7" fill="#8db6e8"/><rect x="33" y="23" width="14" height="20" rx="3" fill="#20344d"/><circle cx="40" cy="47" r="2.6" fill="#dceaff"/><path d="M34 58h12" stroke="#dceaff" stroke-width="3" stroke-linecap="round"/><path d="M26 26 20 20M54 26 60 20" stroke="#6af0ff" stroke-width="2.4" stroke-linecap="round"/><path d="M24 32h-5M61 32h-5" stroke="#6af0ff" stroke-width="2.4" stroke-linecap="round"/>`,
    macrobinoculars: `<circle cx="29" cy="38" r="11" fill="#4d627a"/><circle cx="51" cy="38" r="11" fill="#4d627a"/><circle cx="29" cy="38" r="5" fill="#0f1721"/><circle cx="51" cy="38" r="5" fill="#0f1721"/><path d="M22 31h36v14H22Z" fill="#a7b9cc"/><path d="M36 29h8v18h-8Z" fill="#7be3ff"/><path d="M29 24h22" stroke="#d4deea" stroke-width="3" stroke-linecap="round"/>`,
    blaster: `<path d="M18 41h28l6-6h10v8h-7l-4 4H39l-3 7h-7l2-7H18Z" fill="#5b6877"/><path d="M23 35h17v7H23Z" fill="#2d3744"/><path d="M41 47h7l-3 6h-6Z" fill="#7a563d"/><path d="M56 35h7" stroke="#ff7b38" stroke-width="3" stroke-linecap="round"/><path d="M59 32v6" stroke="#dce7f0" stroke-width="1.6" stroke-linecap="round"/>`,
    "saber-drill": `<path d="M40 12v33" stroke="#7be3ff" stroke-width="6" stroke-linecap="round"/><path d="M40 12v33" stroke="#dff6ff" stroke-width="2.2" stroke-linecap="round"/><path d="M35 45h10v7H35Z" fill="#8fa3b8"/><path d="M33 52h14v6H33Z" fill="#5d6c7d"/><circle cx="40" cy="60" r="3" fill="#ffd24c"/>`,
    detonators: `<circle cx="40" cy="36" r="15" fill="#7b8694"/><circle cx="40" cy="36" r="10" fill="#9aa6b4"/><path d="M34 20h12v5H34Z" fill="#d4dee7"/><path d="M34 47h12v6H34Z" fill="#ff9c4a"/><path d="M26 36h28" stroke="#dce7f0" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
    "force-focus": `<circle cx="40" cy="40" r="18" fill="rgba(125,255,181,.16)" stroke="#7dffb5" stroke-width="2.4"/><circle cx="40" cy="40" r="9" fill="#243246"/><path d="M40 18v8M40 54v8M18 40h8M54 40h8" stroke="#b8cbde" stroke-width="2.4" stroke-linecap="round"/><path d="M27 27 32 32M48 48 53 53M27 53 32 48M48 32 53 27" stroke="#7dffb5" stroke-width="2.2" stroke-linecap="round"/>`,
    "ion-cannon": `<path d="M20 46h22l6-12h8l5 5-3 7h-9l-5 9H20Z" fill="#8fa4b7"/><path d="M29 31h17v8H29Z" fill="#dce7f0"/><path d="M48 34h8l4 4-2 5h-8Z" fill="#5c6f84"/><path d="M61 39h8" stroke="#78dfff" stroke-width="3.2" stroke-linecap="round"/><circle cx="69" cy="39" r="2.4" fill="#b9f3ff"/>`,
    "trench-instincts": `<path d="M40 16 54 24v14c0 11-6 18-14 26-8-8-14-15-14-26V24Z" fill="#d7e2ef"/><path d="M40 21 49 26v11c0 8-3 13-9 20-6-7-9-12-9-20V26Z" fill="#5f6f82"/><path d="M40 25v26" stroke="#fff3ae" stroke-width="2.4" stroke-linecap="round"/><path d="M33 34h14" stroke="#ff8d54" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="58" r="3" fill="#ffd24c"/>`,
    medpac: `<rect x="24" y="20" width="32" height="40" rx="8" fill="#e2edf8"/><rect x="29" y="26" width="22" height="28" rx="5" fill="#b9cbe0"/><path d="M40 31v18M31 40h18" stroke="#ff6b6b" stroke-width="4" stroke-linecap="round"/><path d="M30 20h20" stroke="#f8fbff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
    "star-map": `<circle cx="40" cy="40" r="18" fill="#21334a"/><circle cx="40" cy="40" r="22" fill="none" stroke="#7be3ff" stroke-width="2.2"/><path d="M27 46 35 33 47 37 54 28" stroke="#ffd24c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="27" cy="46" r="2.2" fill="#dff8ff"/><circle cx="35" cy="33" r="2.2" fill="#dff8ff"/><circle cx="47" cy="37" r="2.2" fill="#dff8ff"/><circle cx="54" cy="28" r="2.2" fill="#dff8ff"/><path d="M40 17v8M40 55v8M17 40h8M55 40h8" stroke="#6bb6ff" stroke-width="2" stroke-linecap="round"/>`,
  }[key];

  if (!markup) return "";

  return `
    <svg class="${className}" viewBox="0 0 80 80" aria-hidden="true">
      ${markup}
    </svg>
  `;
}

const PLANET_SPRITES = {
  "forest-moon": {
    pixel: 4,
    rows: [
      "....aaaa....",
      "...abccba...",
      "..abcccdda..",
      ".abccddddea.",
      "abccdddeddda",
      "acccdddeccca",
      "acdddeecccca",
      "abdddeeccdda",
      ".abdddccdda.",
      "..abcccdda..",
      "...abccba...",
      "....aaaa....",
    ],
    colors: { a: "#233447", b: "#4d8f63", c: "#7bcf73", d: "#375f44", e: "#9ce7bd" },
  },
  desert: {
    pixel: 4,
    rows: [
      "....aaaa....",
      "...abbbba...",
      "..abbbbccaa.",
      ".abbbbcccba.",
      "abccbbbcccba",
      "accccbbbbbca",
      "acccccbbbcca",
      "abccccccbbba",
      ".abcccccbb..",
      "..abbbbccaa.",
      "...abbbba...",
      "....aaaa....",
    ],
    colors: { a: "#43321f", b: "#d7a45b", c: "#f0d487" },
  },
  grassland: {
    pixel: 4,
    rows: [
      "....aaaa....",
      "...abccba...",
      "..abcccdda..",
      ".abccccddea.",
      "abccccddddea",
      "accccccdddda",
      "acddcccccdda",
      "abdddccccdda",
      ".abdddcccda.",
      "..abcccdda..",
      "...abccba...",
      "....aaaa....",
    ],
    colors: { a: "#203545", b: "#6eb96d", c: "#9be27a", d: "#4f7f56", e: "#c6f2a1" },
  },
  ice: {
    pixel: 4,
    rows: [
      "....aaaa....",
      "...abccba...",
      "..abccddca..",
      ".abccddddea.",
      "abccdddddeea",
      "acddddeeeeca",
      "acdddeeeedca",
      "abccddeeedca",
      ".abccdddcca.",
      "..abccddca..",
      "...abccba...",
      "....aaaa....",
    ],
    colors: { a: "#25384d", b: "#c3e8ff", c: "#f1fbff", d: "#8ac7ef", e: "#dff5ff" },
  },
  "gas-giant": {
    pixel: 4,
    rows: [
      "....aaaa....",
      "...abbbba...",
      "..abcccddaa.",
      ".abdddccbba.",
      "abcccdddccba",
      "adddccbbbdda",
      "abcccdddccba",
      "adddcccbbdda",
      ".abcccddcba.",
      "..abbbbccaa.",
      "...abbbba...",
      "....aaaa....",
    ],
    colors: { a: "#3b2a4a", b: "#d39a5d", c: "#f3d7a6", d: "#e6b678" },
  },
  forest: {
    pixel: 4,
    rows: [
      "....aaaa....",
      "...abccba...",
      "..abcccdda..",
      ".abccddddea.",
      "abccddddddda",
      "acccddddecca",
      "acdddeeeccca",
      "abddddeeccda",
      ".abcccdddca.",
      "..abcccdda..",
      "...abccba...",
      "....aaaa....",
    ],
    colors: { a: "#243440", b: "#4f8b55", c: "#79c46b", d: "#9f7853", e: "#5d3f28" },
  },
  tropical: {
    pixel: 4,
    rows: [
      "....aaaa....",
      "...abbbba...",
      "..abccddba..",
      ".abcccdddca.",
      "abcccddddeea",
      "acccdddeeeea",
      "acdddccceeea",
      "abddcccccdda",
      ".abccddccba.",
      "..abbbddba..",
      "...abbbba...",
      "....aaaa....",
    ],
    colors: { a: "#173d5a", b: "#45c4ff", c: "#72e4d4", d: "#f3d985", e: "#b6fff2" },
  },
  "death-star": {
    pixel: 4,
    rows: [
      "....aaaa....",
      "...abbbbca..",
      "..abbbbbcca.",
      ".abbbbcccdca",
      "abbbbcccccda",
      "abccbbddecca",
      "abccddddecca",
      "abbbbdddccca",
      ".abbbbcccca.",
      "..acccccca..",
      "...acccca...",
      "....aaaa....",
    ],
    colors: { a: "#384149", b: "#a0aab3", c: "#59636e", d: "#7d8791", e: "#2e353d" },
  },
};

const SHIP_SPRITES = {
  gr75: {
    pixel: 4,
    rows: [
      "............",
      "....aaaa....",
      "...abccba...",
      "..abcccdda..",
      ".abccccccda.",
      "abccccccccda",
      ".abccccccda.",
      "..addeedda..",
      "...e....e...",
      "............",
    ],
    colors: { a: "#8ca4c0", b: "#d6e3ee", c: "#7d91a8", d: "#4f6279", e: "#ffd24c" },
  },
  landspeeder: {
    pixel: 4,
    rows: [
      "............",
      "............",
      "...aabbaa...",
      "..abccccba..",
      ".abccddccba.",
      "abccccccccba",
      ".ee......ee.",
      "...e....e...",
      "............",
      "............",
    ],
    colors: { a: "#c77f3e", b: "#f2c98f", c: "#8f5438", d: "#5fd6ff", e: "#58c6ff" },
  },
  xwing: {
    pixel: 4,
    rows: [
      ".....aa.....",
      "...aabbaa...",
      ".aaabbbbaa..",
      "a..abccba..a",
      ".aabccccbaa.",
      "...bdccdb...",
      "..d......d..",
      ".d........d.",
      "............",
      "............",
    ],
    colors: { a: "#d9dde1", b: "#ef5350", c: "#6f7b86", d: "#ffd24c" },
  },
  snowspeeder: {
    pixel: 4,
    rows: [
      "............",
      "....aaaa....",
      "..aabbbbba..",
      ".abccddccba.",
      "abccddddccba",
      "..be....eb..",
      ".e........e.",
      "...e....e...",
      "............",
      "............",
    ],
    colors: { a: "#dce7ef", b: "#ef5350", c: "#93a6b7", d: "#78d7ff", e: "#ffd24c" },
  },
  falcon: {
    pixel: 4,
    rows: [
      "....aaaa....",
      "..aabcccbaa.",
      ".abcccccccba",
      "abccdddcccba",
      "abcddddddcba",
      ".abccddcccba",
      "..abccccccba.",
      "...abbffbba..",
      "....a....a...",
      "............",
    ],
    colors: { a: "#b4babf", b: "#dfe4e8", c: "#8a9198", d: "#525c67", f: "#ffcf52" },
  },
  awing: {
    pixel: 4,
    rows: [
      ".....aa.....",
      "...aabbaa...",
      "..abccccba..",
      ".abccddccba.",
      "a..cddddc..a",
      "...ee..ee...",
      "..e......e..",
      ".e........e.",
      "............",
      "............",
    ],
    colors: { a: "#e9edf1", b: "#ff6262", c: "#8291a3", d: "#b5c7d8", e: "#ffd24c" },
  },
  uwing: {
    pixel: 4,
    rows: [
      "a..........a",
      "aa........aa",
      ".aabccccbaa.",
      "..abccccba..",
      "..bccddccb..",
      "..bcddddcb..",
      ".e........e.",
      "e..........e",
      "............",
      "............",
    ],
    colors: { a: "#c0cad3", b: "#e3edf4", c: "#7f8d9d", d: "#556474", e: "#ffd24c" },
  },
  red5: {
    pixel: 4,
    rows: [
      ".....aa.....",
      "...aabbaa...",
      ".aaabbbbaa..",
      "a..abbcbba.a",
      ".aabccccbaa.",
      "...bdccdb...",
      "..d......d..",
      ".d........d.",
      "............",
      "............",
    ],
    colors: { a: "#ffffff", b: "#ff4d4d", c: "#8694a6", d: "#ffd24c" },
  },
};

const FLIGHT_NODE_LAYOUT = [
  { x: 10, y: 66 },
  { x: 23, y: 34 },
  { x: 37, y: 58 },
  { x: 50, y: 23 },
  { x: 61, y: 47 },
  { x: 73, y: 18 },
  { x: 84, y: 52 },
  { x: 92, y: 28 },
];

const SUPPORT_SPRITES = {
  comlink: {
    pixel: 4,
    rows: ["...aa...", "..abca..", ".abbbca.", ".abddca.", ".abbbca.", "..abca..", "...aa...", "....e..."],
    colors: { a: "#9fc6ff", b: "#415d84", c: "#dbeaff", d: "#6af0ff", e: "#ffd24c" },
  },
  macrobinoculars: {
    pixel: 4,
    rows: ["........", ".aabb...", "acddba..", "acddba..", ".aeea...", "..ff....", "........", "........"],
    colors: { a: "#c8d6e5", b: "#8fa0b2", c: "#5d7388", d: "#101927", e: "#7be3ff", f: "#ffd24c" },
  },
  blaster: {
    pixel: 4,
    rows: [".....aa.", ".bbbbca.", ".bddddca", ".beffca.", "..ggh...", "...h....", "........", "........"],
    colors: { a: "#9aa9ba", b: "#5d6c7d", c: "#dce7f0", d: "#2b3645", e: "#6d4a35", f: "#b67b52", g: "#ffd24c", h: "#ff7b38" },
  },
  "saber-drill": {
    pixel: 4,
    rows: ["....a...", "....a...", "....a...", "....a...", "...ba...", "..cdd...", "..cee...", "........"],
    colors: { a: "#7be3ff", b: "#dff6ff", c: "#596776", d: "#9fb3c7", e: "#ffd24c" },
  },
  detonators: {
    pixel: 4,
    rows: ["..aaaa..", ".abccba.", "abcccdda", "acdddcca", "acdddcca", "abcccdda", ".abccba.", "..aeea.."],
    colors: { a: "#6d7784", b: "#c9d4df", c: "#8b98a6", d: "#ff9c4a", e: "#ffd24c" },
  },
  "force-focus": {
    pixel: 4,
    rows: ["...aa...", "..abca..", ".abddca.", "abdeedca", "abdeedca", ".abddca.", "..afca..", "...aa..."],
    colors: { a: "#5a6b7f", b: "#b8cbde", c: "#dcebf7", d: "#243246", e: "#7dffb5", f: "#ffd24c" },
  },
  "ion-cannon": {
    pixel: 4,
    rows: ["....aa..", "...abca.", "..abddca", ".abdddca", "abeeedca", "..f..f..", ".f....f.", "........"],
    colors: { a: "#c7d3df", b: "#93a4b5", c: "#e8f0f6", d: "#5c6f84", e: "#78dfff", f: "#ffd24c" },
  },
  "trench-instincts": {
    pixel: 4,
    rows: ["...aa...", "..abba..", ".abccba.", "abddddca", "abceecda", ".abffba.", "..agg...", "...gg..."],
    colors: { a: "#d7e2ef", b: "#94a7bb", c: "#3d4f64", d: "#6adfff", e: "#fff3ae", f: "#ffd24c", g: "#ff8d54" },
  },
};

function presetForGoal(goalPoints) {
  return GOAL_PRESETS.find((preset) => preset.points === Number(goalPoints) && preset.key !== "custom") || null;
}

function pointsForTargetLevel(level) {
  const safeLevel = Math.max(2, Number(level) || 2);
  return pointsForLevel(safeLevel);
}

function targetLevelForGoal(goalPoints) {
  const safeGoal = Math.max(0, Number(goalPoints) || 0);
  let resolvedLevel = Math.max(2, levelForPoints(safeGoal));
  while (pointsForLevel(resolvedLevel) < safeGoal) {
    resolvedLevel += 1;
  }
  return resolvedLevel;
}

function runsForRunner(runnerId) {
  return state.runs
    .filter((run) => run.runnerId === runnerId)
    .slice()
    .sort((a, b) => b.createdAtMs - a.createdAtMs);
}

function totalPointsForRunner(runnerId) {
  return runsForRunner(runnerId).reduce((sum, run) => sum + Number(run.points || 0), 0);
}

function totalMinutesForRunner(runnerId) {
  return runsForRunner(runnerId).reduce((sum, run) => sum + Number(run.durationMinutes || 0), 0);
}

function totalPoints() {
  return state.runs.reduce((sum, run) => sum + Number(run.points || 0), 0);
}

function totalMinutes() {
  return state.runs.reduce((sum, run) => sum + Number(run.durationMinutes || 0), 0);
}

function totalGoalPoints() {
  return state.participants.reduce((sum, participant) => sum + Number(participant.goalMiles || 0), 0);
}

function totalLevel() {
  return levelForPoints(totalPoints());
}

function unlockProgressPercent() {
  const goal = totalGoalPoints();
  if (goal <= 0) return 0;
  const thresholdUnit = goal / PLANET_UNLOCKS.length;
  const points = totalPoints();
  let unlockedCount = 0;
  for (let index = 0; index < PLANET_UNLOCKS.length; index += 1) {
    if (points >= thresholdUnit * (index + 1)) unlockedCount += 1;
  }
  return (unlockedCount / PLANET_UNLOCKS.length) * 100;
}

function targetHitRatePercent() {
  if (!state.participants.length) return 0;
  const hitCount = state.participants.filter((participant) => {
    const goal = Number(participant.goalMiles || 0);
    if (goal <= 0) return false;
    return totalPointsForRunner(participant.id) >= goal;
  }).length;
  return (hitCount / state.participants.length) * 100;
}

function battleOutcomeFor(score) {
  return BATTLE_OUTCOME_TIERS.find((tier) => score >= tier.minScore) || BATTLE_OUTCOME_TIERS[BATTLE_OUTCOME_TIERS.length - 1];
}

function battleState() {
  const goal = totalGoalPoints();
  const points = totalPoints();
  const xpProgressPercent = goal > 0 ? Math.min((points / goal) * 100, 100) : 0;
  const targetPercent = targetHitRatePercent();
  const unlockPercent = unlockProgressPercent();
  const score = Math.min(
    (xpProgressPercent * BATTLE_READINESS_WEIGHTS.xp)
      + (targetPercent * BATTLE_READINESS_WEIGHTS.targetHitRate)
      + (unlockPercent * BATTLE_READINESS_WEIGHTS.unlockProgress),
    100,
  );
  const battleDate = parseIsoDate(FINAL_BATTLE_DATE);
  const now = new Date();
  const isBattleDay = now >= battleDate;
  const outcome = battleOutcomeFor(score);
  return {
    goal,
    score,
    xpProgressPercent,
    targetPercent,
    unlockPercent,
    isBattleDay,
    outcome,
  };
}

function setSyncState(message, status) {
  els.syncBanner.textContent = message;
  els.syncBanner.dataset.status = status || "idle";
}

function renderThemeCopy() {
  els.chapterEyebrow.textContent = CHAPTER_THEME.eyebrow;
  els.chapterDescription.textContent = CHAPTER_THEME.description;
  els.pointsExplanation.textContent = CHAPTER_THEME.pointsExplanation;
}

function renderTotals() {
  const points = totalPoints();
  const goal = totalGoalPoints();
  const minutes = totalMinutes();
  const progress = goal > 0 ? Math.min(points / goal, 1) : 0;
  const remaining = Math.max(goal - points, 0);
  const level = totalLevel();
  const currentLevelFloor = pointsForLevel(level);
  const nextLevelFloor = nextLevelPoints(level);
  const pointsIntoLevel = Math.max(points - currentLevelFloor, 0);
  const levelSpan = Math.max(nextLevelFloor - currentLevelFloor, 1);
  const levelRemaining = Math.max(nextLevelFloor - points, 0);
  const levelProgress = Math.min(pointsIntoLevel / levelSpan, 1);

  els.totalPoints.textContent = formatPoints(points);
  els.goalPoints.textContent = formatPoints(goal);
  els.activeTime.textContent = formatMinutes(minutes);
  els.rebelLevel.textContent = String(level);
  els.levelCurrent.textContent = String(level);
  els.levelRemaining.textContent = formatPoints(levelRemaining);
  els.levelFill.style.width = `${levelProgress * 100}%`;
  els.levelProgressText.textContent = `${formatPoints(pointsIntoLevel)} / ${formatPoints(levelSpan)} XP`;
  els.progressFill.style.width = `${progress * 100}%`;

  if (goal <= 0) {
    els.progressText.textContent = "Recruit rebels to set the attack target.";
  } else if (remaining > 0) {
    els.progressText.textContent = `${formatPoints(remaining)} XP needed to fully prep the fleet before the Battle of Yavin.`;
  } else {
    els.progressText.textContent = "Fleet XP target reached. Hold the line until May 31 to resolve the final battle.";
  }
}

function renderBattlePanel() {
  const battle = battleState();
  const projectedOutcome = battleOutcomeFor(battle.score);
  const shownOutcome = battle.isBattleDay ? battle.outcome : projectedOutcome;

  els.battleScore.textContent = `${Math.round(battle.score)}%`;
  els.battleScoreFill.style.width = `${battle.score}%`;
  els.battleXpPercent.textContent = `${Math.round(battle.xpProgressPercent)}%`;
  els.battleXpFill.style.width = `${battle.xpProgressPercent}%`;
  els.battleTargetPercent.textContent = `${Math.round(battle.targetPercent)}%`;
  els.battleTargetFill.style.width = `${battle.targetPercent}%`;
  els.battleUnlockPercent.textContent = `${Math.round(battle.unlockPercent)}%`;
  els.battleUnlockFill.style.width = `${battle.unlockPercent}%`;
  els.battleOutcomeTitle.textContent = shownOutcome.title;
  els.battleOutcomeDescription.textContent = shownOutcome.description;

  if (battle.goal <= 0) {
    els.battleIntro.textContent = "Set rebel target levels first. The final battle score is calculated from group XP, rebels hitting target, and campaign unlocks.";
    els.battleStatus.textContent = "Roster required";
    return;
  }

  if (!battle.isBattleDay) {
    const delta = Math.max(90 - battle.score, 0);
    els.battleIntro.textContent = `The Death Star encounter is locked for ${parseDateLabel(FINAL_BATTLE_DATE)}. Build readiness now so the fleet is strong enough when the battle starts.`;
    els.battleStatus.textContent = delta > 0 ? `${Math.ceil(delta)}% short of victory` : "Victory pace secured";
    return;
  }

  els.battleIntro.textContent = "Battle day is live. The outcome below is resolved from the fleet strength you built through May.";
  els.battleStatus.textContent = shownOutcome.title;
}

function runnerCardMarkup(runner) {
  const character = characterFor(runner.characterKey);
  const runs = runsForRunner(runner.id);
  const points = totalPointsForRunner(runner.id);
  const minutes = totalMinutesForRunner(runner.id);
  const goal = Number(runner.goalMiles || DEFAULT_RUNNER_GOAL);
  const targetLevel = targetLevelForGoal(goal);
  const progress = goal > 0 ? Math.min(points / goal, 1) : 0;
  const level = levelForPoints(points);
  const currentLevelFloor = pointsForLevel(level);
  const nextLevelFloor = nextLevelPoints(level);
  const pointsIntoLevel = Math.max(points - currentLevelFloor, 0);
  const levelSpan = Math.max(nextLevelFloor - currentLevelFloor, 1);
  const levelRemaining = Math.max(nextLevelFloor - points, 0);
  const levelProgress = Math.min(pointsIntoLevel / levelSpan, 1);
  const avatarUrl = runner.imageUrl || characterImageUrlFor(runner.characterKey);
  const avatarMarkup = avatarUrl
    ? `<button type="button" class="avatar avatar-button" data-avatar-src="${avatarUrl}" aria-label="View ${runner.name} portrait">
         <img class="avatar-image" src="${avatarUrl}" alt="${runner.name} portrait" />
       </button>`
    : `<div class="avatar">${normalizeNameInitials(runner.name)}</div>`;
  const supportUnlocks = supportUnlocksForCharacter(runner.characterKey);
  const supportMarkup = supportUnlocks.map((item) => {
    const unlocked = level >= item.level;
    const supportSprite = supportIllustration(item.iconKey, "support-illustration");

    return `
      <article class="support-node ${unlocked ? "" : "is-locked"} ${item.type === "weapon" ? "is-weapon" : "is-skill"}">
        <button type="button" class="support-node-orb" aria-label="${item.title}: Level ${item.level}">
          <span class="support-node-halo"></span>
          <span class="support-icon-shell">
            ${supportSprite}
          </span>
          <span class="support-node-name">${item.title}</span>
        </button>
        <div class="support-node-card">
          <p class="planet-threshold">Level ${item.level}</p>
          <p class="planet-ship">${item.type === "weapon" ? "Weapon Unlock" : "Skill Unlock"}</p>
          <h3>${item.title}</h3>
          <p class="planet-description">${item.description}</p>
        </div>
      </article>
    `;
  }).join("");

  const logMarkup = runs.length
    ? runs
        .slice(0, 8)
        .map((run) => {
          const activity = activityFor(run.activityType);
          return `
            <article class="entry-item">
              <div>
                <p class="entry-meta">${formatMinutes(run.durationMinutes)} ${activity.label} · ${formatPoints(run.points)} XP</p>
                <p class="entry-date">${parseDateLabel(run.runDate)}</p>
              </div>
              <div class="entry-actions">
                <button class="entry-delete danger-button" type="button" data-delete-run="${run.id}">X</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<article class="entry-item"><p class="empty-copy">No workouts logged for this rebel yet.</p></article>`;

  return `
    <article class="runner-card" data-runner-id="${runner.id}">
      <div class="runner-card-header">
        <div class="runner-ident">
          ${avatarMarkup}
          <div>
            <p class="runner-role">${character.label}</p>
            <div class="runner-name-row">
              <h3 class="runner-name">${runner.name}</h3>
              <span class="runner-level-chip">Lv ${level}</span>
            </div>
            <p class="runner-target-level">Target level: ${targetLevel}</p>
            <p class="runner-flavor">${character.flavor}</p>
          </div>
        </div>
        <button type="button" data-edit-runner="${runner.id}" class="ghost-button">Edit</button>
      </div>

      <div class="stats-row">
        <div class="micro-card">
          <p class="micro-label">XP</p>
          <p class="micro-value">${formatPoints(points)}</p>
        </div>
        <div class="micro-card">
          <p class="micro-label">Target Lv</p>
          <p class="micro-value">${targetLevel}</p>
        </div>
        <div class="micro-card">
          <p class="micro-label">Time</p>
          <p class="micro-value">${formatMinutes(minutes)}</p>
        </div>
      </div>

      <p class="panel-copy">${Math.round(progress * 100)}% of target level complete.</p>

      <div class="level-shell runner-level-shell">
        <div class="level-shell-header">
          <p class="level-shell-label">Level ${level}</p>
          <p class="level-shell-label">${formatPoints(levelRemaining)} XP to next</p>
        </div>
        <div class="level-bar runner-level-bar">
          <div class="level-fill" style="width:${levelProgress * 100}%"></div>
          <div class="level-bar-overlay runner-level-overlay">
            <span>${formatPoints(pointsIntoLevel)} / ${formatPoints(levelSpan)} XP</span>
          </div>
        </div>
      </div>

      <details class="runner-support">
        <summary class="runner-support-toggle">
          <span class="runner-support-toggle-copy">
            <span class="eyebrow">Personal Arsenal</span>
            <span class="runner-support-copy">Show this rebel's tools and skills</span>
          </span>
          <span class="runner-support-caret" aria-hidden="true">▾</span>
        </summary>
        <div class="runner-support-grid">${supportMarkup}</div>
      </details>

      <form class="entry-form" data-runner-form="${runner.id}">
        <label>
          <span>Workout</span>
          <select name="activityType">
            ${ACTIVITY_TYPES.map((activity) => `<option value="${activity.key}">${activity.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Minutes</span>
          <input type="number" name="durationMinutes" min="1" step="1" value="30" required />
        </label>
        <label>
          <span>Date</span>
          <input type="date" name="runDate" value="${chapterDefaultDate()}" required />
        </label>
        <button type="submit">Log</button>
      </form>

      <section class="entry-log">${logMarkup}</section>
    </article>
  `;
}

function renderRunnerGrid() {
  const participants = [...state.participants].sort((a, b) => a.createdAtMs - b.createdAtMs);

  if (!participants.length) {
    els.runnerGrid.innerHTML = `
      <article class="runner-card">
        <p class="eyebrow">No rebels yet</p>
        <p class="empty-copy">Add the crew, set their XP goals, then start logging workouts.</p>
      </article>
    `;
    return;
  }

  els.runnerGrid.innerHTML = participants.map(runnerCardMarkup).join("");
}

function renderFlightPath() {
  const goal = totalGoalPoints();
  const points = totalPoints();
  const thresholdUnit = goal > 0 ? goal / PLANET_UNLOCKS.length : 0;
  const connectionMarkup = FLIGHT_NODE_LAYOUT.slice(0, -1)
    .map((node, index) => {
      const next = FLIGHT_NODE_LAYOUT[index + 1];
      return `<line x1="${node.x}%" y1="${node.y}%" x2="${next.x}%" y2="${next.y}%"></line>`;
    })
    .join("");

  const nodeMarkup = PLANET_UNLOCKS.map((planet, index) => {
    const unlockPoints = thresholdUnit * (index + 1);
    const unlocked = points >= unlockPoints;
    const planetSprite = planetIllustration(planet.planetType, "planet-illustration");
    const layout = FLIGHT_NODE_LAYOUT[index] || { x: 50, y: 50 };

    return `
      <article class="flight-node ${unlocked ? "" : "is-locked"}" style="--node-x:${layout.x}%; --node-y:${layout.y}%;">
        <button type="button" class="flight-node-orb" aria-label="${planet.title}: ${formatPoints(unlockPoints)} XP">
          <span class="flight-node-halo"></span>
          <span class="flight-node-visual">
            ${planetSprite}
          </span>
          <span class="flight-node-name">${planet.title}</span>
        </button>
        <div class="flight-node-card">
          <p class="planet-threshold">${formatPoints(unlockPoints)} XP</p>
          <h3>${planet.title}</h3>
          <p class="planet-description">${planet.description}</p>
        </div>
      </article>
    `;
  }).join("");

  els.flightPath.innerHTML = `
    <div class="flight-path-field">
      <div class="flight-path-stars" aria-hidden="true"></div>
      <svg class="flight-path-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${connectionMarkup}
      </svg>
      ${nodeMarkup}
    </div>
  `;
}

function renderShipGrid() {
  const goal = totalGoalPoints();
  const points = totalPoints();
  const thresholdUnit = goal > 0 ? goal / PLANET_UNLOCKS.length : 0;

  els.shipGrid.innerHTML = PLANET_UNLOCKS.map((planet, index) => {
    const unlockPoints = thresholdUnit * (index + 1);
    const unlocked = points >= unlockPoints;
    const shipSprite = shipIllustration(planet.shipKey, "ship-illustration");

    return `
      <article class="ship-node ${unlocked ? "" : "is-locked"}">
        <button type="button" class="ship-node-orb" aria-label="${planet.ship}: ${formatPoints(unlockPoints)} XP">
          <span class="ship-node-halo"></span>
          <span class="ship-icon-shell">
            ${shipSprite}
          </span>
          <span class="ship-node-name">${planet.ship}</span>
        </button>
        <div class="ship-node-card">
          <p class="planet-threshold">${formatPoints(unlockPoints)} XP</p>
          <h3>${planet.ship}</h3>
          <p class="planet-description">${unlocked ? `Unlocked at ${planet.title}.` : `Locked until ${planet.title}.`}</p>
        </div>
      </article>
    `;
  }).join("");
}

function takenCharacterKeys(excludeRunnerId = "") {
  return new Set(
    state.participants
      .filter((participant) => participant.id !== excludeRunnerId)
      .map((participant) => participant.characterKey)
      .filter(Boolean),
  );
}

function firstAvailableCharacterKey(excludeRunnerId = "") {
  const taken = takenCharacterKeys(excludeRunnerId);
  return selectionCharacters().find((character) => !taken.has(character.key))?.key || DEFAULT_CHARACTER_KEY;
}

function renderCharacterOptions(excludeRunnerId = "", selectedCharacterKey = "") {
  const taken = takenCharacterKeys(excludeRunnerId);
  els.participantCharacter.innerHTML = selectionCharacters().map((character) => {
    const disabled = taken.has(character.key) && character.key !== selectedCharacterKey;
    return `<option value="${character.key}" ${disabled ? "disabled" : ""}>${character.label} · ${character.flavor}${disabled ? " (Taken)" : ""}</option>`;
  }).join("");
}

function renderGoalPresetOptions() {
  els.participantGoalPreset.innerHTML = GOAL_PRESETS.map(
    (preset) => `<option value="${preset.key}">${preset.label} · Level ${preset.targetLevel}</option>`,
  ).join("");
}

function renderGoalPresetGuide() {
  const activeKey = els.participantGoalPreset.value;
  els.participantPresetGuide.innerHTML = GOAL_PRESETS.map((preset) => {
    const isActive = preset.key === activeKey;
    return `
      <article class="preset-guide-card ${isActive ? "is-active" : ""}">
        <p class="preset-guide-label">${preset.label}</p>
        <p class="preset-guide-points">Level ${preset.targetLevel}</p>
        <p class="preset-guide-copy">${preset.description}</p>
      </article>
    `;
  }).join("");
}

function syncGoalPresetUi() {
  const presetKey = els.participantGoalPreset.value;
  const preset = GOAL_PRESETS.find((item) => item.key === presetKey) || GOAL_PRESETS[0];
  els.participantGoalPresetCopy.textContent = preset.description;
  const isCustom = preset.key === "custom";
  els.participantGoalWrap.hidden = !isCustom;
  if (!isCustom) {
    els.participantGoal.value = String(preset.targetLevel);
  }
  renderGoalPresetGuide();
}

function render() {
  renderThemeCopy();
  renderTotals();
  renderBattlePanel();
  renderRunnerGrid();
  renderFlightPath();
  renderShipGrid();
}

function openParticipantModal(mode, runner = null) {
  state.participantModalMode = mode;

  if (mode === "edit" && runner) {
    renderCharacterOptions(runner.id, runner.characterKey);
    els.participantModalEyebrow.textContent = "Edit Rebel";
    els.participantModalTitle.textContent = "Update the crew member";
    els.participantId.value = runner.id;
    els.participantName.value = runner.name;
    els.participantCharacter.value = runner.characterKey;
    els.participantGoal.value = String(targetLevelForGoal(runner.goalMiles || DEFAULT_RUNNER_GOAL));
    els.participantGoalPreset.value = presetForGoal(runner.goalMiles)?.key || "custom";
  } else {
    els.participantModalEyebrow.textContent = "New Rebel";
    els.participantModalTitle.textContent = "Add a crew member";
    els.participantForm.reset();
    els.participantId.value = "";
    const availableCharacterKey = firstAvailableCharacterKey();
    renderCharacterOptions("", availableCharacterKey);
    els.participantCharacter.value = availableCharacterKey;
    els.participantGoalPreset.value = presetForGoal(DEFAULT_RUNNER_GOAL)?.key || "squad-leader";
    els.participantGoal.value = String(targetLevelForGoal(DEFAULT_RUNNER_GOAL));
  }

  syncGoalPresetUi();
  els.participantModal.showModal();
}

function closeParticipantModal() {
  els.participantModal.close();
}

function openDeleteRunModal(runId) {
  const run = state.runs.find((item) => item.id === runId);
  if (!run) return;
  const activity = activityFor(run.activityType);
  state.pendingDeleteRunId = runId;
  els.deleteRunDescription.textContent = `${parseDateLabel(run.runDate)} · ${formatMinutes(run.durationMinutes)} ${activity.label} · ${formatPoints(run.points)} XP`;
  els.deleteRunModal.showModal();
}

function closeDeleteRunModal() {
  state.pendingDeleteRunId = null;
  els.deleteRunModal.close();
}

function playButtonClickSound() {
  if (isButtonSoundMuted) return;
  if (!buttonClickAudioPool.length) return;

  const sound = buttonClickAudioPool[buttonClickAudioIndex];
  buttonClickAudioIndex = (buttonClickAudioIndex + 1) % buttonClickAudioPool.length;
  sound.currentTime = 0;
  sound.volume = 0.45;
  sound.play().catch(() => {});
}

function getImperialMarchAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!imperialMarchAudioContext) {
    imperialMarchAudioContext = new AudioContextClass();
  }
  return imperialMarchAudioContext;
}

async function playImperialMarchClip() {
  if (isButtonSoundMuted) return;

  const context = getImperialMarchAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const notes = [
    { frequency: 196.0, duration: 0.18 },
    { frequency: 196.0, duration: 0.18 },
    { frequency: 196.0, duration: 0.18 },
    { frequency: 155.56, duration: 0.14 },
    { frequency: 233.08, duration: 0.06 },
    { frequency: 196.0, duration: 0.18 },
    { frequency: 155.56, duration: 0.14 },
    { frequency: 233.08, duration: 0.06 },
    { frequency: 196.0, duration: 0.22 },
  ];

  let cursor = context.currentTime + 0.01;

  notes.forEach((note, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(note.frequency, cursor);
    gain.gain.setValueAtTime(0.0001, cursor);
    gain.gain.linearRampToValueAtTime(IMPERIAL_MARCH_VOLUME, cursor + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + note.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(cursor);
    oscillator.stop(cursor + note.duration + 0.03);
    cursor += note.duration + (index === 4 || index === 7 ? 0.11 : 0.05);
  });
}

function triggerHyperspaceJump() {
  document.body.classList.remove(HYPERSPACE_CLASS_NAME);
  if (hyperspaceTimeoutId) {
    window.clearTimeout(hyperspaceTimeoutId);
  }

  // Force a style flush so repeated logs can replay the animation immediately.
  void document.body.offsetWidth;
  document.body.classList.add(HYPERSPACE_CLASS_NAME);

  hyperspaceTimeoutId = window.setTimeout(() => {
    document.body.classList.remove(HYPERSPACE_CLASS_NAME);
    hyperspaceTimeoutId = null;
  }, HYPERSPACE_DURATION_MS);
}

function syncMuteToggle() {
  if (!els.muteToggle) return;
  els.muteToggle.classList.toggle("is-muted", isButtonSoundMuted);
  els.muteToggle.setAttribute("aria-pressed", String(isButtonSoundMuted));
  const label = els.muteToggle.querySelector(".mute-toggle-label");
  if (label) {
    label.textContent = isButtonSoundMuted ? "SFX Off" : "SFX On";
  }
}

function bindUi() {
  document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled || button.hasAttribute("data-audio-toggle")) return;
    if (button.closest("[data-runner-form]") && button.type === "submit") return;
    playButtonClickSound();
  });

  els.muteToggle?.addEventListener("click", () => {
    isButtonSoundMuted = !isButtonSoundMuted;
    window.localStorage.setItem(BUTTON_SOUND_MUTED_STORAGE_KEY, String(isButtonSoundMuted));
    syncMuteToggle();
  });

  els.addParticipantButton.addEventListener("click", () => openParticipantModal("create"));
  els.cancelParticipantButton.addEventListener("click", () => closeParticipantModal());
  els.resetRunsButton.addEventListener("click", () => els.resetModal.showModal());
  els.cancelResetButton.addEventListener("click", () => els.resetModal.close());
  els.cancelDeleteRunButton.addEventListener("click", () => closeDeleteRunModal());
  els.participantGoalPreset.addEventListener("change", () => syncGoalPresetUi());

  els.participantForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = els.participantId.value.trim();
    const name = els.participantName.value.trim();
    const characterKey = els.participantCharacter.value || DEFAULT_CHARACTER_KEY;
    const goalLevel = Number.parseInt(els.participantGoal.value, 10);
    const goalMiles = pointsForTargetLevel(goalLevel);
    const selectedElsewhere = state.participants.some(
      (participant) => participant.id !== id && participant.characterKey === characterKey,
    );

    if (!name || !Number.isFinite(goalLevel) || goalLevel < 2 || selectedElsewhere) return;

    try {
      if (state.participantModalMode === "edit" && id) {
        await api.updateRunner({ id, name, characterKey, goalMiles });
      } else {
        await api.addRunner({ name, characterKey, goalMiles });
      }
      closeParticipantModal();
    } catch (error) {
      console.error(error);
      setSyncState("Could not save participant.", "error");
    }
  });

  els.runnerGrid.addEventListener("click", (event) => {
    const avatarButton = event.target.closest("[data-avatar-src]");
    if (avatarButton) {
      openAvatarViewer(avatarButton.dataset.avatarSrc);
      return;
    }

    const editButton = event.target.closest("[data-edit-runner]");
    if (editButton) {
      const runner = state.participants.find((participant) => participant.id === editButton.dataset.editRunner);
      if (runner) openParticipantModal("edit", runner);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-run]");
    if (deleteButton) {
      openDeleteRunModal(deleteButton.dataset.deleteRun);
    }
  });

  els.runnerGrid.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-runner-form]");
    if (!form) return;

    event.preventDefault();
    const runnerId = form.dataset.runnerForm;
    const durationMinutes = Number.parseInt(form.elements.durationMinutes.value, 10);
    const activityType = form.elements.activityType.value;
    const runDate = form.elements.runDate.value || chapterDefaultDate();
    if (!runnerId || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return;

    const existingRuns = runsForRunner(runnerId);
    const score = calculateWorkoutPoints(activityType, durationMinutes, existingRuns);

    try {
      await api.addRun({
        userId: runnerId,
        activityType,
        durationMinutes,
        points: score.totalPoints,
        miles: 0,
        runDate,
      });
      triggerHyperspaceJump();
      playImperialMarchClip();
      form.reset();
      form.elements.durationMinutes.value = "30";
      form.elements.runDate.value = chapterDefaultDate();
    } catch (error) {
      console.error(error);
      setSyncState("Could not log workout.", "error");
    }
  });

  els.confirmDeleteRunButton.addEventListener("click", async () => {
    if (!state.pendingDeleteRunId) return;
    try {
      await api.deleteRun(state.pendingDeleteRunId);
      closeDeleteRunModal();
    } catch (error) {
      console.error(error);
      setSyncState("Could not delete workout.", "error");
    }
  });

  els.confirmResetButton.addEventListener("click", async () => {
    try {
      await api.resetChapter();
      els.resetModal.close();
    } catch (error) {
      console.error(error);
      setSyncState("Could not reset chapter workouts.", "error");
    }
  });

  els.closeAvatarViewerButton?.addEventListener("click", () => closeAvatarViewer());

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (els.participantModal.open) closeParticipantModal();
    if (els.deleteRunModal.open) closeDeleteRunModal();
    if (els.resetModal.open) els.resetModal.close();
    if (els.avatarViewerModal?.open) closeAvatarViewer();
  });
}

async function init() {
  renderCharacterOptions();
  renderGoalPresetOptions();
  syncGoalPresetUi();
  syncMuteToggle();
  render();
  bindUi();

  if (!hasFirebaseConfig()) {
    setSyncState("Firebase config missing.", "error");
    return;
  }

  api.subscribeToChapter({
    onRunners: (participants) => {
      state.participants = participants;
      render();
    },
    onRuns: (runs) => {
      state.runs = runs;
      render();
    },
    onSyncState: setSyncState,
  });

  try {
    await api.ensureDefaultParticipants();
  } catch (error) {
    console.error(error);
    setSyncState("Could not bootstrap default participants.", "error");
  }
}

init();
