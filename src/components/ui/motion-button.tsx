import { ArrowRight } from 'lucide-react';
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  variant?: 'primary' | 'secondary';
  classes?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const MotionButton: FC<Props> = ({
  label,
  classes,
  variant = 'primary',
  onClick,
  type = 'button',
}) => {
  const isSecondary = variant === 'secondary';

  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        'group relative h-auto w-52 cursor-pointer rounded-full border-none p-1 outline-none',
        isSecondary ? 'bg-muted/70' : 'bg-background/90',
        classes,
      )}
    >
      <span
        className={cn(
          'm-0 block h-12 w-12 overflow-hidden rounded-full duration-500 group-hover:w-full',
          isSecondary ? 'bg-foreground/80' : 'bg-primary',
        )}
        aria-hidden="true"
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 translate-x-0 duration-500 group-hover:translate-x-[0.4rem]">
        <ArrowRight className={cn('size-6', isSecondary ? 'text-background' : 'text-primary-foreground')} />
      </div>
      <span
        className={cn(
          'absolute left-2/4 top-2/4 ml-4 -translate-x-2/4 -translate-y-2/4 whitespace-nowrap text-center text-lg font-medium tracking-tight duration-500',
          isSecondary ? 'text-foreground group-hover:text-background' : 'text-foreground group-hover:text-primary-foreground',
        )}
      >
        {label}
      </span>
    </button>
  );
};

export default MotionButton;
