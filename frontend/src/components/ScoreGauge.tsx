import type { ScoreLabel } from "../types";

const COLOR: Record<ScoreLabel, string> = {
  "Well-Instrumented": "#10B981",
  "Functional with Gaps": "#F59E0B",
  "Needs Attention": "#F97316",
  "Critical Gaps": "#EF4444",
};

export default function ScoreGauge({ score, label, rationale }: { score: number; label: ScoreLabel; rationale: string }) {
  const color = COLOR[label];
  const size = 120;
  const r = 46;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const gap = circ - dash;

  return (
    <div style={{ textAlign: "center", minWidth: 160 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--elevated)" strokeWidth={10} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
        />
        <text x={cx} y={cy + 6} textAnchor="middle" fill={color} fontSize={28} fontWeight={800} fontFamily="Plus Jakarta Sans" style={{ transform: "rotate(90deg)", transformOrigin: `${cx}px ${cy}px` }}>
          {score}
        </text>
      </svg>
      <p style={{ fontWeight: 700, fontSize: 13, color, marginTop: 4 }}>{label}</p>
      <p style={{ color: "var(--muted)", fontSize: 11, maxWidth: 160, lineHeight: 1.4, marginTop: 4 }}>{rationale}</p>
    </div>
  );
}
