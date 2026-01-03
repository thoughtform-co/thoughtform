"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  CATEGORIES,
  getComponentsByCategory,
  type CategoryDef,
  type ComponentDef,
} from "../catalog";

// ═══════════════════════════════════════════════════════════════
// NESTED SELECT - Single dropdown with category -> component submenus
// Supports three modes:
// - "full" (default): nested category → component selection
// - "category": only category selection
// - "component": only component selection within current category
// ═══════════════════════════════════════════════════════════════

export interface NestedSelectProps {
  categoryId: string | null;
  componentKey: string | null;
  onChange: (categoryId: string | null, componentKey: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  mode?: "full" | "category" | "component";
}

export function NestedSelect({
  categoryId,
  componentKey,
  onChange,
  placeholder = "Select Component...",
  disabled = false,
  className = "",
  mode = "full",
}: NestedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCategory = CATEGORIES.find((cat) => cat.id === categoryId);
  const components = categoryId ? getComponentsByCategory(categoryId) : [];
  const selectedComponent = components.find((comp) => comp.id === componentKey);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveCategory(null);
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
        setActiveCategory(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleSelectComponent = useCallback(
    (catId: string, compKey: string) => {
      onChange(catId, compKey);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleSelectCategory = useCallback(
    (catId: string) => {
      // When selecting a category in "category" mode, select the first component
      const categoryComponents = getComponentsByCategory(catId);
      const firstComponent = categoryComponents[0];
      if (firstComponent) {
        onChange(catId, firstComponent.id);
      }
      setIsOpen(false);
    },
    [onChange]
  );

  // Set initial active category when opening
  useEffect(() => {
    if (isOpen) {
      setActiveCategory(categoryId || CATEGORIES[0]?.id || null);
    } else {
      setActiveCategory(null);
    }
  }, [isOpen, categoryId]);

  // Determine display value based on mode
  const displayValue =
    mode === "category"
      ? selectedCategory?.name || placeholder
      : mode === "component"
        ? selectedComponent?.name || placeholder
        : selectedComponent
          ? `${selectedCategory?.name} / ${selectedComponent.name}`
          : selectedCategory
            ? selectedCategory.name
            : placeholder;

  // Category-only mode
  if (mode === "category") {
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
          <span className="spec-select__value">{displayValue}</span>
          <span className="spec-select__arrow">▼</span>
        </button>

        {isOpen && (
          <div className="spec-select__dropdown spec-select__dropdown--simple">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`spec-select__option ${categoryId === cat.id ? "spec-select__option--selected" : ""}`}
                onClick={() => handleSelectCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Component-only mode
  if (mode === "component") {
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
          <span className="spec-select__value">{displayValue}</span>
          <span className="spec-select__arrow">▼</span>
        </button>

        {isOpen && categoryId && (
          <div className="spec-select__dropdown spec-select__dropdown--simple">
            {components.map((comp) => (
              <button
                key={comp.id}
                type="button"
                className={`spec-select__option ${componentKey === comp.id ? "spec-select__option--selected" : ""}`}
                onClick={() => handleSelectComponent(categoryId, comp.id)}
              >
                {comp.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full nested mode (default)
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
        <span className="spec-select__value">{displayValue}</span>
        <span className="spec-select__arrow">▼</span>
      </button>

      {isOpen && (
        <div className="spec-select__dropdown spec-select__dropdown--nested">
          <div className="spec-select__categories">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className={`spec-select__category-item ${activeCategory === cat.id ? "spec-select__category-item--active" : ""} ${categoryId === cat.id ? "spec-select__category-item--selected" : ""}`}
                onMouseEnter={() => setActiveCategory(cat.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCategory(cat.id);
                }}
              >
                <span>{cat.name}</span>
                <span className="spec-select__arrow-right">▶</span>
              </div>
            ))}
          </div>

          {activeCategory && (
            <div className="spec-select__submenu">
              {getComponentsByCategory(activeCategory).map((comp) => (
                <button
                  key={comp.id}
                  type="button"
                  className={`spec-select__option ${componentKey === comp.id ? "spec-select__option--selected" : ""}`}
                  onClick={() => handleSelectComponent(activeCategory, comp.id)}
                >
                  {comp.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
