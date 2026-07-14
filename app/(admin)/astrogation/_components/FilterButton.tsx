"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CATEGORIES } from "../catalog";

// ═══════════════════════════════════════════════════════════════
// FILTER BUTTON - Component Type & Project Filter
// Modern dropdown filter following front-end design best practices
// ═══════════════════════════════════════════════════════════════

export interface FilterState {
  categoryId: string | null;
  projectId: string | null;
}

export interface FilterButtonProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  projects?: Array<{ id: string; name: string }>;
  className?: string;
}

export function FilterButton({
  filters,
  onFiltersChange,
  projects = [],
  className = "",
}: FilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
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

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      onFiltersChange({
        ...filters,
        categoryId: filters.categoryId === categoryId ? null : categoryId,
      });
    },
    [filters, onFiltersChange]
  );

  const handleProjectToggle = useCallback(
    (projectId: string) => {
      onFiltersChange({
        ...filters,
        projectId: filters.projectId === projectId ? null : projectId,
      });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({ categoryId: null, projectId: null });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.categoryId !== null || filters.projectId !== null;
  const activeFilterCount = (filters.categoryId ? 1 : 0) + (filters.projectId ? 1 : 0);

  return (
    <div className={`filter-button-wrapper ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className={`filter-button ${isOpen ? "filter-button--open" : ""} ${hasActiveFilters ? "filter-button--active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Filter components"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 4h10M4 7h6M6 10h2" />
        </svg>
        <span className="filter-button__label">Filter</span>
        {hasActiveFilters && (
          <span
            className="filter-button__badge"
            aria-label={`${activeFilterCount} active filter${activeFilterCount !== 1 ? "s" : ""}`}
          >
            {activeFilterCount}
          </span>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`filter-button__chevron ${isOpen ? "filter-button__chevron--open" : ""}`}
        >
          <path d="M2.5 3.5L5 6L7.5 3.5" />
        </svg>
      </button>

      {isOpen && (
        <div ref={dropdownRef} className="filter-dropdown" role="menu">
          {/* Component Type Filter */}
          <div className="filter-dropdown__section">
            <div className="filter-dropdown__header">
              <span className="filter-dropdown__title">Component Type</span>
              {filters.categoryId && (
                <button
                  type="button"
                  className="filter-dropdown__clear"
                  onClick={() => handleCategoryToggle(filters.categoryId!)}
                  aria-label="Clear category filter"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="filter-dropdown__options">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`filter-dropdown__option ${filters.categoryId === category.id ? "filter-dropdown__option--selected" : ""}`}
                  onClick={() => handleCategoryToggle(category.id)}
                  role="menuitemcheckbox"
                  aria-checked={filters.categoryId === category.id}
                >
                  <span className="filter-dropdown__option-check">
                    {filters.categoryId === category.id && "✓"}
                  </span>
                  <span className="filter-dropdown__option-label">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Filter */}
          {projects.length > 0 && (
            <div className="filter-dropdown__section">
              <div className="filter-dropdown__header">
                <span className="filter-dropdown__title">Project</span>
                {filters.projectId && (
                  <button
                    type="button"
                    className="filter-dropdown__clear"
                    onClick={() => handleProjectToggle(filters.projectId!)}
                    aria-label="Clear project filter"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="filter-dropdown__options">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={`filter-dropdown__option ${filters.projectId === project.id ? "filter-dropdown__option--selected" : ""}`}
                    onClick={() => handleProjectToggle(project.id)}
                    role="menuitemcheckbox"
                    aria-checked={filters.projectId === project.id}
                  >
                    <span className="filter-dropdown__option-check">
                      {filters.projectId === project.id && "✓"}
                    </span>
                    <span className="filter-dropdown__option-label">{project.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear All */}
          {hasActiveFilters && (
            <div className="filter-dropdown__footer">
              <button
                type="button"
                className="filter-dropdown__clear-all"
                onClick={handleClearFilters}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
