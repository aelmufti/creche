import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-brutal">
        {label}
      </label>
      {children}
      {hint && <p className="-mt-0.5 text-[11px] text-muted-foreground leading-tight">{hint}</p>}
    </div>
  );
}

export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  id?: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-stretch border-[3px] border-border bg-card shadow-brutal-sm">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="w-full bg-transparent px-3 py-2 font-bold outline-none"
      />
      {suffix && (
        <span className="flex items-center border-l-[3px] border-border bg-muted px-3 text-sm font-bold">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Slider({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  ariaLabel,
}: {
  id?: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  ariaLabel?: string;
}) {
  return (
    <input
      id={id}
      type="range"
      className="range-brutal w-full"
      value={value}
      min={min}
      max={max}
      step={step}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid auto-cols-fr grid-flow-col border-[3px] border-border shadow-brutal-sm"
    >
      {options.map((o, idx) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`px-3 py-2 text-sm font-bold uppercase tracking-brutal ${
              idx > 0 ? "border-l-[3px] border-border" : ""
            } ${active ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id?: string;
  checked: boolean;
  onChange: (b: boolean) => void;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left"
    >
      <span
        className={`flex h-7 w-7 flex-none items-center justify-center border-[3px] border-border shadow-brutal-sm ${
          checked ? "bg-accent text-accent-foreground" : "bg-card"
        }`}
      >
        {checked ? "×" : ""}
      </span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
