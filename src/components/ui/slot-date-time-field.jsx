import React from 'react';
import { DatePickerField } from '@/components/ui/date-picker-field';

function splitDateTime(value) {
  if (!value || typeof value !== 'string') return { date: '', time: '' };
  const [date = '', time = ''] = value.split('T');
  return { date, time: time.slice(0, 5) };
}

export default function SlotDateTimeField({
  value,
  onChange,
  minDate,
}) {
  const { date, time } = splitDateTime(value);

  const handleDateChange = (nextDate) => {
    const nextTime = time || '09:00';
    onChange(`${nextDate}T${nextTime}`);
  };

  const handleTimeChange = (event) => {
    const nextTime = event.target.value;
    const nextDate = date || new Date().toISOString().slice(0, 10);
    onChange(`${nextDate}T${nextTime}`);
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <DatePickerField
        value={date}
        onChange={handleDateChange}
        min={minDate}
        placeholder="Select date"
      />
      <input
        type="time"
        value={time}
        onChange={handleTimeChange}
        className="flex h-11 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
