export function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  function clamp(v: number): number {
    return Math.max(min, Math.min(max, v))
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-cloud px-4 py-2">
      <span className="flex-1 text-lg font-extrabold text-ink">{value}</span>
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-extrabold text-brand-green shadow-sm disabled:opacity-40"
      >
        −
      </button>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-extrabold text-brand-green shadow-sm disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
