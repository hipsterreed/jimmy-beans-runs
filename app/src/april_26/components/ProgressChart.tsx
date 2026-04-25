import { buildChartView, CHART_HEIGHT, CHART_PADDING, CHART_WIDTH } from "../lib/chart";
import type { QuestState } from "../lib/selectors";
import { formatMiles } from "../lib/utils";

type Props = {
  state: QuestState;
};

export function ProgressChart({ state }: Props) {
  const view = buildChartView(state);
  const { visibleCoords, baselineY, hasData, yTickValues, yMax, xTickDays } = view;

  const linePath = hasData
    ? visibleCoords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
    : "";
  const areaPath =
    hasData && visibleCoords.length > 0
      ? `${linePath} L ${visibleCoords[visibleCoords.length - 1].x} ${baselineY} L ${visibleCoords[0].x} ${baselineY} Z`
      : "";

  const eyePoints = visibleCoords.filter(
    (point) => point.day === 1 || point.day === visibleCoords.length || point.total > 0,
  );

  return (
    <section className="mission-panel chart-panel">
      <div className="mission-header">
        <p className="eyebrow" style={{ margin: 0 }}>
          Progress Chart
        </p>
      </div>
      <div className="chart-shell">
        <div className="chart-y-label">Miles</div>
        <div className="chart-stage">
          <svg
            id="progressChart"
            className="progress-chart"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            aria-labelledby="chartTitle chartDesc"
            role="img"
          >
            <title id="chartTitle">Cumulative miles by day of month</title>
            <desc id="chartDesc">A line chart showing fellowship progress across the month.</desc>
            <g id="chartGrid">
              {yTickValues.map((value, index) => {
                const y =
                  baselineY -
                  ((value || 0) / yMax) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
                return (
                  <line
                    key={index}
                    x1={CHART_PADDING.left}
                    x2={CHART_WIDTH - CHART_PADDING.right}
                    y1={y}
                    y2={y}
                    className="chart-grid-line"
                  />
                );
              })}
            </g>
            <path id="chartArea" className="chart-area" d={areaPath} />
            <path id="chartLine" className="chart-line" d={linePath} />
            <g id="chartPoints">
              {eyePoints.map((point) => (
                <g key={point.day} className="chart-eye" transform={`translate(${point.x} ${point.y})`}>
                  <ellipse cx="0" cy="0" rx="9" ry="5.5" className="chart-eye-outer" />
                  <ellipse cx="0" cy="0" rx="3.2" ry="4.2" className="chart-eye-iris" />
                  <rect x="-0.9" y="-4.3" width="1.8" height="8.6" rx="0.9" className="chart-eye-pupil" />
                  <path d="M -8 0 Q 0 -9 8 0 M -8 0 Q 0 9 8 0" className="chart-eye-flare" />
                </g>
              ))}
            </g>
            <g id="chartYTicks">
              {yTickValues.map((value, index) => {
                const y =
                  baselineY -
                  ((value || 0) / yMax) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
                return (
                  <text
                    key={index}
                    x={CHART_PADDING.left - 10}
                    y={y + 5}
                    textAnchor="end"
                    className="chart-y-tick"
                  >
                    {formatMiles(value)}
                  </text>
                );
              })}
            </g>
          </svg>
          <p id="chartEmpty" className="chart-empty" hidden={hasData}>
            Log a run to reveal the quest path across the month.
          </p>
          <div id="chartXTicks" className="chart-x-ticks">
            {xTickDays.map((day) => (
              <span key={day} className="chart-x-tick">
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
