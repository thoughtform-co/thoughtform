"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { signOut } from "@/lib/auth";

export function UserStatus() {
  const { user, userName, isLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Don't render anything if loading or no user
  if (isLoading || !user) return null;

  return (
    <div
      className="fixed top-5 right-[clamp(48px,8vw,120px)] z-[1000]"
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
    >
      {/* User Button */}
      <div className="flex items-center gap-2 cursor-pointer py-2">
        <span
          className="font-mono text-[10px] tracking-[0.1em] uppercase transition-colors"
          style={{ color: showDropdown ? "#CAA554" : "#ECE3D6" }}
        >
          {userName || "Navigator"}
        </span>
        <span
          className="font-mono text-[8px] tracking-[0.1em]"
          style={{ color: "rgba(91, 138, 122, 0.8)" }}
        >
          ACTIVE
        </span>
        <span
          className="text-[8px] transition-transform"
          style={{
            color: "rgba(236, 227, 214, 0.3)",
            transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 pt-1">
          <div
            className="min-w-[100px]"
            style={{
              background: "#0A0908",
              border: "1px solid rgba(236, 227, 214, 0.1)",
            }}
          >
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 w-full px-3 py-3 text-left font-mono text-[10px] tracking-[0.08em] uppercase transition-colors"
              style={{ color: "rgba(236, 227, 214, 0.3)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ECE3D6";
                e.currentTarget.style.background = "rgba(236, 227, 214, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(236, 227, 214, 0.3)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
