"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// CUSTOM SELECT - Styled dropdown with golden gradient
// ═══════════════════════════════════════════════════════════════

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className = "",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (optionValue !== value) {
        onChange(optionValue);
      }
      setIsOpen(false);
    },
    [value, onChange]
  );

  return (
    <div
      className={`spec-select ${className} ${disabled ? "spec-select--disabled" : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        className={`spec-select__trigger ${isOpen ? "spec-select__trigger--open" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="spec-select__value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="spec-select__arrow">▼</span>
      </button>

      {isOpen && (
        <div className="spec-select__dropdown">
          {options
            .filter((option) => option.value !== "") // Filter out placeholder option
            .map((option) => (
              <button
                key={option.value}
                type="button"
                className={`spec-select__option ${value === option.value ? "spec-select__option--selected" : ""} ${option.disabled ? "spec-select__option--disabled" : ""}`}
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
              >
                {option.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
