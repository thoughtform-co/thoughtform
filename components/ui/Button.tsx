"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

type ButtonVariant = "ghost" | "solid";

interface ButtonBaseProps {
  variant?: ButtonVariant;
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

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantStyles: Record<ButtonVariant, string> = {
  ghost: `
    bg-transparent 
    border-dawn-15 
    text-dawn-70 
    hover:border-dawn-30 
    hover:bg-dawn-04 
    hover:text-dawn
  `,
  solid: `
    bg-gold 
    border-gold 
    text-void 
    hover:bg-gold-70 
    hover:border-gold-70
  `,
};

export function Button({
  variant = "ghost",
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex 
    items-center 
    justify-center 
    gap-2 
    px-5 
    py-3 
    font-mono 
    text-xs 
    uppercase 
    tracking-wide 
    border 
    cursor-pointer 
    transition-all 
    duration-base 
    ease-out
  `;

  const combinedClassName = cn(baseStyles, variantStyles[variant], className);

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

