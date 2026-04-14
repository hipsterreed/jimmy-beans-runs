const HOST = "https://jimbo-and-bean-runs.web.app";

const MISSION_COPY = [
  { title: "Leave the Shire" },
  { title: "Bree Bound" },
  { title: "Rivendell Rally" },
  { title: "Moria Miles" },
  { title: "Lothlorien Lift" },
  { title: "Rohan Run Club" },
  { title: "Gondor Calls" },
  { title: "Morgul March" },
  { title: "Cirith Ungol" },
  { title: "Gorgoroth Grind" },
];

const MILESTONE_STEP = 5;

const RUNNER_IMAGE_BY_ID: Record<string, string> = {
  "runner-sam": `${HOST}/assets/hipster_sam.jpg`,
};

const RUNNER_IMAGE_BY_NAME: Record<string, string> = {
  "frodo bean": `${HOST}/assets/frodo_bean.JPG`,
  "breezy": `${HOST}/assets/breezy.JPG`,
  "con bombadil": `${HOST}/assets/con_bombadil.JPG`,
  "drewid": `${HOST}/assets/drewid.JPG`,
  "tanner the treacherous": `${HOST}/assets/tanner_the_treacherous.JPG`,
  "mason": `${HOST}/assets/mason.JPG`,
};

function resolveImage(runnerId: string, runnerName: string): string | null {
  return (
    RUNNER_IMAGE_BY_ID[runnerId] ??
    RUNNER_IMAGE_BY_NAME[runnerName.toLowerCase()] ??
    null
  );
}

function currentMilestone(combinedMiles: number, totalGoalMiles: number): string {
  if (totalGoalMiles <= 0) return "Mount Doom";
  if (combinedMiles >= totalGoalMiles) return "Mount Doom";

  let miles = MILESTONE_STEP;
  let index = 0;
  while (miles < totalGoalMiles) {
    if (combinedMiles < miles) {
      return MISSION_COPY[index % MISSION_COPY.length].title;
    }
    miles += MILESTONE_STEP;
    index++;
  }
  return "Mount Doom";
}

function buildProgressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

function formatMiles(miles: number): string {
  return miles % 1 === 0 ? String(miles) : miles.toFixed(1);
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface SlackRunPayload {
  runnerId: string;
  runnerName: string;
  characterKey: string;
  miles: number;
  runDate: string;
  combinedMiles: number;
  totalGoalMiles: number;
  narration: string | null;
}

export async function sendRunSlackNotification(payload: SlackRunPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL is not set — skipping Slack notification");
    return;
  }

  const imageUrl = resolveImage(payload.runnerId, payload.runnerName);
  const progress = payload.totalGoalMiles > 0
    ? Math.min(100, Math.round((payload.combinedMiles / payload.totalGoalMiles) * 100))
    : 0;
  const progressBar = buildProgressBar(progress);
  const remaining = Math.max(payload.totalGoalMiles - payload.combinedMiles, 0);
  const milestone = currentMilestone(payload.combinedMiles, payload.totalGoalMiles);
  const formattedDate = formatDate(payload.runDate);

  const blocks: object[] = [
    // LLM narration
    ...(payload.narration ? [{
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_${payload.narration}_`,
      },
    }] : []),
    // Name + run info with thumbnail on the right
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `\n\n*${payload.runnerName}*\n${formatMiles(payload.miles)} mi  ·  ${formattedDate}`,
      },
      ...(imageUrl ? {
        accessory: {
          type: "image",
          image_url: imageUrl,
          alt_text: payload.runnerName,
        },
      } : {}),
    },
    { type: "divider" },
    // Quest progress
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: [
          `*Fellowship progress to Mount Doom*`,
          `${progressBar}  ${formatMiles(payload.combinedMiles)} / ${formatMiles(payload.totalGoalMiles)} mi  ·  ${progress}%`,
          remaining > 0
            ? `_${formatMiles(remaining)} miles to go — heading for ${milestone}_`
            : `_The fellowship has reached Mount Doom!_ 🌋`,
        ].join("\n"),
      },
    },
  ];

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `${payload.runnerName} logged ${formatMiles(payload.miles)} miles`,
      blocks,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Slack webhook failed (${res.status}): ${body}`);
  }
}
