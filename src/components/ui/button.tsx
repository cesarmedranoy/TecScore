/**
 * Button — primitivo base.
 *
 * Variantes pensadas para TecScore:
 *  - default: acción principal (verde cancha)
 *  - accent:  acción de gloria (dorado trofeo)
 *  - outline: acción secundaria
 *  - ghost:   acción terciaria / link-like
 *  - danger:  destructiva (eliminar grupo, etc.)
 *
 * Tamaños: sm | md | lg | icon
 */

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]",
        accent:
          "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 active:scale-[0.98]",
        outline:
          "border border-border bg-card hover:bg-muted hover:text-foreground",
        ghost: "hover:bg-muted hover:text-foreground",
        danger:
          "bg-danger text-danger-foreground shadow-sm hover:bg-danger/90 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
