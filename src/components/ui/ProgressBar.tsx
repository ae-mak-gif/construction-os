export function ProgressBar({ value, color = 'blue' }: { value: number; color?: 'blue' | 'green' | 'amber' | 'red' }) {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[color]}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
