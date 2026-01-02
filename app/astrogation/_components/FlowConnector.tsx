"use client";

import React from "react";

// ═══════════════════════════════════════════════════════════════
// FLOW CONNECTOR - Simple vertical flow with connected nodes
// ═══════════════════════════════════════════════════════════════
//
// Usage:
//   <FlowConnector>
//     <FlowConnector.Node label="Analysis" badge="AI">
//       <p>Content here</p>
//     </FlowConnector.Node>
//     <FlowConnector.Node label="Notes">
//       <textarea />
//     </FlowConnector.Node>
//     <FlowConnector.Node label="Briefing" variant="gold">
//       <div>Generated content</div>
//     </FlowConnector.Node>
//   </FlowConnector>
//
// ═══════════════════════════════════════════════════════════════

export interface FlowConnectorProps {
  children: React.ReactNode;
  className?: string;
}

export interface FlowNodeProps {
  label: string;
  badge?: string;
  variant?: "default" | "gold";
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isLast?: boolean;
  stepNumber?: number;
}

function FlowConnectorRoot({ children, className = "" }: FlowConnectorProps) {
  // Count valid children to know which is last and assign step numbers
  const childArray = React.Children.toArray(children).filter(Boolean);

  // First pass: count only FlowNode components (identified by having 'label' prop) to get step numbers
  let stepNumber = 0;
  const stepNumbers = new Map<number, number>();

  childArray.forEach((child, index) => {
    if (React.isValidElement<FlowNodeProps>(child) && "label" in child.props) {
      stepNumber++;
      stepNumbers.set(index, stepNumber);
    }
  });

  return (
    <div className={`flow-connector ${className}`}>
      {React.Children.map(childArray, (child, index) => {
        if (React.isValidElement<FlowNodeProps>(child)) {
          return React.cloneElement(child, {
            key: child.key || index,
            isLast: index === childArray.length - 1,
            stepNumber: stepNumbers.get(index),
          });
        }
        return child;
      })}
    </div>
  );
}

function FlowNode({
  label,
  badge,
  variant = "default",
  action,
  children,
  className = "",
  isLast = false,
  stepNumber,
}: FlowNodeProps) {
  const variantClass = variant === "gold" ? "flow-connector__node--gold" : "";

  return (
    <div className={`flow-connector__node ${variantClass} ${className}`}>
      {/* Line segment above the marker (hidden for first node via CSS) */}
      <div className="flow-connector__line-above" />

      {/* Diamond marker with step number */}
      <div className="flow-connector__marker">
        {stepNumber !== undefined && (
          <span className="flow-connector__marker-number">{stepNumber}</span>
        )}
      </div>

      {/* Vertical connector line (hidden on last item) */}
      {!isLast && <div className="flow-connector__line" />}

      {/* Content */}
      <div className="flow-connector__content">
        <div className="flow-connector__header">
          <span className="flow-connector__label">
            {label}
            {badge && <span className="flow-connector__badge">{badge}</span>}
          </span>
          {action && <div className="flow-connector__action">{action}</div>}
        </div>
        <div className="flow-connector__body">{children}</div>
      </div>
    </div>
  );
}

// Compound component pattern
export const FlowConnector = Object.assign(FlowConnectorRoot, {
  Node: FlowNode,
});

export default FlowConnector;
