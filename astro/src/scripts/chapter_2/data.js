export const CHAPTER_ID = "chapter-2";
export const DEFAULT_RUNNER_GOAL = 600;
export const DEFAULT_CHARACTER_KEY = "luke";
export const FINAL_BATTLE_DATE = "2026-05-31";
export const BATTLE_READINESS_WEIGHTS = {
  xp: 0.7,
  targetHitRate: 0.2,
  unlockProgress: 0.1,
};
export const BATTLE_OUTCOME_TIERS = [
  {
    key: "victory",
    minScore: 90,
    title: "Death Star Destroyed",
    description: "The Rebel fleet is ready. The trench run lands and the Death Star breaks apart over Yavin.",
  },
  {
    key: "near-miss",
    minScore: 75,
    title: "Attack Run Nearly Succeeds",
    description: "The fleet gets a real shot off, but the station survives. The rebellion escapes with momentum.",
  },
  {
    key: "retreat",
    minScore: 50,
    title: "Rebel Retreat",
    description: "The strike force commits, takes losses, and falls back before the Death Star can finish the job.",
  },
  {
    key: "defeat",
    minScore: 0,
    title: "Empire Overwhelms the Fleet",
    description: "The rebels are underpowered on battle day. The Empire controls the field and the attack fails.",
  },
];

export const GOAL_PRESETS = [
  {
    key: "padawan",
    label: "Padawan",
    targetLevel: 4,
    points: 360,
    description: "Reach Level 4. About 20-30 minutes, 4 days each week.",
  },
  {
    key: "pilot",
    label: "Pilot",
    targetLevel: 5,
    points: 480,
    description: "Reach Level 5. About 30-40 minutes, 4-5 days each week.",
  },
  {
    key: "squad-leader",
    label: "Squad Leader",
    targetLevel: 6,
    points: 600,
    description: "Reach Level 6. About 40-50 minutes, 5 days each week.",
  },
  {
    key: "jedi-master",
    label: "Jedi Master",
    targetLevel: 8,
    points: 840,
    description: "Reach Level 8. About 50-60 minutes, 5-6 days each week.",
  },
  {
    key: "custom",
    label: "Custom",
    targetLevel: 6,
    points: DEFAULT_RUNNER_GOAL,
    description: "Set a custom target level.",
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

const ICON_SEQUENCE = [
  "comlink",
  "macrobinoculars",
  "blaster",
  "saber-drill",
  "detonators",
  "force-focus",
  "ion-cannon",
  "trench-instincts",
  "medpac",
  "star-map",
];

const CHARACTER_ARSENAL_TITLES = {
  "babu-frik": [
    ["weapon", "Spark Spanner"],
    ["skill", "Emergency Retrofit"],
    ["weapon", "Micro Arc Welder"],
    ["skill", "Scrap Savant"],
    ["weapon", "Pulse Screwdriver"],
    ["skill", "Hyperdrive Patch"],
    ["weapon", "Bench Shock Rig"],
    ["skill", "Impossible Repair"],
    ["weapon", "Workshop Override"],
    ["skill", "Tiny Mastermind"],
  ],
  padme: [
    ["weapon", "Naboo Holdout Blaster"],
    ["skill", "Diplomatic Resolve"],
    ["weapon", "Royal Guard Sidearm"],
    ["skill", "Senate Calm"],
    ["weapon", "Convoy Disruptor"],
    ["skill", "Crisis Discipline"],
    ["weapon", "Plasma Filament Dagger"],
    ["skill", "Queen's Command"],
    ["weapon", "Theed Defense Kit"],
    ["skill", "Unshakable Presence"],
  ],
  luke: [
    ["weapon", "Training Saber"],
    ["skill", "Targeting Instinct"],
    ["weapon", "T-16 Reflex Cannon"],
    ["skill", "Farmboy Grit"],
    ["weapon", "Jedi Lightsaber"],
    ["skill", "Force Timing"],
    ["weapon", "Trench Torpedoes"],
    ["skill", "Trust the Force"],
    ["weapon", "Red Five Kill Shot"],
    ["skill", "Hero of Yavin"],
  ],
  leia: [
    ["weapon", "Defender Sporting Blaster"],
    ["skill", "Command Presence"],
    ["weapon", "Alderaanian Sidearm"],
    ["skill", "Tactical Grace"],
    ["weapon", "Rebel Signal Burst"],
    ["skill", "Cell Organizer"],
    ["weapon", "Strike Briefing Kit"],
    ["skill", "Unbreakable Nerve"],
    ["weapon", "General's Volley"],
    ["skill", "Alliance Backbone"],
  ],
  rey: [
    ["weapon", "Staff Guard"],
    ["skill", "Adaptive Force"],
    ["weapon", "Jakku Saber Form"],
    ["skill", "Scavenger Focus"],
    ["weapon", "Skywalker Blade"],
    ["skill", "Rapid Learner"],
    ["weapon", "Force Surge"],
    ["skill", "Dyad Awareness"],
    ["weapon", "Final Order Breaker"],
    ["skill", "Jedi Renewal"],
  ],
  han: [
    ["weapon", "DL-44 Heavy Blaster"],
    ["skill", "Scoundrel Momentum"],
    ["weapon", "Smuggler's Cache"],
    ["skill", "Lucky Escape"],
    ["weapon", "Fast Draw Burst"],
    ["skill", "Cocky Recovery"],
    ["weapon", "Corellian Ambush"],
    ["skill", "Never Tell Me Odds"],
    ["weapon", "Captain's Barrage"],
    ["skill", "Kessel Run Nerve"],
  ],
  jarjar: [
    ["weapon", "Booma Pouch"],
    ["skill", "Chaotic Luck"],
    ["weapon", "Gungan Polearm"],
    ["skill", "Trip Into Success"],
    ["weapon", "Booma Cluster"],
    ["skill", "Panic Dash"],
    ["weapon", "Swamp Sling"],
    ["skill", "Accidental Dodge"],
    ["weapon", "Gungan Volley"],
    ["skill", "Somehow It Worked"],
  ],
  "salacious-crumb": [
    ["weapon", "Shriek Disruptor"],
    ["skill", "Saboteur Cackle"],
    ["weapon", "Palace Gremlin Claws"],
    ["skill", "Mocking Diversion"],
    ["weapon", "Laughing Toxin"],
    ["skill", "Balcony Skitter"],
    ["weapon", "Cage Door Trick"],
    ["skill", "Chaotic Heckling"],
    ["weapon", "Purple 'Lightsaber'"],
    ["skill", "Absolutely Not Mace"],
  ],
  jabba: [
    ["weapon", "Hutt Cartel Blaster"],
    ["skill", "Crime Lord Influence"],
    ["weapon", "Rancor Lever"],
    ["skill", "Throne Room Patience"],
    ["weapon", "Sail Barge Cannon"],
    ["skill", "Debt Collection"],
    ["weapon", "Execution Switch"],
    ["skill", "Slow-Burn Control"],
    ["weapon", "Cartel Barrage"],
    ["skill", "Palace Dominion"],
  ],
  chewie: [
    ["weapon", "Bowcaster"],
    ["skill", "Wookiee Power"],
    ["weapon", "Shoulder Charge"],
    ["skill", "Fury Engine"],
    ["weapon", "Rage Pull"],
    ["skill", "Heavy Carry"],
    ["weapon", "Wroshyr Slam"],
    ["skill", "Co-Pilot Loyalty"],
    ["weapon", "Berserker Volley"],
    ["skill", "Kashyyyk Endurance"],
  ],
  lando: [
    ["weapon", "Smuggler Pistol"],
    ["skill", "Smooth Escape"],
    ["weapon", "Sabacc Tell"],
    ["skill", "Cloud City Charm"],
    ["weapon", "Cape Feint"],
    ["skill", "Calculated Risk"],
    ["weapon", "Administrator's Strike"],
    ["skill", "Gambler's Nerve"],
    ["weapon", "General's Clean Sweep"],
    ["skill", "Cool Under Fire"],
  ],
  r2d2: [
    ["weapon", "Arc Welder"],
    ["skill", "Systems Override"],
    ["weapon", "Shock Probe"],
    ["skill", "Astromech Routing"],
    ["weapon", "Oil Slick Burst"],
    ["skill", "Socket Slicer"],
    ["weapon", "Thruster Pop"],
    ["skill", "Secret Compartments"],
    ["weapon", "Droid Countermeasure Grid"],
    ["skill", "Mission Critical"],
  ],
  c3po: [
    ["weapon", "Protocol Panic"],
    ["skill", "Odds Calculation"],
    ["weapon", "Etiquette Shock"],
    ["skill", "Translation Matrix"],
    ["weapon", "Anxious Alarm"],
    ["skill", "Formal Logistics"],
    ["weapon", "Diplomatic Delay"],
    ["skill", "Probability Spiral"],
    ["weapon", "Golden Distraction"],
    ["skill", "One Million Forms"],
  ],
  yoda: [
    ["weapon", "Grand Master's Saber"],
    ["skill", "Force Wisdom"],
    ["weapon", "Ataru Burst"],
    ["skill", "Patience Training"],
    ["weapon", "Jedi Cane Strike"],
    ["skill", "Calm Between Sets"],
    ["weapon", "Dagobah Ambush"],
    ["skill", "Ancient Discipline"],
    ["weapon", "Council Breaker"],
    ["skill", "Do Or Do Not"],
  ],
  wedge: [
    ["weapon", "Starfighter Cannons"],
    ["skill", "Veteran Pilot"],
    ["weapon", "Formation Burst"],
    ["skill", "Steady Hands"],
    ["weapon", "Interceptor Sweep"],
    ["skill", "Wingman Instinct"],
    ["weapon", "Squadron Cover Fire"],
    ["skill", "No-Drama Precision"],
    ["weapon", "Ace Attack Run"],
    ["skill", "Survivor's Pace"],
  ],
  ackbar: [
    ["weapon", "Fleet Turbolaser Command"],
    ["skill", "Trap Sense"],
    ["weapon", "Bridge Salvo"],
    ["skill", "Admiral's Readiness"],
    ["weapon", "Broadside Protocol"],
    ["skill", "Formation Discipline"],
    ["weapon", "Countertrap Spread"],
    ["skill", "Command Bridge Calm"],
    ["weapon", "Flagship Barrage"],
    ["skill", "Mon Cala Mastery"],
  ],
  boba: [
    ["weapon", "EE-3 Carbine"],
    ["skill", "Bounty Precision"],
    ["weapon", "Jetpack Rocket"],
    ["skill", "Tracker Lock"],
    ["weapon", "Flamethrower Sweep"],
    ["skill", "Helmet Targeting"],
    ["weapon", "Cable Snare"],
    ["skill", "Cold Pursuit"],
    ["weapon", "Contract Finisher"],
    ["skill", "Hunter's Patience"],
  ],
  vader: [
    ["weapon", "Sith Lightsaber"],
    ["skill", "Force Choke Discipline"],
    ["weapon", "Crushing Saber Arc"],
    ["skill", "Imperial Resolve"],
    ["weapon", "Telekinetic Slam"],
    ["skill", "Dark Side Focus"],
    ["weapon", "Red Blade Barrage"],
    ["skill", "Fear Aura"],
    ["weapon", "Executor's Wrath"],
    ["skill", "Relentless Domination"],
  ],
};

export function supportUnlocksForCharacter(characterKey) {
  const entries = CHARACTER_ARSENAL_TITLES[characterKey] || CHARACTER_ARSENAL_TITLES[DEFAULT_CHARACTER_KEY];
  const label = CHARACTER_OPTIONS.find((character) => character.key === characterKey)?.label || "This rebel";
  return entries.map(([type, title], index) => ({
    key: `${characterKey}-${index + 1}`,
    iconKey: ICON_SEQUENCE[index] || ICON_SEQUENCE[ICON_SEQUENCE.length - 1],
    title,
    type,
    level: index + 1,
    description:
      type === "weapon"
        ? `${label} unlocks ${title} at Level ${index + 1}, bringing a stronger strike option into the rebellion's endgame.`
        : `${label} unlocks ${title} at Level ${index + 1}, sharpening their personal training edge for the Death Star run.`,
  }));
}

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

export const LEVEL_THRESHOLDS = [
  0,
  100,
  220,
  360,
  520,
  700,
  900,
  1120,
  1360,
  1620,
];

export function pointsForLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  if (safeLevel <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[safeLevel - 1];
  }

  let total = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  let increment = 260;
  for (let currentLevel = LEVEL_THRESHOLDS.length + 1; currentLevel <= safeLevel; currentLevel += 1) {
    total += increment;
    increment += 20;
  }
  return total;
}

export function nextLevelPoints(level) {
  return pointsForLevel(Math.max(2, Math.floor(Number(level) || 1) + 1));
}

export function levelForPoints(points) {
  const safePoints = Math.max(0, Number(points) || 0);
  let resolvedLevel = 1;

  for (let level = 1; level <= LEVEL_THRESHOLDS.length; level += 1) {
    if (safePoints >= pointsForLevel(level)) {
      resolvedLevel = level;
    } else {
      break;
    }
  }

  if (resolvedLevel < LEVEL_THRESHOLDS.length) {
    return resolvedLevel;
  }

  let level = LEVEL_THRESHOLDS.length;
  while (safePoints >= nextLevelPoints(level)) {
    level += 1;
  }
  return level;
}

export function daysInChapterMonth() {
  return 31;
}
