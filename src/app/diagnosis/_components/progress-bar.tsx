type Props = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: Props) {
  const pct = ((current + 1) / total) * 100;

  return (
    <div className="w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
