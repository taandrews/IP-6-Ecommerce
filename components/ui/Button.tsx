import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-200 ease-brand disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-forest-700 text-ivory-100 hover:bg-forest-800 active:bg-forest-900",
        secondary: "border border-forest-700 text-forest-700 hover:bg-forest-50",
        gold: "bg-gold-400 text-forest-900 hover:bg-gold-500 active:bg-gold-600",
        ghost: "text-forest-700 hover:bg-ivory-200",
        danger: "bg-danger text-white hover:bg-red-700",
      },
      size: {
        sm: "text-sm px-3 py-1.5",
        md: "text-sm px-5 py-3",
        lg: "text-base px-6 py-3.5",
        icon: "p-2",
      },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", full: false },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { children: ReactNode };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, full, children, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(button({ variant, size, full }), className)} {...props}>
      {children}
    </button>
  );
});

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof button> & { href: string; children: ReactNode };

export function LinkButton({ className, variant, size, full, href, children, ...props }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(button({ variant, size, full }), className)} {...props}>
      {children}
    </Link>
  );
}
