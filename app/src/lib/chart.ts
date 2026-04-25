import { SIDE_QUESTS } from "./data";
import type { Run } from "./types";
import { combinedMiles, totalGoalMiles, type QuestState } from "./selectors";

export const CHART_WIDTH = 720;
export const CHART_HEIGHT = 180;
export const CHART_PADDING = { top: 12, right: 14, bottom: 22, left: 38 };

export type ChartPoint = {
  day: number;
  total: number;
  x: number;
  y: number;
};

function chartMonthInfo(runs: Run[]) {
  const latestRunDate = runs
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

function monthlyCumulativeSeries(state: QuestState) {
  const { year, monthIndex, daysInMonth } = chartMonthInfo(state.runs);
  const dailyMiles = Array.from({ length: daysInMonth }, () => 0);

  state.runs.forEach((run) => {
    if (!run.runDate) return;
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

function todaySeriesCutoff(year: number, monthIndex: number, seriesLength: number): number {
  const today = new Date();
  if (today.getFullYear() === year && today.getMonth() === monthIndex) {
    return Math.min(today.getDate(), seriesLength);
  }
  return seriesLength;
}

function chartYMax(series: { total: number }[], goal: number): number {
  const topValue = Math.max(...series.map((point) => point.total), 0);
  const rawMax = Math.max(topValue, goal, 5);
  return Math.ceil(rawMax / 5) * 5;
}

function chartCoordinates(series: { day: number; total: number }[], yMax: number): ChartPoint[] {
  const usableWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const usableHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const lastDay = Math.max(series.length - 1, 1);

  return series.map((point, index) => {
    const x = CHART_PADDING.left + (usableWidth * index) / lastDay;
    const y = CHART_HEIGHT - CHART_PADDING.bottom - (point.total / yMax) * usableHeight;
    return { ...point, x, y };
  });
}

export type ChartView = {
  hasData: boolean;
  yMax: number;
  visibleCoords: ChartPoint[];
  series: { day: number; total: number }[];
  baselineY: number;
  xTickDays: number[];
  yTickValues: number[];
};

export function buildChartView(state: QuestState): ChartView {
  const series = monthlyCumulativeSeries(state);
  const { year, monthIndex } = chartMonthInfo(state.runs);
  const cutoff = todaySeriesCutoff(year, monthIndex, series.length);
  const hasData = state.runs.length > 0 && series.some((point) => point.total > 0);
  const yMax = chartYMax(series, totalGoalMiles(state));
  const coords = chartCoordinates(series, yMax);
  const visibleCoords = coords.slice(0, cutoff);
  const baselineY = CHART_HEIGHT - CHART_PADDING.bottom;
  const xTickDays = Array.from(
    new Set([1, 8, 15, 22, series.length].filter((day) => day <= series.length)),
  );

  return {
    hasData,
    yMax,
    visibleCoords,
    series,
    baselineY,
    xTickDays,
    yTickValues: [0, yMax / 2, yMax],
  };
}

export type MissionStep = {
  miles: number;
  title: string;
  description: string;
};

export function buildMissionSteps(goalMiles: number): MissionStep[] {
  if (goalMiles <= 0) return [];
  const milesPerQuest = goalMiles / SIDE_QUESTS.length;
  return SIDE_QUESTS.map((quest, index) => ({
    miles: milesPerQuest * (index + 1),
    title: quest.title,
    description: quest.description,
  }));
}

export function combinedMilesFor(state: QuestState): number {
  return combinedMiles(state);
}
