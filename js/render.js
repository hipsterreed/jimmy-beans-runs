import { state, runnerRuns, totalMilesForRunner, totalGoalMiles, combinedMiles } from "./state.js";
import { characterFor, customImageForRunner, formatMiles, parseDateLabel, todayIsoDate } from "./utils.js";
import { MISSION_COPY, MILESTONE_STEP } from "./data.js";

const elements = {
  fellowshipCluster: document.getElementById("fellowshipCluster"),
  totalMiles: document.getElementById("totalMiles"),
  goalMiles: document.getElementById("goalMiles"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  journeyMarker: document.getElementById("journeyMarker"),
  ringText: document.getElementById("ringText"),
  missions: document.getElementById("missions"),
  progressChart: document.getElementById("progressChart"),
  chartGrid: document.getElementById("chartGrid"),
  chartArea: document.getElementById("chartArea"),
  chartLine: document.getElementById("chartLine"),
  chartPoints: document.getElementById("chartPoints"),
  chartYTicks: document.getElementById("chartYTicks"),
  chartXTicks: document.getElementById("chartXTicks"),
  chartEmpty: document.getElementById("chartEmpty"),
  runnerGrid: document.getElementById("runnerGrid"),
  runnerCardTemplate: document.getElementById("runnerCardTemplate"),
  logItemTemplate: document.getElementById("logItemTemplate"),
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 280;
const CHART_PADDING = { top: 18, right: 18, bottom: 26, left: 44 };

function runnerNarration(runner) {
  const goal = Math.max(runner.goalMiles, 1);
  const progress = totalMilesForRunner(runner.id) / goal;

  if (progress >= 1) return "Goal cleared. Officially returning from Mordor.";
  if (progress >= 0.75) return "Final stretch. Lava glow in sight.";
  if (progress >= 0.4) return "Mid-quest form. Fellowship pace is healthy.";
  if (progress > 0) return "Early miles are on the board.";
  return "Fresh quest. No miles logged yet.";
}

function ringNarration(progressRatio, goal) {
  if (goal <= 0) return "The ring waits for the fellowship to form.";
  if (progressRatio >= 1) return "The ring is gone. Mount Doom claims another jewelry victim.";
  if (progressRatio >= 0.8) return "The lava glow is visible. Final push to the crater.";
  if (progressRatio >= 0.6) return "Mordor is near. The road looks hostile but runnable.";
  if (progressRatio >= 0.4) return "Past Rivendell. The fellowship pace is holding.";
  if (progressRatio >= 0.2) return "Beyond the Shire. Bree is in sight.";
  return "The ring has barely left the Shire.";
}

function buildMissionSteps(goalMiles) {
  if (goalMiles <= 0) {
    return [];
  }

  const steps = [];
  let miles = MILESTONE_STEP;
  let index = 0;

  while (miles < goalMiles) {
    const copy = MISSION_COPY[index % MISSION_COPY.length];
    steps.push({
      miles,
      title: copy.title,
      description: copy.description,
    });
    miles += MILESTONE_STEP;
    index += 1;
  }

  steps.push({
    miles: goalMiles,
    title: "Mount Doom",
    description: "Quest complete. The fellowship reached the fire.",
  });

  return steps;
}

export function renderFellowshipCluster() {
  const cluster = elements.fellowshipCluster;
  cluster.innerHTML = "";

  if (state.runners.length === 0) return;

  const offsets = [
    // back row
    { x: 30, y: 22, delay: 1.1 },
    { x: 52, y: 18, delay: 2.3 },
    { x: 72, y: 24, delay: 0.6 },
    // middle row
    { x: 18, y: 50, delay: 1.8 },
    { x: 42, y: 46, delay: 0.2 },
    { x: 63, y: 52, delay: 2.7 },
    { x: 84, y: 48, delay: 1.4 },
    // front row
    { x: 28, y: 78, delay: 0.8 },
    { x: 52, y: 82, delay: 2.0 },
    { x: 74, y: 78, delay: 1.5 },
  ];

  [...state.runners]
    .sort((a, b) => a.createdAtMs - b.createdAtMs)
    .forEach((runner, i) => {
      const character = characterFor(runner.characterKey);
      const pos = offsets[i % offsets.length];
      const bubble = document.createElement("div");
      bubble.className = "cluster-bubble";
      bubble.style.left = `${pos.x}%`;
      bubble.style.top = `${pos.y}%`;
      bubble.style.animationDelay = `${pos.delay}s`;

      const frame = document.createElement("div");
      frame.className = "cluster-frame";

      const avatar = document.createElement("div");
      avatar.className = "cluster-avatar";
      const customImage = customImageForRunner(runner);
      if (customImage) {
        avatar.classList.add("sprite-photo");
        avatar.style.backgroundImage = `url("${customImage}")`;
      } else {
        avatar.classList.add(`sprite-${character.key}`);
      }

      const miles = totalMilesForRunner(runner.id);
      const progressRatio = runner.goalMiles > 0 ? Math.min(miles / runner.goalMiles, 1) : 0;
      const svgNS = "http://www.w3.org/2000/svg";
      const r = 28;
      const circ = 2 * Math.PI * r;
      const cSvg = document.createElementNS(svgNS, "svg");
      cSvg.setAttribute("width", "64"); cSvg.setAttribute("height", "64");
      cSvg.setAttribute("class", "progress-ring"); cSvg.setAttribute("aria-hidden", "true");
      const cBg = document.createElementNS(svgNS, "circle");
      cBg.setAttribute("cx", "32"); cBg.setAttribute("cy", "32"); cBg.setAttribute("r", String(r));
      cBg.setAttribute("class", "progress-ring-bg"); cBg.setAttribute("stroke-dasharray", String(circ));
      const cFill = document.createElementNS(svgNS, "circle");
      cFill.setAttribute("cx", "32"); cFill.setAttribute("cy", "32"); cFill.setAttribute("r", String(r));
      cFill.setAttribute("class", "progress-ring-fill"); cFill.setAttribute("stroke-dasharray", String(circ));
      cFill.setAttribute("stroke-dashoffset", String(circ * (1 - progressRatio)));
      cSvg.append(cBg, cFill);

      frame.append(avatar, cSvg);
      if (progressRatio >= 1) frame.classList.add("legendary");
      bubble.appendChild(frame);
      cluster.appendChild(bubble);
    });
}

export function renderRunnerCards() {
  elements.runnerGrid.innerHTML = "";

  if (state.runners.length === 0) {
    const emptyCard = document.createElement("article");
    emptyCard.className = "character-card empty-card";
    emptyCard.innerHTML = `
      <p class="eyebrow">No Runners Yet</p>
      <h2>Start the fellowship</h2>
      <p class="supporting">Add a runner, pick a character, and set the first monthly goal.</p>
    `;
    elements.runnerGrid.appendChild(emptyCard);
    return;
  }

  const orderedRunners = [...state.runners].sort((a, b) => a.createdAtMs - b.createdAtMs);

  orderedRunners.forEach((runner, index) => {
    const character = characterFor(runner.characterKey);
    const miles = totalMilesForRunner(runner.id);
    const entries = runnerRuns(runner.id)
      .slice()
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
    const card = elements.runnerCardTemplate.content.firstElementChild.cloneNode(true);
    const sprite = card.querySelector(".sprite");
    const roleLabel = card.querySelector(".runner-role");
    const nameLabel = card.querySelector(".runner-name");
    const flavorLabel = card.querySelector(".runner-flavor");
    const mileValue = card.querySelector(".runner-mile-value");
    const goalValue = card.querySelector(".runner-goal-value");
    const form = card.querySelector(".mile-form");
    const runDateInput = form.elements.runDate;
    const log = card.querySelector(".run-log");
    const editRunnerButton = card.querySelector(".edit-runner-button");

    card.dataset.character = character.accent;
    card.dataset.runnerId = runner.id;
    const customImage = customImageForRunner(runner);
    if (customImage) {
      sprite.classList.add("sprite-photo");
      sprite.style.backgroundImage = `url("${customImage}")`;
    } else {
      sprite.classList.add(`sprite-${character.key}`);
    }
    // Progress ring
    const progressRatio = runner.goalMiles > 0 ? Math.min(miles / runner.goalMiles, 1) : 0;
    const svgNS = "http://www.w3.org/2000/svg";
    const r = 51;
    const circ = 2 * Math.PI * r;
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "110");
    svg.setAttribute("height", "110");
    svg.setAttribute("class", "progress-ring");
    svg.setAttribute("aria-hidden", "true");
    const bgCircle = document.createElementNS(svgNS, "circle");
    bgCircle.setAttribute("cx", "55"); bgCircle.setAttribute("cy", "55"); bgCircle.setAttribute("r", String(r));
    bgCircle.setAttribute("class", "progress-ring-bg");
    bgCircle.setAttribute("stroke-dasharray", String(circ));
    const fillCircle = document.createElementNS(svgNS, "circle");
    fillCircle.setAttribute("cx", "55"); fillCircle.setAttribute("cy", "55"); fillCircle.setAttribute("r", String(r));
    fillCircle.setAttribute("class", "progress-ring-fill");
    fillCircle.setAttribute("stroke-dasharray", String(circ));
    fillCircle.setAttribute("stroke-dashoffset", String(circ * (1 - progressRatio)));
    svg.append(bgCircle, fillCircle);
    const spriteFrame = card.querySelector(".sprite-frame");
    spriteFrame.appendChild(svg);
    if (progressRatio >= 1) spriteFrame.classList.add("legendary");

    roleLabel.textContent = character.label;
    nameLabel.textContent = runner.name;
    flavorLabel.textContent = character.flavor;
    mileValue.textContent = formatMiles(miles);
    goalValue.textContent = String(runner.goalMiles);

    form.dataset.runnerId = runner.id;
    runDateInput.value = todayIsoDate();
    editRunnerButton.dataset.runnerId = runner.id;

    card.querySelector(".quest-mood").textContent = runnerNarration(runner);

    entries.forEach((entry) => {
      const item = elements.logItemTemplate.content.firstElementChild.cloneNode(true);
      item.querySelector(".log-miles").textContent = `${formatMiles(entry.miles)} mi`;
      item.querySelector(".log-date").textContent = parseDateLabel(entry.runDate);
      const deleteButton = item.querySelector(".delete-run-button");
      deleteButton.dataset.runId = entry.id;
      log.appendChild(item);
    });

    elements.runnerGrid.appendChild(card);
  });
}

export function renderProgress() {
  const totalMiles = combinedMiles();
  const goalMiles = totalGoalMiles();
  const progressRatio = goalMiles > 0 ? Math.min(totalMiles / goalMiles, 1) : 0;
  const remaining = Math.max(goalMiles - totalMiles, 0);

  elements.totalMiles.textContent = formatMiles(totalMiles);
  elements.goalMiles.textContent = formatMiles(goalMiles);
  elements.progressFill.style.width = `${progressRatio * 100}%`;
  elements.ringText.textContent = ringNarration(progressRatio, goalMiles);

  // Animate marker from start to current progress position
  elements.journeyMarker.style.left = "0%";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elements.journeyMarker.style.left = `${progressRatio * 100}%`;
    });
  });

  if (goalMiles <= 0) {
    elements.progressText.textContent = "Recruit runners to begin the quest.";
  } else if (remaining > 0) {
    elements.progressText.textContent = `${formatMiles(remaining)} miles to Mount Doom`;
  } else {
    elements.progressText.textContent = "Quest complete. The fellowship reached Mount Doom.";
  }
}

export function renderMissions() {
  const steps = buildMissionSteps(totalGoalMiles());
  const totalMiles = combinedMiles();

  elements.missions.innerHTML = "";

  if (steps.length === 0) {
    const empty = document.createElement("article");
    empty.className = "mission-card unlocked";
    empty.innerHTML = "<h3>Waiting On The Fellowship</h3><p>Add a runner to generate the quest path.</p>";
    elements.missions.appendChild(empty);
    return;
  }

  steps.forEach((step) => {
    const unlocked = totalMiles >= step.miles;
    const card = document.createElement("article");
    card.className = unlocked ? "mission-card unlocked" : "mission-card";

    card.innerHTML = `
      <div class="mission-marker">${formatMiles(step.miles)} mi</div>
      <div class="mission-icon">${unlocked ? "⚔" : "🔒"}</div>
      <h3 class="mission-title">${unlocked ? step.title : "Locked"}</h3>
      <p class="mission-body">${unlocked ? step.description : `Reach ${formatMiles(step.miles)} miles to unlock.`}</p>
    `;

    elements.missions.appendChild(card);
  });
}

function chartMonthInfo() {
  const latestRunDate = state.runs
    .map((run) => run.runDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  const baseDate = latestRunDate ? new Date(`${latestRunDate}T12:00:00`) : new Date();
  const year = baseDate.getFullYear();
  const monthIndex = baseDate.getMonth();

  return {
    year,
    monthIndex,
    daysInMonth: new Date(year, monthIndex + 1, 0).getDate(),
  };
}

function monthlyCumulativeSeries() {
  const { year, monthIndex, daysInMonth } = chartMonthInfo();
  const dailyMiles = Array.from({ length: daysInMonth }, () => 0);

  state.runs.forEach((run) => {
    if (!run.runDate) {
      return;
    }

    const [runYear, runMonth, runDay] = run.runDate.split("-").map(Number);
    if (runYear !== year || runMonth !== monthIndex + 1 || !runDay || runDay > daysInMonth) {
      return;
    }

    dailyMiles[runDay - 1] += run.miles;
  });

  let cumulative = 0;
  return dailyMiles.map((miles, index) => {
    cumulative += miles;
    return { day: index + 1, total: cumulative };
  });
}

function chartYMax(series) {
  const topValue = Math.max(...series.map((point) => point.total), 0);
  const goal = totalGoalMiles();
  const rawMax = Math.max(topValue, goal, 5);
  return Math.ceil(rawMax / 5) * 5;
}

function chartCoordinates(series, yMax) {
  const usableWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const usableHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const lastDay = Math.max(series.length - 1, 1);

  return series.map((point, index) => {
    const x = CHART_PADDING.left + (usableWidth * index) / lastDay;
    const y = CHART_HEIGHT - CHART_PADDING.bottom - (point.total / yMax) * usableHeight;
    return { ...point, x, y };
  });
}

function renderChart() {
  const series = monthlyCumulativeSeries();
  const hasData = state.runs.length > 0 && series.some((point) => point.total > 0);
  const yMax = chartYMax(series);
  const coords = chartCoordinates(series, yMax);
  const baselineY = CHART_HEIGHT - CHART_PADDING.bottom;

  elements.chartGrid.innerHTML = "";
  elements.chartPoints.innerHTML = "";
  elements.chartYTicks.innerHTML = "";
  elements.chartXTicks.innerHTML = "";
  elements.chartLine.setAttribute("d", "");
  elements.chartArea.setAttribute("d", "");
  elements.chartEmpty.hidden = hasData;

  const tickValues = [0, yMax / 2, yMax];
  tickValues.forEach((value) => {
    const y = baselineY - ((value || 0) / yMax) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(CHART_PADDING.left));
    line.setAttribute("x2", String(CHART_WIDTH - CHART_PADDING.right));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("class", "chart-grid-line");
    elements.chartGrid.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(CHART_PADDING.left - 10));
    label.setAttribute("y", String(y + 5));
    label.setAttribute("text-anchor", "end");
    label.setAttribute("class", "chart-y-tick");
    label.textContent = formatMiles(value);
    elements.chartYTicks.appendChild(label);
  });

  const xTickDays = Array.from(
    new Set([1, 8, 15, 22, series.length].filter((day) => day <= series.length)),
  );
  xTickDays.forEach((day) => {
    const tick = document.createElement("span");
    tick.className = "chart-x-tick";
    tick.textContent = String(day);
    elements.chartXTicks.appendChild(tick);
  });

  if (!hasData) {
    return;
  }

  const linePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`;

  elements.chartLine.setAttribute("d", linePath);
  elements.chartArea.setAttribute("d", areaPath);

  coords
    .filter((point) => point.day === 1 || point.day === series.length || point.total > 0)
    .forEach((point) => {
      const eyeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      eyeGroup.setAttribute("class", "chart-eye");
      eyeGroup.setAttribute("transform", `translate(${point.x} ${point.y})`);

      const outer = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      outer.setAttribute("cx", "0");
      outer.setAttribute("cy", "0");
      outer.setAttribute("rx", "9");
      outer.setAttribute("ry", "5.5");
      outer.setAttribute("class", "chart-eye-outer");

      const iris = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      iris.setAttribute("cx", "0");
      iris.setAttribute("cy", "0");
      iris.setAttribute("rx", "3.2");
      iris.setAttribute("ry", "4.2");
      iris.setAttribute("class", "chart-eye-iris");

      const pupil = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      pupil.setAttribute("x", "-0.9");
      pupil.setAttribute("y", "-4.3");
      pupil.setAttribute("width", "1.8");
      pupil.setAttribute("height", "8.6");
      pupil.setAttribute("rx", "0.9");
      pupil.setAttribute("class", "chart-eye-pupil");

      const glow = document.createElementNS("http://www.w3.org/2000/svg", "path");
      glow.setAttribute("d", "M -8 0 Q 0 -9 8 0 M -8 0 Q 0 9 8 0");
      glow.setAttribute("class", "chart-eye-flare");

      eyeGroup.append(outer, iris, pupil, glow);
      elements.chartPoints.appendChild(eyeGroup);
    });
}

export function render() {
  renderRunnerCards();
  renderFellowshipCluster();
  renderProgress();
  renderMissions();
  renderChart();
}
