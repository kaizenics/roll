"use client";

import { Label } from "@/components/ui/label";

export function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id}>{label}</Label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`focus-visible:ring-ring/30 relative h-6 w-10 rounded-full outline-none transition-colors focus-visible:ring-[3px] ${checked ? "bg-primary" : "bg-input"}`}
      >
        <span
          className={`bg-background absolute left-0.5 top-0.5 size-5 rounded-full transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </button>
    </div>
  );
}

export function DeviceSelect({
  id,
  label,
  devices,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  devices: MediaDeviceInfo[];
  value: string | null;
  onChange: (deviceId: string | null) => void;
  disabled: boolean;
}) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="border-input bg-card h-9 rounded-md border px-2 text-sm disabled:opacity-50"
      >
        <option value="">System default</option>
        {devices.map((device, index) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `${label} ${index + 1}`}
          </option>
        ))}
      </select>
    </>
  );
}
