"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

export type ButtonVariant = "ghost" | "solid" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: never;
  };

type ButtonAsAnchor = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantStyles: Record<ButtonVariant, string> = {
  ghost: cn(
    "bg-transparent",
    "border-dawn-15",
    "text-dawn-70",
    "hover:border-dawn-30",
    "hover:bg-dawn-04",
    "hover:text-dawn"
  ),
  solid: cn("bg-gold", "border-gold", "text-void", "hover:bg-gold-70", "hover:border-gold-70"),
  outline: cn(
    "bg-transparent",
    "border-gold",
    "text-gold",
    "hover:bg-gold/10",
    "hover:border-gold-70"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-2xs",
  md: "px-5 py-3 text-xs",
  lg: "px-6 py-4 text-sm",
};

export function Button({
  variant = "ghost",
  size = "md",
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = cn(
    "inline-flex",
    "items-center",
    "justify-center",
    "gap-2",
    "font-mono",
    "uppercase",
    "tracking-wide",
    "border",
    "cursor-pointer",
    "transition-all",
    "duration-200",
    "ease-out",
    "whitespace-nowrap"
  );

  const combinedClassName = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

  if ("href" in props && props.href) {
    const { href, ...anchorProps } = props as ButtonAsAnchor;
    return (
      <a href={href} className={combinedClassName} {...anchorProps}>
        {children}
      </a>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button className={combinedClassName} {...buttonProps}>
      {children}
    </button>
  );
}
