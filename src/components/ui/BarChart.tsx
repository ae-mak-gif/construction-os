interface BarChartProps {
  data: { label: string; value1: number; value2?: number }[];
  label1: string;
  label2?: string;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, label1, label2, formatValue = (v) => `$${(v / 1000).toFixed(0)}k` }: BarChartProps) {
  const max = Math.max(...data.flatMap((d) => [d.value1, d.value2 || 0]));
  const scale = 200 / max;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-xs text-gray-500">{label1}</span>
        </div>
        {label2 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-400" />
            <span className="text-xs text-gray-500">{label2}</span>
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 h-48">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
            <div className="flex items-end gap-1 w-full justify-center h-full">
              <div
                className="w-3 rounded-t bg-blue-500 transition-all duration-500 hover:bg-blue-600"
                style={{ height: `${(d.value1 * scale)}px` }}
                title={formatValue(d.value1)}
              />
              {d.value2 !== undefined && (
                <div
                  className="w-3 rounded-t bg-orange-400 transition-all duration-500 hover:bg-orange-500"
                  style={{ height: `${(d.value2 * scale)}px` }}
                  title={formatValue(d.value2)}
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-2">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
