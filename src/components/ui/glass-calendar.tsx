import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  format,
  getDate,
  getDaysInMonth,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Day {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
}

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, selectedDate: propSelectedDate, onDateSelect, ...props }, ref) => {
    const [currentMonth, setCurrentMonth] = React.useState(propSelectedDate || new Date());
    const [selectedDate, setSelectedDate] = React.useState(propSelectedDate || new Date());

    React.useEffect(() => {
      if (propSelectedDate) {
        setSelectedDate(propSelectedDate);
        setCurrentMonth(propSelectedDate);
      }
    }, [propSelectedDate]);

    const monthDays = React.useMemo(() => {
      const start = startOfMonth(currentMonth);
      const totalDays = getDaysInMonth(currentMonth);
      const days: Day[] = [];
      for (let i = 0; i < totalDays; i += 1) {
        const date = new Date(start.getFullYear(), start.getMonth(), i + 1);
        days.push({
          date,
          isToday: isToday(date),
          isSelected: isSameDay(date, selectedDate),
        });
      }
      return days;
    }, [currentMonth, selectedDate]);

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      onDateSelect?.(date);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'w-full max-w-[360px] rounded-3xl p-5 shadow-2xl overflow-hidden',
          'bg-black/75 backdrop-blur-xl border border-white/10 text-white',
          className,
        )}
        {...props}
      >
        <div className="my-3 flex items-center justify-between">
          <motion.p
            key={format(currentMonth, 'MMMM-yyyy')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-3xl font-bold tracking-tight"
          >
            {format(currentMonth, 'MMMM yyyy')}
          </motion.p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-full p-1 text-white/80 transition-colors hover:bg-black/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-full p-1 text-white/80 transition-colors hover:bg-black/20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center">
          {monthDays.map((day) => (
            <button
              key={format(day.date, 'yyyy-MM-dd')}
              type="button"
              onClick={() => handleDateClick(day.date)}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-150',
                day.isSelected
                  ? 'bg-gradient-to-br from-pink-500 to-orange-400 text-white shadow-lg'
                  : 'text-white hover:bg-white/20',
              )}
            >
              {day.isToday && !day.isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-pink-400" />
              )}
              {getDate(day.date)}
            </button>
          ))}
        </div>
      </div>
    );
  },
);

GlassCalendar.displayName = 'GlassCalendar';
