"use client";
import * as RS from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

// Styled Radix Select — matches lab-parfumo-next's shadcn/radix convention.
export type Option = { value: string; label: string };

export function Select({
  value, onValueChange, options, placeholder = "— เลือก —", className = "", onPick,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  // fires on every item tap — even when re-picking the current value (Radix's
  // onValueChange doesn't). Lets callers re-trigger UI (e.g. reopen a popup).
  onPick?: (v: string) => void;
}) {
  return (
    <RS.Root value={value} onValueChange={onValueChange}>
      <RS.Trigger
        className={`flex items-center justify-between gap-2 w-full border border-black/10 rounded-lg px-2.5 py-2 text-sm bg-white data-[state=open]:border-gold focus:outline-none focus:border-gold ${className}`}
      >
        <RS.Value placeholder={placeholder} />
        <RS.Icon><ChevronDown className="w-4 h-4 text-black/40" /></RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content
          position="popper" sideOffset={4}
          className="z-50 min-w-[var(--radix-select-trigger-width)] max-h-72 overflow-auto bg-white border border-black/10 rounded-lg shadow-lg"
        >
          <RS.Viewport className="p-1">
            {options.map((o) => (
              <RS.Item key={o.value} value={o.value} onClick={() => onPick?.(o.value)}
                className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-md cursor-pointer select-none data-[highlighted]:bg-gold/10 data-[highlighted]:outline-none">
                <RS.ItemIndicator><Check className="w-3.5 h-3.5 text-gold-dark" /></RS.ItemIndicator>
                <RS.ItemText>{o.label}</RS.ItemText>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  );
}
