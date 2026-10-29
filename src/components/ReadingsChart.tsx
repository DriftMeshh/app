import type { Reading } from '../api/types';

const WIDTH = 560;
const HEIGHT = 140;
const PAD = 24;

interface Props {
  readings: Reading[];
}

/** Lightweight inline SVG line chart — no charting library needed for one series. */
export function ReadingsChart({ readings }: Props) {
  if (readings.length < 2) {
    return null; // not enough points for a line to mean anything
  }

  // The API returns newest-first; chart left-to-right chronologically.
  const chronological = [...readings].reverse();
  const values = chronological.map((r) => r.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = chronological.map((reading, i) => {
    const x = PAD + (i / (chronological.length - 1)) * (WIDTH - PAD * 2);
    const y = PAD + (1 - (reading.value - min) / range) * (HEIGHT - PAD * 2);
    return { x, y, reading };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${HEIGHT - PAD} L${points[0].x},${HEIGHT - PAD} Z`;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="readings-chart-svg" role="img" aria-label="Readings over time">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chart-fill)" stroke="none" />
        <path d={linePath} className="chart-line" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.reading.accepted ? 3 : 4}
            className={p.reading.accepted ? 'chart-point' : 'chart-point-rejected'}
          >
            <title>
              epoch {p.reading.epoch}: {p.reading.value}
              {!p.reading.accepted ? ' (rejected)' : ''}
            </title>
          </circle>
        ))}
      </svg>
      <div className="chart-range">
        <span>{min}</span>
        <span className="muted">range over last {readings.length} readings</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
