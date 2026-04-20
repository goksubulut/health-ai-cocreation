import React, { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { GlassCalendar } from '@/components/ui/glass-calendar';

interface DatePickerFieldProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Select a date',
  min,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    try {
      return parseISO(value);
    } catch {
      return undefined;
    }
  }, [value]);

  const displayLabel = selectedDate ? format(selectedDate, 'PPP') : placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{displayLabel}</span>
        <Calendar size={16} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2">
          <GlassCalendar
            selectedDate={selectedDate ?? new Date()}
            onDateSelect={(date) => {
              const iso = format(date, 'yyyy-MM-dd');
              if (min && iso < min) return;
              onChange(iso);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
