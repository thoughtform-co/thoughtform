"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signOut } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParticleCanvasV2 } from "@/components/hud/ParticleCanvasV2";
import { ThoughtformSigil } from "@/components/hud/ThoughtformSigil";
import { DEFAULT_CONFIG } from "@/lib/particle-config";
import { supabase } from "@/lib/supabase";
import "./admin-styles.css";

type TerminalStep = "idle" | "email" | "password" | "authenticating" | "success" | "error";

interface TerminalLine {
  type: "system" | "prompt" | "input" | "error" | "success";
  text: string;
  timestamp?: number;
}

function AdminPageContent() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<TerminalStep>("idle");
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.toLowerCase();

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when step changes
  useEffect(() => {
    if (inputRef.current && (step === "email" || step === "password")) {
      inputRef.current.focus();
    }
  }, [step]);

  // Initialize terminal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Boot sequence when not logged in
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      bootSequence();
    }
  }, [mounted, isLoading, user]);

  // Show success when logged in
  useEffect(() => {
    if (mounted && !isLoading && user) {
      setLines([
        { type: "system", text: "THOUGHTFORM TERMINAL v2.1.0" },
        { type: "system", text: "═══════════════════════════════════════" },
        { type: "system", text: "" },
        { type: "success", text: `SESSION ACTIVE: ${user.email}` },
        { type: "system", text: "" },
        { type: "prompt", text: "Type 'exit' to sign out or 'home' to return to site" },
      ]);
      setStep("success");
    }
  }, [mounted, isLoading, user]);

  const addLine = (line: TerminalLine) => {
    setLines((prev) => [...prev, { ...line, timestamp: Date.now() }]);
  };

  const bootSequence = async () => {
    setLines([]);
    setStep("idle");

    // Simulate boot sequence
    const bootLines: TerminalLine[] = [
      { type: "system", text: "THOUGHTFORM TERMINAL v2.1.0" },
      { type: "system", text: "═══════════════════════════════════════" },
      { type: "system", text: "" },
      { type: "system", text: "Initializing secure connection..." },
    ];

    for (const line of bootLines) {
      addLine(line);
      await new Promise((r) => setTimeout(r, 150));
    }

    await new Promise((r) => setTimeout(r, 300));
    addLine({ type: "success", text: "Connection established." });
    await new Promise((r) => setTimeout(r, 200));
    addLine({ type: "system", text: "" });
    addLine({ type: "system", text: "Authentication required to proceed." });
    addLine({ type: "system", text: "" });
    addLine({ type: "prompt", text: "Enter email:" });

    setStep("email");
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = currentInput.trim();

      if (step === "success") {
        // Handle commands when logged in
        addLine({ type: "input", text: `> ${value}` });
        setCurrentInput("");

        if (value.toLowerCase() === "exit") {
          addLine({ type: "system", text: "Terminating session..." });
          await signOut();
          setStep("idle");
          setTimeout(bootSequence, 500);
        } else if (value.toLowerCase() === "home") {
          addLine({ type: "system", text: "Redirecting..." });
          router.push("/");
        } else if (value.toLowerCase() === "help") {
          addLine({ type: "system", text: "" });
          addLine({ type: "system", text: "Available commands:" });
          addLine({ type: "system", text: "  exit  - Sign out and return to login" });
          addLine({ type: "system", text: "  home  - Return to main site" });
          addLine({ type: "system", text: "  help  - Show this message" });
          addLine({ type: "system", text: "" });
        } else if (value) {
          addLine({ type: "error", text: `Command not found: ${value}` });
          addLine({ type: "system", text: "Type 'help' for available commands." });
        }
        return;
      }

      if (step === "email") {
        if (!value) return;

        // Check allowed email
        if (allowedEmail && value.toLowerCase() !== allowedEmail) {
          addLine({ type: "input", text: `> ${value}` });
          addLine({ type: "error", text: "ACCESS DENIED: Unauthorized user" });
          addLine({ type: "system", text: "" });
          addLine({ type: "prompt", text: "Enter email:" });
          setCurrentInput("");
          return;
        }

        addLine({ type: "input", text: `> ${value}` });
        setEmail(value);
        setCurrentInput("");
        addLine({ type: "prompt", text: "Enter password:" });
        setStep("password");
      } else if (step === "password") {
        if (!value) return;

        addLine({ type: "input", text: "> ••••••••" });
        setCurrentInput("");
        setStep("authenticating");
        addLine({ type: "system", text: "" });
        addLine({ type: "system", text: "Authenticating..." });

        try {
          await signInWithEmail(email, value);
          // Auth state will update via AuthProvider
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Authentication failed";
          addLine({ type: "error", text: `ERROR: ${errorMsg}` });
          addLine({ type: "system", text: "" });
          addLine({ type: "prompt", text: "Enter email:" });
          setEmail("");
          setStep("email");
        }
      }
    } else if (e.key === "Escape") {
      if (step === "email" || step === "password") {
        addLine({ type: "system", text: "^C" });
        addLine({ type: "system", text: "Session terminated by user." });
        setTimeout(() => router.push("/"), 500);
      }
    }
  };

  // Click anywhere to focus input
  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="terminal-container">
        <div className="terminal-background">
          <ParticleCanvasV2 scrollProgress={0.15} config={DEFAULT_CONFIG} />
        </div>
        <div className="terminal-sigil">
          <ThoughtformSigil
            size={500}
            color="202, 165, 84"
            particleCount={400}
            scrollProgress={1}
            particleSize={1}
            opacity={0.6}
          />
        </div>
        <div className="terminal-window">
          <div className="terminal-header">
            <span className="terminal-title">thoughtform://admin</span>
          </div>
          <div className="terminal-body">
            <div className="terminal-line system">Initializing...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="terminal-container">
        <div className="terminal-background">
          <ParticleCanvasV2 scrollProgress={0.15} config={DEFAULT_CONFIG} />
        </div>
        <div className="terminal-window">
          <div className="terminal-header">
            <span className="terminal-title">thoughtform://admin</span>
          </div>
          <div className="terminal-body">
            <div className="terminal-line error">FATAL: Supabase not configured</div>
            <div className="terminal-line system">
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-container" onClick={handleTerminalClick}>
      {/* Manifold background */}
      <div className="terminal-background">
        <ParticleCanvasV2 scrollProgress={0.15} config={DEFAULT_CONFIG} />
      </div>

      {/* Sigil overlay */}
      <div className="terminal-sigil">
        <ThoughtformSigil
          size={500}
          color="202, 165, 84"
          particleCount={400}
          scrollProgress={1}
          particleSize={1}
          opacity={0.6}
        />
      </div>

      {/* Terminal window */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-controls">
            <span className="terminal-control close" onClick={() => router.push("/")} />
            <span className="terminal-control minimize" />
            <span className="terminal-control maximize" />
          </div>
          <span className="terminal-title">thoughtform://admin</span>
        </div>

        <div className="terminal-body" ref={terminalRef}>
          {/* Rendered lines */}
          {lines.map((line, i) => (
            <div key={i} className={`terminal-line ${line.type}`}>
              {line.text}
            </div>
          ))}

          {/* Active input line */}
          {(step === "email" || step === "password" || step === "success") && (
            <div className="terminal-input-line">
              <span className="terminal-prompt">&gt;</span>
              <input
                ref={inputRef}
                type={step === "password" ? "password" : "text"}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="terminal-input"
                autoComplete={step === "email" ? "email" : "current-password"}
                autoFocus
              />
              <span className="terminal-cursor" />
            </div>
          )}

          {step === "authenticating" && (
            <div className="terminal-line system">
              <span className="terminal-spinner" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="terminal-container">
          <div className="terminal-window">
            <div className="terminal-body">
              <div className="terminal-line system">Loading...</div>
            </div>
          </div>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
