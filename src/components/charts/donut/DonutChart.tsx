interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerContent?: React.ReactNode;
}

export default function DonutChart({
  data,
  size = 160,
  strokeWidth = 18,
  centerContent,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulative = 0;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
        />
        {data.map((segment, index) => {
          const fraction = segment.value / total;
          const dash = fraction * circumference;
          const offset = -(cumulative / total) * circumference;
          cumulative += segment.value;

          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
        })}
      </svg>

      {centerContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerContent}
        </div>
      )}
    </div>
  );
}