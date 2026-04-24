import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive:
          "text-destructive-foreground",
        outline:
          "border bg-background hover:bg-muted",
        secondary: "border bg-background",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const styleByVariant: Record<string, React.CSSProperties> = {
      default: { background: 'var(--fg)', color: 'var(--bg-elev-1)' },
      destructive: { background: 'var(--status-danger)', color: '#fff' },
      outline: { borderColor: 'var(--border)', color: 'var(--fg)' },
      secondary: { borderColor: 'var(--border)', background: 'var(--bg-elev-1)', color: 'var(--fg)' },
    };
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={styleByVariant[variant || 'default']}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
