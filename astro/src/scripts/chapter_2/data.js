export const CHAPTER_ID = "chapter-2";
export const DEFAULT_RUNNER_GOAL = 600;
export const DEFAULT_CHARACTER_KEY = "luke";

export const GOAL_PRESETS = [
  {
    key: "padawan",
    label: "Padawan",
    points: 300,
    description: "About 20-30 minutes, 4 days each week. Roughly 300 XP.",
  },
  {
    key: "pilot",
    label: "Pilot",
    points: 450,
    description: "About 30-40 minutes, 4-5 days each week. Roughly 450 XP.",
  },
  {
    key: "squad-leader",
    label: "Squad Leader",
    points: 600,
    description: "About 40-50 minutes, 5 days each week. Roughly 600 XP.",
  },
  {
    key: "jedi-master",
    label: "Jedi Master",
    points: 800,
    description: "About 50-60 minutes, 5-6 days each week. Roughly 800 XP.",
  },
  {
    key: "custom",
    label: "Custom",
    points: DEFAULT_RUNNER_GOAL,
    description: "Set a custom monthly target.",
  },
];

export const ACTIVITY_TYPES = [
  { key: "running", label: "Running", multiplier: 1.25, pointsLabel: "Cardio push" },
  { key: "walking", label: "Walking", multiplier: 0.7, pointsLabel: "Recovery volume" },
  { key: "hiking", label: "Hiking", multiplier: 1.05, pointsLabel: "Terrain work" },
  { key: "strength", label: "Weightlifting", multiplier: 1.15, pointsLabel: "Power build" },
  { key: "cycling", label: "Cycling", multiplier: 0.95, pointsLabel: "Engine build" },
  { key: "mobility", label: "Mobility", multiplier: 0.6, pointsLabel: "Jedi recovery" },
  { key: "conditioning", label: "Conditioning", multiplier: 1.2, pointsLabel: "Combat prep" },
  { key: "other", label: "Other", multiplier: 0.85, pointsLabel: "Training mix" },
];

export const CHARACTER_OPTIONS = [
  { key: "babu-frik", label: "Babu Frik", flavor: "Small mechanic, huge upside. Quietly upgrades the whole operation.", accent: "amber" },
  { key: "padme", label: "Padme Amidala", flavor: "Poised, disciplined, and impossible to shake off the plan.", accent: "rose" },
  { key: "luke", label: "Luke Skywalker", flavor: "Keeps the trench run alive with steady reps and calm under pressure.", accent: "gold" },
  { key: "leia", label: "Leia Organa", flavor: "Command presence. Ruthless consistency. Never misses a session.", accent: "rose" },
  { key: "rey", label: "Rey", flavor: "Learns fast, adapts faster, and turns raw effort into real power.", accent: "sand" },
  { key: "han", label: "Han Solo", flavor: "Unstructured plan, still somehow posts a huge weekly total.", accent: "rust" },
  { key: "jarjar", label: "Jar Jar Binks", flavor: "Chaotic form, accidental output. Somehow keeps the squad moving.", accent: "teal" },
  { key: "salacious-crumb", label: "Salacious B. Crumb", flavor: "Shrieking chaos gremlin energy. Entirely unserious, somehow still present for everything.", accent: "amber" },
  { key: "jabba", label: "Jabba the Hutt", flavor: "Does not rush, but still somehow controls the whole board.", accent: "olive" },
  { key: "chewie", label: "Chewbacca", flavor: "Raw strength and giant engine. Heavy days hit different.", accent: "bark" },
  { key: "lando", label: "Lando Calrissian", flavor: "Smooth pacing, sharp recovery, suspiciously clean splits.", accent: "blue" },
  { key: "r2d2", label: "R2-D2", flavor: "Tiny frame, elite output, always doing more than expected.", accent: "ice" },
  { key: "c3po", label: "C-3PO", flavor: "Complains through every session, still logs it anyway.", accent: "gold" },
  { key: "yoda", label: "Yoda", flavor: "Short sessions, high wisdom, absurd efficiency.", accent: "green" },
  { key: "wedge", label: "Wedge Antilles", flavor: "Reliable squad pilot. Quietly keeps the rebellion on pace.", accent: "steel" },
  { key: "ackbar", label: "Admiral Ackbar", flavor: "Sees the traps, still commits to the work.", accent: "teal" },
  { key: "boba", label: "Boba Fett", flavor: "Freelance menace. Efficient, direct, no wasted motion.", accent: "olive" },
  { key: "vader", label: "Darth Vader", flavor: "Dark side intensity. Turns every workout into a statement.", accent: "ember" },
];

export const DEFAULT_PARTICIPANTS = [];
export const LEGACY_PARTICIPANT_ID_MAP = {};

export const PLANET_UNLOCKS = [
  {
    key: "yavin",
    title: "Yavin IV",
    planetType: "forest-moon",
    shipKey: "gr75",
    ship: "GR-75 Transport",
    description: "The rebellion secures its base and starts moving people, gear, and fuel.",
  },
  {
    key: "tatooine",
    title: "Tatooine",
    planetType: "desert",
    shipKey: "landspeeder",
    ship: "Landspeeder Convoy",
    description: "Desert miles and hot-weather grit harden the crew early.",
  },
  {
    key: "dantooine",
    title: "Dantooine",
    planetType: "grassland",
    shipKey: "xwing",
    ship: "X-Wing Flight",
    description: "Pilots sharpen up. Focused training starts to look like a real attack plan.",
  },
  {
    key: "hoth",
    title: "Hoth",
    planetType: "ice",
    shipKey: "snowspeeder",
    ship: "Snowspeeder Wing",
    description: "Cold, grindy consistency pushes the squad through the ugly middle of the month.",
  },
  {
    key: "bespin",
    title: "Bespin",
    planetType: "gas-giant",
    shipKey: "falcon",
    ship: "Millennium Falcon",
    description: "Big strength blocks and mixed training unlock smarter pace and bigger output.",
  },
  {
    key: "endor",
    title: "Endor",
    planetType: "forest",
    shipKey: "awing",
    ship: "A-Wing Interceptors",
    description: "Agility, mobility, and fast sessions tighten the strike window.",
  },
  {
    key: "scarif",
    title: "Scarif",
    planetType: "tropical",
    shipKey: "uwing",
    ship: "U-Wing Strike Team",
    description: "The team is mission-ready. Cardio and strength finally work as one system.",
  },
  {
    key: "death-star",
    title: "Death Star Trench",
    planetType: "death-star",
    shipKey: "red5",
    ship: "Red Five",
    description: "The fleet is ready for the final run. One clean shot ends the whole thing.",
  },
];

export const SUPPORT_UNLOCKS = [
  {
    key: "comlink",
    title: "Encrypted Comlink",
    type: "weapon",
    description: "Faster coordination keeps the rebel crew on mission and cuts wasted movement.",
  },
  {
    key: "macrobinoculars",
    title: "Macrobinoculars",
    type: "skill",
    description: "Rangefinding and awareness sharpen pacing so the squad picks better efforts.",
  },
  {
    key: "blaster",
    title: "DL-44 Blaster",
    type: "weapon",
    description: "Confidence goes up. Short, hard sessions start landing with more purpose.",
  },
  {
    key: "saber-drill",
    title: "Lightsaber Drills",
    type: "skill",
    description: "Balance and control improve, making recovery days more useful instead of dead time.",
  },
  {
    key: "detonators",
    title: "Thermal Detonators",
    type: "weapon",
    description: "Explosive conditioning blocks become part of the plan and raise the pressure ceiling.",
  },
  {
    key: "force-focus",
    title: "Force Focus",
    type: "skill",
    description: "Discipline locks in. The team strings together harder weeks without losing consistency.",
  },
  {
    key: "ion-cannon",
    title: "Ion Cannon",
    type: "weapon",
    description: "Heavy output is now online. Strength and cardio finally support the same assault plan.",
  },
  {
    key: "trench-instincts",
    title: "Trench Run Instincts",
    type: "skill",
    description: "The final edge. Timing, calm, and aggression line up for the shot on the Death Star.",
  },
];

export const CHAPTER_THEME = {
  title: "The Anniepire Strikes Back",
  eyebrow: "The Anniepire Strikes Back · May 2026",
  description:
    "The rebels race through May by stacking experience points from every kind of training. Running, walking, hiking, lifting, and conditioning all help expose the Death Star.",
  pointsExplanation:
    "XP uses active minutes as the base, then multiplies by workout type. Mixing training types adds a bonus so the squad levels up faster when the plan stays varied.",
};

export function activityTypeFor(key) {
  return ACTIVITY_TYPES.find((activity) => activity.key === key) || ACTIVITY_TYPES[0];
}

export function calculateWorkoutPoints(activityKey, durationMinutes, existingRuns = []) {
  const activity = activityTypeFor(activityKey);
  const safeMinutes = Math.max(0, Number(durationMinutes) || 0);
  const basePoints = safeMinutes * activity.multiplier;
  const firstOfTypeBonus = existingRuns.some((run) => run.activityType === activityKey) ? 0 : 12;
  const mostRecent = existingRuns[0];
  const mixBonus = mostRecent && mostRecent.activityType !== activityKey ? 6 : 0;
  const totalPoints = Math.round(basePoints + firstOfTypeBonus + mixBonus);

  return {
    totalPoints,
    basePoints: Math.round(basePoints),
    firstOfTypeBonus,
    mixBonus,
  };
}

export function levelForPoints(points) {
  return Math.max(1, Math.floor((Number(points) || 0) / 120) + 1);
}

export function daysInChapterMonth() {
  return 31;
}
