export const QUEST_ID = "april-quest";
export const DEFAULT_RUNNER_GOAL = 30;

export const CHARACTER_OPTIONS = [
  { key: "sam", label: "Samwise", flavor: "Second breakfast loyalist. Keeps the whole squad moving.", accent: "warm" },
  { key: "frodo", label: "Frodo", flavor: "Quiet grit. Carries the burden and still gets the miles in.", accent: "green" },
  { key: "aragorn", label: "Aragorn", flavor: "Strider miles. Ranger pace. Zero fear of elevation.", accent: "steel" },
  { key: "gimli", label: "Gimli", flavor: "Short stride, huge engine, absolutely thrives on stubborn climbs.", accent: "bark" },
  { key: "legolas", label: "Legolas", flavor: "Light feet, elite cadence, suspiciously fresh after long runs.", accent: "leaf" },
  { key: "gandalf", label: "Gandalf", flavor: "Shows up late, drops a huge effort, vanishes mysteriously.", accent: "mist" },
  { key: "theoden", label: "Theoden", flavor: "Kingly grit. Rallies late and still charges hardest at the horn call.", accent: "sun" },
  { key: "eowyn", label: "Eowyn", flavor: "Unbothered by doubt. Absolutely dusts the Witch-king split.", accent: "rose" },
  { key: "merry", label: "Merry", flavor: "Underrated pace merchant. Quietly stacks consistent miles.", accent: "warm" },
  { key: "pippin", label: "Pippin", flavor: "Chaotic training plan, but somehow still gets it done.", accent: "sun" },
  { key: "sauron", label: "Sauron", flavor: "Big eye on the leaderboard. Dramatic and impossible to ignore.", accent: "ember" },
  { key: "tom-bombadil", label: "Tom Bombadil", flavor: "Chaotic woodland energy. Runs for the vibes alone.", accent: "sun" },
  { key: "treebeard", label: "Treebeard", flavor: "Slow to start, impossible to stop once moving.", accent: "bark" },
  { key: "gollum", label: "Gollum", flavor: "Questionable form. Exceptional obsession with the finish.", accent: "swamp" },
  { key: "balrog", label: "Balrog", flavor: "Hot pace, dramatic entrances, absolutely no chill.", accent: "ember" },
];

export const DEFAULT_RUNNERS = [
  { id: "runner-sam", name: "Hipster Sam", characterKey: "sam", goalMiles: 30, createdAtMs: 1 },
  { id: "runner-frodo", name: "Frodo Bean", characterKey: "frodo", goalMiles: 30, createdAtMs: 2 },
];

export const CUSTOM_RUNNER_IMAGES = {
  "runner-sam": "./assets/hipster_sam.jpg",
  "frodo bean": "./assets/frodo_bean.JPG",
  breezy: "./assets/breezy.JPG",
  "con bombadil": "./assets/con_bombadil.JPG",
  drewid: "./assets/drewid.JPG",
  jackagorn: "./assets/jackagorn.JPG",
  "merry molly": "./assets/merry_molly.JPG",
  "presto baggins": "./assets/presto_baggins.JPG",
  rushington: "./assets/rushington.JPG",
  "tanwise gamgee": "./assets/tanwise_gamgee.png",
  "tamwise gamgee": "./assets/tanwise_gamgee.png",
  "tanner the treacherous": "./assets/tanner_the_treacherous.JPG",
  mason: "./assets/mason.JPG",
};

export const CUSTOM_CHARACTER_IMAGES = {
  gollum: "./assets/mason.JPG",
};

export const SIDE_QUESTS = [
  { title: "Leave the Shire", description: "Slip past Hobbiton and begin the long road east." },
  { title: "Farmer Maggot's Fields", description: "Move fast through the fields before trouble catches up." },
  { title: "Through the Old Forest", description: "Keep your footing where the woods themselves feel watchful." },
  { title: "Tom Bombadil's House", description: "Find a pocket of safety and absurd cheer in the wild." },
  { title: "Barrow-down Escape", description: "Shake off the darkness and get moving again." },
  { title: "Bree Arrival", description: "Reach the Prancing Pony and regroup for the next leg." },
  { title: "Weathertop Watch", description: "Climb high ground and hold steady when the path turns exposed." },
  { title: "Flight to the Ford", description: "Push the pace and race for the river crossing." },
  { title: "Rivendell Council", description: "Rest, recover, and set the plan with the wise." },
  { title: "Fellowship Formed", description: "Bind the company together and commit to the quest." },
  { title: "Caradhras Crossing", description: "Battle the mountain and its brutal conditions." },
  { title: "Doors of Durin", description: "Find the hidden way forward when the path seems sealed." },
  { title: "Into Moria", description: "Enter the deep dark and keep moving in spite of it." },
  { title: "Bridge of Khazad-dum", description: "Face the fire and hold the line at the narrow pass." },
  { title: "Golden Wood of Lothlorien", description: "Recover your strength beneath the mallorn trees." },
  { title: "Mirror of Galadriel", description: "Look ahead, stay focused, and refuse the easier path." },
  { title: "Great River Run", description: "Settle into rhythm and let the miles carry you south." },
  { title: "Breaking of the Fellowship", description: "Hold the quest together when the road pulls apart." },
  { title: "Riders of Rohan", description: "Find open ground and run with speed and purpose." },
  { title: "Fangorn Forest", description: "Press through the ancient woods where progress feels slow." },
  { title: "Entmoot Called", description: "Gather resolve before the next great push." },
  { title: "Helm's Deep Stand", description: "Dig in and outlast the hardest stretch of the campaign." },
  { title: "Paths of the Dead", description: "Take the route no one wants and see it through." },
  { title: "Siege of Gondor", description: "Answer the call when the pressure is highest." },
  { title: "Beacon of Minas Tirith", description: "Light the signal and bring the whole fellowship forward." },
  { title: "Shelob's Lair", description: "Navigate the dark and keep the ring moving." },
  { title: "Tower of Cirith Ungol", description: "Regroup after the worst of it and climb again." },
  { title: "March Across Gorgoroth", description: "Endure the ash plain with Mount Doom in sight." },
  { title: "Crack of Doom", description: "Make the final approach and refuse to stop now." },
  { title: "Ring Destroyed", description: "Finish the quest and end the burden for good." },
];

export const PLAYABLE_SIDE_QUESTS = {
  "Flight to the Ford": {
    title: "Flight to the Ford",
    description: "Guide Frodo and Arwen through the woodland paths, gather every light, and outrun the Ringwraiths.",
  },
  "Into Moria": {
    title: "Into Moria",
    description: "Keep the company moving through the dark and dodge the cave-ins overhead.",
  },
  "Helm's Deep Stand": {
    title: "Helm's Deep Stand",
    description: "Hold the wall and outlast the Uruk barrage through the storm.",
  },
  "Shelob's Lair": {
    title: "Shelob's Lair",
    description: "Slip through the web-choked tunnels without getting trapped in the dark.",
  },
  "March Across Gorgoroth": {
    title: "March Across Gorgoroth",
    description: "Cross the ash plain and avoid the burning ground all the way to the mountain.",
  },
  "Ring Destroyed": {
    title: "Ring Destroyed",
    description: "Make the final run at Mount Doom and survive the last bursts of fire.",
  },
};
