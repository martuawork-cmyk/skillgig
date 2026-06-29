/**
 * Donut chart — pure inline SVG, no chart library.
 * Used in /earn to visualise earnings breakdown by category.
 */
import { formatIDR } from '@/lib/utils';

type Slice = {
  label: string;
  value: number;
  color: string; // hex or tailwind arbitrary color
};

type Props = {
  data: Slice[];
  total: number;
  size?: number;
};

export function DonutChart({ data, total, size = 200 }: Props) {
  const radius = size / 2;
  const innerR = radius * 0.6;
  const cx = radius;
  const cy = radius;

  // Filter out zero-value slices
  const slices = data.filter((s) => s.value > 0);
  const sum = slices.reduce((s, x) => s + x.value, 0) || 1;

  let cumulative = 0;
  const paths = slices.map((s, i) => {
    const start = (cumulative / sum) * Math.PI * 2 - Math.PI / 2;
    cumulative += s.value;
    const end = (cumulative / sum) * Math.PI * 2 - Math.PI / 2;
    const largeArc = end - start > Math.PI ? 1 : 0;

    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);

    const ix1 = cx + innerR * Math.cos(end);
    const iy1 = cy + innerR * Math.sin(end);
    const ix2 = cx + innerR * Math.cos(start);
    const iy2 = cy + innerR * Math.sin(start);

    const d = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { d, color: s.color, label: s.label, value: s.value, key: i };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill={p.color}
            className="transition-opacity hover:opacity-80"
          >
            <title>
              {p.label}: {formatIDR(p.value)}
            </title>
          </path>
        ))}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wide"
        >
          Total
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="fill-slate-900 text-base font-extrabold"
        >
          {formatIDR(total)}
        </text>
      </svg>

      <ul className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-slate-700 truncate">{s.label}</span>
            <span className="ml-auto text-slate-500 tabular-nums">
              {Math.round((s.value / sum) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}